const express = require("express");
const session = require("express-session");
// const MySQLStore = require("connect-mysql2");  // Remove the (session) part
const MySQLStoreFactory = require("connect-mysql2");
const mysql = require("mysql2");
const path = require("path");
require("dotenv").config();

const db = require("./config/db");
const authRoutes = require("./routes/auth");
const appointmentRoutes = require("./routes/appointment");
const doctorRoutes = require("./routes/doctor");
const dashboardRoutes = require("./routes/api");

// initialize server
const app = express();

// setup middleware
app.use(express.json());

const mysqlConnection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
});

// configure session store
const MySQLStore = MySQLStoreFactory(session);
const sessionStore = new MySQLStore({
  pool: mysqlConnection,
  createDatabaseTable: true,
  schema: {
    tableName: "sessions",
    columnNames: {
      session_id: "session_id",
      expires: "expires",
      data: "data",
    },
  },
});

// configure session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.use(express.static(__dirname + "/public"));

// routes
// routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "src/pages", "index.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "src/pages", "register.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "src/pages", "login.html"));
});

app.get("/appointments", (req, res) => {
  res.sendFile(path.join(__dirname, "src/pages", "appointments.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "src/pages", "dashboard.html"));
});

app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "src/pages", "profile.html"));
});

app.get("/dash", (req, res) => {
  res.sendFile(path.join(__dirname, "src/pages", "dash.html"));
});

app.use("/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/dashboard", dashboardRoutes);

// start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
