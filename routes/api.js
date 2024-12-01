const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

router.get("/stats", authenticateToken, async (req, res) => {
  const role = req.user.role;
  const userId = req.user.id;

  try {
    let stats = [];

    switch (role) {
      case "patient":
        const [patientRows] = await db.execute(
          "SELECT id FROM patients WHERE user_id = ?",
          [userId]
        );

        if (patientRows.length === 0) {
          break;
        }

        const patient_id = patientRows[0].id;

        const [upcomingAppts] = await db.execute(
          "SELECT COUNT(*) as count FROM appointments WHERE patient_id = ? AND appointment_date >= CURDATE()",
          [patient_id]
        );
        const [pastAppts] = await db.execute(
          "SELECT COUNT(*) as count FROM appointments WHERE patient_id = ? AND appointment_date < CURDATE()",
          [patient_id]
        );
        const [prescriptions] = [];

        stats = [
          {
            label: "Upcoming Appointments",
            value: upcomingAppts[0]?.count ?? 0,
          },
          {
            label: "Past Appointments",
            value: pastAppts[0]?.count ?? 0,
          },
          //   {
          //     label: "Prescriptions",
          //     value: prescriptions[0]?.count ?? 0,
          //   },
          {
            label: "Medical Records",
            value: 0,
          },
        ];
        break;

      case "doctor":
        const [doctorRows] = await db.execute(
          "SELECT id FROM doctors WHERE user_id = ?",
          [userId]
        );

        if (doctorRows.length === 0) {
          break;
        }

        const doctor_id = doctorRows[0].id;

        const [todayAppts] = await db.execute(
          "SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND DATE(appointment_date) = CURDATE()",
          [doctor_id]
        );
        const [totalPatients] = await db.execute(
          "SELECT COUNT(DISTINCT patient_id) as count FROM appointments WHERE doctor_id = ?",
          [doctor_id]
        );

        stats = [
          {
            label: "Today's Appointments",
            value: todayAppts[0]?.count ?? 0,
          },
          {
            label: "Total Patients",
            value: totalPatients[0]?.count ?? 0,
          },
          {
            label: "Available Slots",
            value: 0,
          },
          {
            label: "Completed Appointments",
            value: 0,
          },
        ];
        break;

      case "admin":
        const [totalUsers] = await db.execute(
          "SELECT COUNT(*) as count FROM users"
        );
        const [activeDoctors] = await db.execute(
          "SELECT COUNT(*) as count FROM doctors"
        );
        const [todayAllAppts] = await db.execute(
          "SELECT COUNT(*) as count FROM appointments WHERE DATE(appointment_date) = CURDATE()"
        );
        // const [newUsers] = await db.execute(
        //   "SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()"
        // );
        const [newUsers] = [{}];

        stats = [
          {
            label: "Total Users",
            value: totalUsers[0]?.count ?? 0,
          },
          {
            label: "Active Doctors",
            value: activeDoctors[0]?.count ?? 0,
          },
          {
            label: "Today's Appointments",
            value: todayAllAppts[0]?.count ?? 0,
          },
          {
            label: "New Registrations",
            value: newUsers[0]?.count ?? 0,
          },
        ];
        break;
    }

    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      message: "Error fetching dashboard stats",
      stats: getDefaultStats(role), // Return default stats on error
    });
  }
});

function getDefaultStats(role) {
  // Same default stats as frontend for consistency
  const statsMap = {
    patient: [
      { label: "Upcoming Appointments", value: 0 },
      { label: "Past Appointments", value: 0 },
      { label: "Prescriptions", value: 0 },
      { label: "Medical Records", value: 0 },
    ],
    // ... other roles
  };
  return statsMap[role] || [];
}

module.exports = router;
