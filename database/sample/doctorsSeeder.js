const db = require("../../config/db");

const DUMMY_DOCTORS = [
  {
    user: {
      username: "dr.smith",
      password_hash:
        "$2a$10$HMmq6EwufazagEbs/.8tQ.mGFYln1tJ5kei5AFP7kM2dBLO/KjVRC", // You should use proper password hashing in production
      role: "doctor",
      email: "dr.smith@hospital.com",
    },
    doctor: {
      first_name: "John",
      last_name: "Smith",
      specialization: "Cardiology",
      phone: "555-0101",
      schedule: JSON.stringify({
        monday: "9:00-17:00",
        tuesday: "9:00-17:00",
        wednesday: "9:00-17:00",
        thursday: "9:00-17:00",
        friday: "9:00-13:00",
      }),
    },
  },
  {
    user: {
      username: "dr.jones",
      password_hash:
        "$2a$10$HMmq6EwufazagEbs/.8tQ.mGFYln1tJ5kei5AFP7kM2dBLO/KjVRC",
      role: "doctor",
      email: "dr.jones@hospital.com",
    },
    doctor: {
      first_name: "Sarah",
      last_name: "Jones",
      specialization: "Pediatrics",
      phone: "555-0102",
      schedule: JSON.stringify({
        monday: "10:00-18:00",
        tuesday: "10:00-18:00",
        wednesday: "10:00-18:00",
        thursday: "10:00-18:00",
        friday: "10:00-14:00",
      }),
    },
  },
  {
    user: {
      username: "dr.patel",
      password_hash:
        "$2a$10$HMmq6EwufazagEbs/.8tQ.mGFYln1tJ5kei5AFP7kM2dBLO/KjVRC",
      role: "doctor",
      email: "dr.patel@hospital.com",
    },
    doctor: {
      first_name: "Raj",
      last_name: "Patel",
      specialization: "Orthopedics",
      phone: "555-0103",
      schedule: JSON.stringify({
        monday: "8:00-16:00",
        tuesday: "8:00-16:00",
        wednesday: "8:00-16:00",
        thursday: "8:00-16:00",
        friday: "8:00-12:00",
      }),
    },
  },
];

class DoctorSeeder {
  constructor(connection) {
    this.db = connection;
  }

  async seed() {
    let connection;
    try {
      connection = await this.db.getConnection();
      await connection.beginTransaction();

      for (const data of DUMMY_DOCTORS) {
        // Insert user first
        const [userResult] = await connection.query(
          "INSERT INTO users (username, password_hash, role, email) VALUES (?, ?, ?, ?)",
          [
            data.user.username,
            data.user.password_hash,
            data.user.role,
            data.user.email,
          ]
        );

        // Insert doctor with the user_id
        await connection.query(
          "INSERT INTO doctors (first_name, last_name, specialization, user_id, phone, schedule) VALUES (?, ?, ?, ?, ?, ?)",
          [
            data.doctor.first_name,
            data.doctor.last_name,
            data.doctor.specialization,
            userResult.insertId,
            data.doctor.phone,
            data.doctor.schedule,
          ]
        );
      }

      await connection.commit();
      console.log("✅ Doctor seeding completed successfully");
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      console.error("❌ Doctor seeding failed:", error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
}

// Execute seeder if run directly
if (require.main === module) {
  const seeder = new DoctorSeeder(db);
  seeder
    .seed()
    .then(() => {
      console.log("✨ Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}

module.exports = DoctorSeeder;
