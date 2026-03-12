const express = require("express")
const cors = require("cors")
const session = require("express-session")
const passport = require("./auth/googleAuth")

const app = express()

app.use(cors())
app.use(express.json())

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret123",
    resave: false,
    saveUninitialized: false
  })
)

// Passport authentication
app.use(passport.initialize())
app.use(passport.session())

// Existing route
app.use("/api/onboarding", require("./routes/onboarding"))

// UV API route
app.use("/api/uv", require("./routes/uv"))

// Google login route
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
)

// Google callback
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.send("Login successful")
  }
)

app.get("/test", (req, res) => {
  res.send("Server is working")
})

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000")
})