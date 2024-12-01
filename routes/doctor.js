const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");
const authenticateToken = require("../middleware/authMiddleware");

router.get("/", authenticateToken, doctorController.getDoctors);
router.get("/available-times", authenticateToken, doctorController.getAvailableTimes);
router.get("/schedule/:id", authenticateToken, doctorController.getSchedule);
router.put("/schedule", authenticateToken, doctorController.updateSchedule);
router.put("/specialization", authenticateToken, doctorController.updateSpecialization);

module.exports = router;
