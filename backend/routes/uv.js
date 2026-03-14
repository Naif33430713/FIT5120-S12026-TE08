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

    const apiKey = process.env.OPENWEATHER_API_KEY
    const weather = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
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

    res.json({
      uv_index: uvIndex,
      risk_level: guidance.risk_level,
      clothing: guidance.clothing_text,
      sunscreen: guidance.sunscreen_dosage_text,
      reapply_minutes: guidance.reapply_minutes
    })

  } catch (error) {
    console.error("UV API ERROR:", error.message)
    res.status(500).json({ error: "UV service error" })
  }
})

module.exports = router