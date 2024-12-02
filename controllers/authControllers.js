const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Simple in-memory token blacklist (replace with Redis in production)
const tokenBlacklist = new Set();

// User registration function
exports.registerUser = async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    address,
    phone,
    gender,
    password,
    date_of_birth,
  } = req.body;

  const user_type = "patient";

  try {
    // Check if user exists in database
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate username from email (everything before @)
    const username = email.split("@")[0];

    // Updated INSERT query to include username
    const [user] = await db.execute(
      "INSERT INTO users (email, username, role, password_hash) VALUES (?, ?, ?, ?)",
      [email, username, user_type ? user_type : "admin", hashedPassword]
    );

    const user_id = user.insertId;

    await db.execute(
      "INSERT INTO patients (first_name, last_name, address, phone, gender, date_of_birth, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [first_name, last_name, address, phone, gender, date_of_birth, user_id]
    );

    res.status(201).json({ message: "Registration successful." });
  } catch (error) {
    res.status(500).json({ message: "An error occurred.", error });
  }
};

// User login function
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role, // if you have roles
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
};

// Logout function
exports.logoutUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      // Add the token to the blacklist
      tokenBlacklist.add(token);

      res.json({ message: "Logout successful" });
    } else {
      res.status(400).json({ message: "No token provided" });
    }
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "An error occurred during logout" });
  }
};

// Add this middleware to check for blacklisted tokens
exports.checkTokenBlacklist = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ message: "Token has been invalidated" });
    }
  }

  next();
};

exports.getUser = async (req, res) => {
  try {
    const [userRows] = await db.execute(
      "SELECT id, email, role FROM users WHERE id = ?",
      [req.user.id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userRows[0];

    // Get additional info based on role
    if (user.role === "patient") {
      const [patientRows] = await db.execute(
        "SELECT first_name, last_name FROM patients WHERE user_id = ?",
        [user.id]
      );
      if (patientRows.length > 0) {
        user.name = `${patientRows[0].first_name} ${patientRows[0].last_name}`;
      }
    } else if (user.role === "doctor") {
      const [doctorRows] = await db.execute(
        "SELECT first_name, last_name FROM doctors WHERE user_id = ?",
        [user.id]
      );
      if (doctorRows.length > 0) {
        user.name = `Dr. ${doctorRows[0].first_name} ${doctorRows[0].last_name}`;
      }
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Error fetching user data" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // From JWT middleware
    const { first_name, last_name, address, phone, gender, date_of_birth } =
      req.body;

    // First get the user's role
    const [userRows] = await db.execute("SELECT role FROM users WHERE id = ?", [
      userId,
    ]);

    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userRole = userRows[0].role;

    if (userRole === "patient") {
      await db.execute(
        `
                UPDATE patients 
                SET first_name = ?, last_name = ?, address = ?, 
                    phone = ?, gender = ?, date_of_birth = ?
                WHERE user_id = ?`,
        [first_name, last_name, address, phone, gender, date_of_birth, userId]
      );
    } else if (userRole === "doctor") {
      await db.execute(
        `
                UPDATE doctors 
                SET first_name = ?, last_name = ?, phone = ?
                WHERE user_id = ?`,
        [first_name, last_name, phone, userId]
      );
    }

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user basic info
    const [userRows] = await db.execute(
      `
            SELECT id, email, username, role 
            FROM users 
            WHERE id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userProfile = userRows[0];

    // Get role-specific information
    if (userProfile.role === "patient") {
      const [patientRows] = await db.execute(
        `
                SELECT first_name, last_name, address, phone, 
                       gender, date_of_birth
                FROM patients 
                WHERE user_id = ?`,
        [userId]
      );
      Object.assign(userProfile, patientRows[0]);
    } else if (userProfile.role === "doctor") {
      const [doctorRows] = await db.execute(
        `
                SELECT first_name, last_name, phone, specialization
                FROM doctors 
                WHERE user_id = ?`,
        [userId]
      );
      Object.assign(userProfile, doctorRows[0]);
    }

    res.json(userProfile);
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

exports.getAppointmentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const [userRows] = await db.execute("SELECT role FROM users WHERE id = ?", [
      userId,
    ]);
    const userRole = userRows[0].role;

    let appointments;
    if (userRole === "patient") {
      [appointments] = await db.execute(
        `
                SELECT 
                    a.id,
                    a.appointment_date,
                    a.status,
                    a.notes,
                    d.first_name as doctor_first_name,
                    d.last_name as doctor_last_name
                FROM appointments a
                JOIN doctors d ON a.doctor_id = d.id
                WHERE a.patient_id = (
                    SELECT id FROM patients WHERE user_id = ?
                )
                ORDER BY a.appointment_date DESC`,
        [userId]
      );
    } else if (userRole === "doctor") {
      [appointments] = await db.execute(
        `
                SELECT 
                    a.id,
                    a.appointment_date,
                    a.status,
                    a.notes,
                    p.first_name as patient_first_name,
                    p.last_name as patient_last_name
                FROM appointments a
                JOIN patients p ON a.patient_id = p.id
                WHERE a.doctor_id = (
                    SELECT id FROM doctors WHERE user_id = ?
                )
                ORDER BY a.appointment_date DESC`,
        [userId]
      );
    }

    res.json(appointments);
  } catch (error) {
    console.error("Appointment history fetch error:", error);
    res.status(500).json({ message: "Error fetching appointment history" });
  }
};
