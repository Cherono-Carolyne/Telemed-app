const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  checkTokenBlacklist,
  getUser,
  updateProfile,
  getProfile,
  getAppointmentHistory,
} = require("../controllers/authControllers");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");

// user registration
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", checkTokenBlacklist, logoutUser);
router.get("/me", authenticateToken, getUser);

// Profile management routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.get('/appointments/history', authenticateToken, getAppointmentHistory);

module.exports = router;
