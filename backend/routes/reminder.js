const express = require("express")
const router = express.Router()
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

/*
-------------------------------------
GET REMINDER (load reminder)
-------------------------------------
*/
router.get("/", async (req, res) => {

  try {

    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" })
    }

    const reminder = await prisma.reminder.findFirst({
      where: {
        user_id: req.user.user_id,
        is_active: true
      }
    })

    res.json(reminder || {})

  } catch (error) {

    console.error("Reminder load error:", error)

    res.status(500).json({
      error: "Reminder fetch failed"
    })

  }

})

/*
-------------------------------------
CREATE REMINDER
-------------------------------------
*/
router.post("/", async (req, res) => {

  try {

    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" })
    }

    const { interval_minutes } = req.body

    if (!interval_minutes || isNaN(interval_minutes)) {
      return res.status(400).json({
        error: "interval_minutes must be a number"
      })
    }

    const minutes = Number(interval_minutes)

    const nextTrigger = new Date(Date.now() + minutes * 60000)

    const reminder = await prisma.reminder.create({
      data: {
        user_id: req.user.user_id,
        interval_minutes: minutes,
        is_active: true,
        next_trigger_time: nextTrigger,
        status: "active"
      }
    })

    res.json(reminder)

  } catch (error) {

    console.error("Reminder creation error:", error)

    res.status(500).json({
      error: "Reminder creation failed"
    })

  }

})

/*
-------------------------------------
DISABLE REMINDER
-------------------------------------
*/
router.post("/disable", async (req, res) => {

  try {

    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" })
    }

    await prisma.reminder.updateMany({
      where: {
        user_id: req.user.user_id
      },
      data: {
        is_active: false,
        status: "disabled"
      }
    })

    res.json({ message: "Reminder disabled" })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Disable reminder failed"
    })

  }

})

module.exports = router