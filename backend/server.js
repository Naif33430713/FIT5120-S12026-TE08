const express = require("express")
const cors = require("cors")

const app = express()

app.use(
  cors({
    origin: "http://localhost:5173",
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

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000")
})