const express = require("express")
const cors = require("cors")

const app = express()

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173"

app.set("trust proxy", 1)

app.use(
  cors({
    origin: FRONTEND_URL,
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