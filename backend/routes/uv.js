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


    // use OpenWeather's daily data for today
    let peakUvIndex = null
    let peakUvTime = null
    let maxTemp = null

    if (Array.isArray(data.daily) && data.daily[0]) {
      if (typeof data.daily[0].uvi === "number") {
        peakUvIndex = data.daily[0].uvi
        // we intentionally do not set a specific time; frontend will just show the peak value
      }
      if (data.daily[0].temp && typeof data.daily[0].temp.max === "number") {
        maxTemp = data.daily[0].temp.max
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
    if (peakUvIndex != null) payload.peak_uv_index = peakUvIndex
    if (peakUvTime != null) payload.peak_uv_time = peakUvTime
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