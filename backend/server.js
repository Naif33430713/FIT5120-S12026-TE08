const express = require("express")
const cors = require("cors")
const session = require("express-session")
const passport = require("./auth/googleAuth")

const app = express()

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
)

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

// Existing routes
app.use("/api/onboarding", require("./routes/onboarding"))
app.use("/api/uv", require("./routes/uv"))
app.use("/api/reminder", require("./routes/reminder"))

/*
-------------------------------------
Google Authentication
-------------------------------------
*/

// Login route
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
)

// Callback route
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {

    // redirect to Vue dashboard
    res.redirect("http://localhost:5173/dashboard")

  }
)

/*
-------------------------------------
Auth check endpoint
-------------------------------------
*/

app.get("/api/auth/user", (req, res) => {

  if (req.user) {

    res.json(req.user)

  } else {

    res.status(401).json({ message: "Not authenticated" })

  }

})

/*
-------------------------------------
Logout
-------------------------------------
*/

app.get("/api/auth/logout", (req, res) => {

  req.logout(() => {

    res.redirect("http://localhost:5173")

  })

})

app.get("/test", (req, res) => {
  res.send("Server is working")
})

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000")
})