const db = require("../config/db");

const doctorController = {
  // Create: Admin adds new doctor
  async createDoctor(req, res) {
    const {
      first_name,
      last_name,
      email,
      password,
      specialization,
      phone,
      schedule,
    } = req.body;

    try {
      // First create user account
      const hashedPassword = await bcrypt.hash(password, 10);
      const [userResult] = await db.execute(
        'INSERT INTO users (email, password_hash, role) VALUES (?, ?, "doctor")',
        [email, hashedPassword]
      );

      // Then create doctor profile
      await db.execute(
        "INSERT INTO doctors (first_name, last_name, specialization, user_id, phone, schedule) VALUES (?, ?, ?, ?, ?, ?)",
        [
          first_name,
          last_name,
          specialization,
          userResult.insertId,
          phone,
          JSON.stringify(schedule || {}),
        ]
      );

      res.status(201).json({ message: "Doctor created successfully" });
    } catch (error) {
      console.error("Error creating doctor:", error);
      res.status(500).json({ message: "Error creating doctor profile" });
    }
  },
  async updateDoctor(req, res) {
    const { id } = req.params;
    const { first_name, last_name, specialization, phone, schedule } = req.body;

    try {
      // Check if user is admin or the doctor themselves
      if (req.user.role !== "admin" && req.user.id !== id) {
        return res
          .status(403)
          .json({ message: "Unauthorized to update this profile" });
      }

      await db.execute(
        `
                    UPDATE doctors 
                    SET first_name = ?, last_name = ?, specialization = ?, 
                        phone = ?, schedule = ?
                    WHERE id = ?
                `,
        [
          first_name,
          last_name,
          specialization,
          phone,
          JSON.stringify(schedule),
          id,
        ]
      );

      res.json({ message: "Doctor profile updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error updating doctor profile" });
    }
  },
  async deleteDoctor(req, res) {
    const { id } = req.params;

    try {
      // Check if user is admin
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Unauthorized to delete doctors" });
      }

      // Get user_id from doctors table
      const [doctor] = await db.execute(
        "SELECT user_id FROM doctors WHERE id = ?",
        [id]
      );

      if (doctor.length === 0) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      // Start transaction
      await db.beginTransaction();

      try {
        // Delete from doctors table
        await db.execute("DELETE FROM doctors WHERE id = ?", [id]);
        // Delete from users table
        await db.execute("DELETE FROM users WHERE id = ?", [doctor[0].user_id]);

        await db.commit();
        res.json({ message: "Doctor profile deleted successfully" });
      } catch (error) {
        await db.rollback();
        throw error;
      }
    } catch (error) {
      console.error("Error deleting doctor:", error);
      res.status(500).json({ message: "Error deleting doctor profile" });
    }
  },

  async getDoctors(req, res) {
    try {
      const [rows] = await db.execute(`
                  SELECT 
                      CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
                      d.id,
                      d.specialization,
                      d.phone,
                      d.schedule
                  FROM doctors d
                  ORDER BY d.last_name, d.first_name
              `);

      res.status(200).json(rows);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      res
        .status(500)
        .json({ message: "An error occurred while fetching doctors." });
    }
  },

  async getAvailableTimes(req, res) {
    const { doctor_id, date } = req.query;

    if (!doctor_id || !date) {
      return res
        .status(400)
        .json({ message: "Doctor ID and date are required" });
    }

    try {
      // First, get doctor's schedule
      const [doctorRows] = await db.execute(
        "SELECT schedule FROM doctors WHERE id = ?",
        [doctor_id]
      );

      if (doctorRows.length === 0) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      let doctorSchedule;
      try {
        // Handle cases where schedule might already be an object or needs parsing
        doctorSchedule =
          typeof doctorRows[0].schedule === "string"
            ? JSON.parse(doctorRows[0].schedule)
            : doctorRows[0].schedule;
      } catch (parseError) {
        console.error("Schedule parsing error:", doctorRows[0].schedule);
        return res.status(500).json({ message: "Invalid schedule format" });
      }

      const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daySchedule = doctorSchedule[dayOfWeek] || [];

      // Get existing appointments for this doctor on this date
      const [appointmentRows] = await db.execute(
        "SELECT appointment_time FROM appointments WHERE doctor_id = ? AND appointment_date = ?",
        [doctor_id, date]
      );

      const bookedTimes = appointmentRows.map((row) => row.appointment_time);

      // Filter out booked times from available times
      const availableTimes = daySchedule.filter(
        (time) => !bookedTimes.includes(time)
      );

      res.status(200).json(availableTimes);
    } catch (error) {
      console.error("Error fetching available times:", error);
      res.status(500).json({
        message: "An error occurred while fetching available times.",
        error: error.message,
      });
    }
  },
  async getSchedule(req, res) {
    const doctor_id = req.params.id;
    try {
      const [rows] = await db.execute(
        "SELECT schedule FROM doctors WHERE id = ?",
        [doctor_id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      const schedule = JSON.parse(rows[0].schedule || "{}");
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Error fetching schedule" });
    }
  },

  // Update doctor's schedule
  async updateSchedule(req, res) {
    const doctor_id = req.user.id;
    const { schedule } = req.body;

    try {
      await db.execute("UPDATE doctors SET schedule = ? WHERE user_id = ?", [
        JSON.stringify(schedule),
        doctor_id,
      ]);
      res.json({ message: "Schedule updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error updating schedule" });
    }
  },

  // Update doctor's specialization
  async updateSpecialization(req, res) {
    const doctor_id = req.user.id;
    const { specialization } = req.body;

    try {
      await db.execute(
        "UPDATE doctors SET specialization = ? WHERE user_id = ?",
        [specialization, doctor_id]
      );
      res.json({ message: "Specialization updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error updating specialization" });
    }
  },
};

module.exports = doctorController;
