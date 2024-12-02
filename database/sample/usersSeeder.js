const db = require("../../config/db");

const DUMMY_USERS = [
  {
    username: "admin",
    password_hash:
      "$2a$10$HMmq6EwufazagEbs/.8tQ.mGFYln1tJ5kei5AFP7kM2dBLO/KjVRC",
    role: "admin",
    email: "admin@telemed.com",
  },
  {
    username: "receptionist1",
    password_hash:
      "$2a$10$HMmq6EwufazagEbs/.8tQ.mGFYln1tJ5kei5AFP7kM2dBLO/KjVRC",
    role: "receptionist",
    email: "reception@telemed.com",
  },
  {
    username: "patient1",
    password_hash:
      "$2a$10$HMmq6EwufazagEbs/.8tQ.mGFYln1tJ5kei5AFP7kM2dBLO/KjVRC",
    role: "patient",
    email: "patient1@example.com",
  },
  {
    username: "patient2",
    password_hash:
      "$2a$10$HMmq6EwufazagEbs/.8tQ.mGFYln1tJ5kei5AFP7kM2dBLO/KjVRC",
    role: "patient",
    email: "patient2@example.com",
  },
];

class UserSeeder {
  constructor(connection) {
    this.db = connection;
  }

  async seed() {
    let connection;
    try {
      connection = await this.db.getConnection();
      await connection.beginTransaction();

      for (const data of DUMMY_USERS) {
        await connection.query(
          "INSERT INTO users (username, password_hash, role, email) VALUES (?, ?, ?, ?)",
          [data.username, data.password_hash, data.role, data.email]
        );
      }

      await connection.commit();
      console.log("✅ User seeding completed successfully");
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      console.error("User seeding failed:", error);
      throw error;
    }
  }
}

if (require.main === module) {
  const seeder = new UserSeeder(db);
  seeder
    .seed()
    .then(() => {
      console.log("✨ User seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}

module.exports = UserSeeder;
