const express = require("express")
const router = express.Router()
const axios = require("axios")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

router.get("/", async (req, res) => {
  try {

    const { lat, lon } = req.query

    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude and longitude required" })
    }

    const latNum = Number(lat)
    const lonNum = Number(lon)

    if (Number.isNaN(latNum) || Number.isNaN(lonNum)) {
      return res.status(400).json({ error: "Invalid coordinates" })
    }

    const AUS_LAT_MIN = -44
    const AUS_LAT_MAX = -10
    const AUS_LON_MIN = 113
    const AUS_LON_MAX = 154

    if (latNum < AUS_LAT_MIN || latNum > AUS_LAT_MAX || lonNum < AUS_LON_MIN || lonNum > AUS_LON_MAX) {
      return res.status(400).json({ error: "Location must be within Australia" })
    }

    const apiKey = process.env.OPENWEATHER_API_KEY
    const oneCall = await axios.get(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${latNum}&lon=${lonNum}&appid=${apiKey}&units=metric&exclude=minutely,alerts`
    )

    const data = oneCall.data || {}
    const current = data.current || {}
    const timezoneOffset = typeof data.timezone_offset === "number" ? data.timezone_offset : null

    const rawUvIndex = typeof current.uvi === "number" ? current.uvi : 0
    const uvIndex = Number(rawUvIndex)

    const guidance = await prisma.uVGuidance.findFirst({
      where: {
        uv_min: { lte: uvIndex },
        uv_max: { gte: uvIndex }
      }
    })
    // use OpenWeather's daily + hourly data for today
    let peakUvIndex = null
    let peakUvTime = null
    let maxTemp = null

    if (Array.isArray(data.daily) && data.daily[0]) {
      if (typeof data.daily[0].uvi === "number") {
        peakUvIndex = data.daily[0].uvi
      }
      if (data.daily[0].temp && typeof data.daily[0].temp.max === "number") {
        maxTemp = data.daily[0].temp.max
      }
    }

    // approximate time of peak UV using the first 24 hours of hourly data
    if (Array.isArray(data.hourly) && data.hourly.length > 0) {
      let best = null
      for (let i = 0; i < data.hourly.length && i < 24; i++) {
        const h = data.hourly[i]
        if (typeof h.uvi !== "number" || typeof h.dt !== "number") continue
        if (!best || h.uvi > best.uvi) {
          best = { uvi: h.uvi, dt: h.dt }
        }
      }
      if (best && typeof best.dt === "number") {
        peakUvTime = best.dt
      }
    }

    const w = current
    const payload = {
      uv_index: uvIndex,
      risk_level: guidance.risk_level,
      clothing: guidance.clothing_text,
      sunscreen: guidance.sunscreen_dosage_text,
      reapply_minutes: 120
    }
    if (peakUvIndex != null) {
      payload.peak_uv_index = peakUvIndex
      // derive a qualitative label for peak UV, similar to frontend buckets
      if (peakUvIndex <= 2) payload.peak_uv_label = "Low"
      else if (peakUvIndex <= 5) payload.peak_uv_label = "Moderate"
      else if (peakUvIndex <= 7) payload.peak_uv_label = "High"
      else if (peakUvIndex <= 10) payload.peak_uv_label = "Very High"
      else payload.peak_uv_label = "Extreme"
    }
    if (peakUvTime != null) payload.peak_uv_time = peakUvTime

    // 5-day forecast from daily data (days 0-4)
    if (Array.isArray(data.daily) && data.daily.length > 0) {
      payload.forecast = data.daily.slice(0, 5).map((day) => {
        const entry = { dt: day.dt }
        if (day.weather && day.weather[0] && day.weather[0].id != null) {
          entry.weather_id = day.weather[0].id
        }
        if (day.temp && typeof day.temp.max === "number") {
          entry.max_temp = day.temp.max
        }
        if (typeof day.uvi === "number") {
          entry.uvi = day.uvi
        }
        return entry
      })
    }

    if (typeof w.temp === "number") payload.temperature = w.temp
    if (maxTemp != null) payload.max_temperature = maxTemp
    if (w.sunrise != null) payload.sunrise = w.sunrise
    if (w.sunset != null) payload.sunset = w.sunset
    if (w.weather != null && w.weather[0] != null && w.weather[0].id != null) payload.weather_id = w.weather[0].id
    if (timezoneOffset != null) payload.timezone = timezoneOffset

    res.json(payload)

  } catch (error) {
    console.error("UV API ERROR:", error.message)
    res.status(500).json({ error: "UV service error" })
  }
})

module.exports = router