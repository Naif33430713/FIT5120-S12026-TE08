const express = require("express")
const cors = require("cors")
const session = require("express-session")
const passport = require("./auth/googleAuth")

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

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }
  })
)

app.use(passport.initialize())
app.use(passport.session())

app.use("/api/onboarding", require("./routes/onboarding"))
app.use("/api/uv", require("./routes/uv"))
app.use("/api/reminder", require("./routes/reminder"))

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
)

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect(`${FRONTEND_URL}/dashboard`)
  }
)

app.get("/api/auth/user", (req, res) => {
  if (req.user) {
    res.json(req.user)
  } else {
    res.status(401).json({ message: "Not authenticated" })
  }
})

app.get("/api/auth/logout", (req, res) => {
  req.logout(() => {
    res.redirect(FRONTEND_URL)
  })
})

app.get("/test", (req, res) => {
  res.send("Server is working")
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})