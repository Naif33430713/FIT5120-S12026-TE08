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
    const weather = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latNum}&lon=${lonNum}&appid=${apiKey}&units=metric`
    )

    // fallback UV approximation (OpenWeather free plan limitation)
    const rawUvIndex = weather.data.uvi || weather.data.clouds?.all / 10 || 5
    const uvIndex = Number(rawUvIndex)
    const uvBucket = Math.floor(uvIndex)

    const guidance = await prisma.uVGuidance.findFirst({
      where: {
        uv_min: { lte: uvBucket },
        uv_max: { gte: uvBucket }
      }
    })

    if (!guidance) {
      return res.json({
        uv_index: uvIndex,
        message: "No UV guidance rule found"
      })
    }

    const w = weather.data
    const payload = {
      uv_index: uvIndex,
      risk_level: guidance.risk_level,
      clothing: guidance.clothing_text,
      sunscreen: guidance.sunscreen_dosage_text,
      reapply_minutes: guidance.reapply_minutes
    }
    if (w.main != null && typeof w.main.temp === "number") payload.temperature = w.main.temp
    if (w.sys != null && w.sys.sunrise != null) payload.sunrise = w.sys.sunrise
    if (w.sys != null && w.sys.sunset != null) payload.sunset = w.sys.sunset
    if (w.weather != null && w.weather[0] != null && w.weather[0].id != null) payload.weather_id = w.weather[0].id
    if (typeof w.timezone === "number") payload.timezone = w.timezone

    res.json(payload)

  } catch (error) {
    console.error("UV API ERROR:", error.message)
    res.status(500).json({ error: "UV service error" })
  }
})

module.exports = router