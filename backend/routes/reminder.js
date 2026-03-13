const express = require("express")
const router = express.Router()
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

/*
-------------------------------------
CREATE REMINDER
-------------------------------------
*/
router.post("/create", async (req, res) => {

  try {

    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" })
    }

    const { interval_minutes } = req.body

    const reminder = await prisma.reminder.create({

      data: {

        interval_minutes: interval_minutes,
        is_active: true,
        next_trigger_time: new Date(Date.now() + interval_minutes * 60000),
        status: "active",

        user: {
          connect: {
            user_id: req.user.user_id
          }
        }

      }

    })

    res.json(reminder)

  } catch (err) {

    console.error("Reminder creation error:", err)

    res.status(500).json({
      error: "Reminder creation failed",
      details: err.message
    })

  }

})

/*
-------------------------------------
GET REMINDER
-------------------------------------
*/
router.get("/", async (req,res)=>{

  try{

    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" })
    }

    const reminder = await prisma.reminder.findFirst({

      where:{
        user_id:req.user.id,
        is_active:true
      }

    })

    res.json(reminder)

  }catch(err){

    console.error("Reminder lookup error:", err)
    res.status(500).json({error:"Reminder lookup failed"})

  }

})

/*
-------------------------------------
DISABLE REMINDER
-------------------------------------
*/
router.post("/disable", async (req,res)=>{

  try{

    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" })
    }

    await prisma.reminder.updateMany({

      where:{
        user_id:req.user.user_id
      },

      data:{
        is_active:false,
        status:"disabled"
      }

    })

    res.json({message:"Reminder disabled"})

  }catch(err){

    console.error("Reminder disable error:", err)
    res.status(500).json({error:"Disable failed"})

  }

})

module.exports = router