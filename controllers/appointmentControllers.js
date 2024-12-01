const jwt = require("jsonwebtoken");
const db = require("../config/db");

async function bookAppointment(req, res) {
  const { doctor_id, appointment_date, appointment_time } = req.body;

  try {
    // First, get the patient_id from the patients table using the user_id
    const [patientRows] = await db.execute(
      "SELECT id FROM patients WHERE user_id = ?",
      [req.user.id]
    );

    if (patientRows.length === 0) {
      return res.status(404).json({
        message:
          "Patient record not found. Please complete your profile first.",
      });
    }

    const patient_id = patientRows[0].id;

    // const status = 'scheduled';

    const [rows] = await db.execute(
      "INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status) VALUES (?, ?, ?, ?, ?)",
      [patient_id, doctor_id, appointment_date, appointment_time, "scheduled"]
    );

    res.status(201).json({ message: "Booking successful." });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({
      message: "An error occurred while booking the appointment.",
      error: error.message,
    });
  }
}

async function getAppointment(req, res) {
  const { id } = req.query;

  try {
    const [rows] = await db.execute("SELECT * FROM appointments WHERE id = ?", [
      id,
    ]);
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while fetching the appointment.",
      error: error.message,
    });
  }
}

async function getMyAppointments(req, res) {
  try {
    // Get the patient_id from the patients table using the user_id
    const [patientRows] = await db.execute(
      "SELECT id FROM patients WHERE user_id = ?",
      [req.user.id]
    );

    if (patientRows.length === 0) {
      return res.status(404).json({
        message: "Patient record not found",
      });
    }

    const patient_id = patientRows[0].id;

    // Use parameterized query to prevent SQL injection
    const [rows] = await db.execute(
      `
      SELECT 
        a.*,
        CONCAT(d.first_name, ' ', d.last_name) as doctor_name
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `,
      [patient_id]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error in getMyAppointments:", error);
    res.status(500).json({
      message: "An error occurred while fetching appointments.",
      error: error.message,
    });
  }
}

async function deleteAppointment(req, res) {
  const { id } = req.query;

  try {
    await db.execute("DELETE FROM appointments WHERE id = ?", [id]);
    res.status(200).json({ message: "Appointment deleted successfully." });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while deleting the appointment.",
      error: error.message,
    });
  }
}

async function cancelAppointment(req, res) {
  const { id } = req.params;

  try {
    await db.execute("UPDATE appointments SET status=? WHERE id = ?", [
      "canceled",
      id,
    ]);
    res.status(200).json({ message: "Appointment cancelled successfully." });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while updating the appointment.",
      error: error.message,
    });
  }
}

async function updateAppointment(req, res) {
  const { doctor_id, appointment_date, appointment_time, id } = req.body;

  try {
    // Get the patient_id from the patients table
    const [patientRows] = await db.execute(
      "SELECT id FROM patients WHERE user_id = ?",
      [req.user.id]
    );

    if (patientRows.length === 0) {
      return res.status(404).json({
        message: "Patient record not found",
      });
    }

    const patient_id = patientRows[0].id;

    const [rows] = await db.execute(
      "UPDATE appointments SET patient_id = ?, doctor_id = ?, appointment_date = ?, appointment_time = ?, status = ? WHERE id = ?",
      [patient_id, doctor_id, appointment_date, appointment_time, "pending", id]
    );

    res.status(200).json({ message: "Update successful." });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      message: "An error occurred while updating the appointment.",
      error: error.message,
    });
  }
}

module.exports = {
  bookAppointment,
  getAppointment,
  getMyAppointments,
  deleteAppointment,
  updateAppointment,
  cancelAppointment,
};
