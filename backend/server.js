  const express = require("express")
const cors = require("cors")

const app = express()

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173"

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL
]

app.set("trust proxy", 1)

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true
  })
)

app.use(express.json())

// Public API routes
app.use("/api/onboarding", require("./routes/onboarding"))
app.use("/api/uv", require("./routes/uv"))

app.get("/test", (req, res) => {
  res.send("Server is working")
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})