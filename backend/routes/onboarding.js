const express = require("express")
const router = express.Router()

// Test API
router.get("/", (req, res) => {
  res.json({
    message: "Onboarding API working"
  })
})

module.exports = router