const express = require("express");
const {
  bookAppointment,
  getAppointment,
  getMyAppointments,
  updateAppointment,
  deleteAppointment,
  cancelAppointment,
} = require("../controllers/appointmentControllers");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/book", authenticateToken, bookAppointment);
router.get("/appointment", authenticateToken, getAppointment);
router.get("/mine", authenticateToken, getMyAppointments);
router.post("/update", authenticateToken, updateAppointment);
router.post("/delete", authenticateToken, deleteAppointment);
router.put("/:id/cancel", authenticateToken, cancelAppointment);

module.exports = router;
