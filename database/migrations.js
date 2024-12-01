const db = require('../config/db');

// Common timestamp columns used across all tables
const TIMESTAMP_COLUMNS = `\
  created_at timestamp DEFAULT CURRENT_TIMESTAMP, \
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP\
`;

// Table creation factory
class TableBuilder {
  static createTable(tableName, columns) {
    return `CREATE TABLE \`${tableName}\` ( \
      ${columns}, \
      ${TIMESTAMP_COLUMNS} \
    )`;
  }
}

// Single responsibility classes for each table definition
class UserTable {
  static get definition() {
    return TableBuilder.createTable('users', `\
      id int NOT NULL AUTO_INCREMENT, \
      username varchar(255) NOT NULL, \
      password_hash varchar(255) NOT NULL, \
      role varchar(255) NOT NULL, \
      email varchar(255) NOT NULL, \
      PRIMARY KEY (id), \
      UNIQUE KEY username (username), \
      UNIQUE KEY email (email)\
    `);
  }
}

class PatientTable {
  static get definition() {
    return TableBuilder.createTable('patients', `\
      id int NOT NULL AUTO_INCREMENT, \
      first_name varchar(255) NOT NULL, \
      last_name varchar(255) NOT NULL, \
      date_of_birth date DEFAULT NULL, \
      gender enum('Male','Female','Other') DEFAULT NULL, \
      address text, \
      user_id int NOT NULL, \
      phone varchar(15) DEFAULT NULL, \
      PRIMARY KEY (id), \
      KEY user_id (user_id), \
      CONSTRAINT patients_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id)\
    `);
  }
}

class DoctorTable {
  static get definition() {
    return TableBuilder.createTable('doctors', `\
      id int NOT NULL AUTO_INCREMENT, \
      first_name varchar(255) NOT NULL, \
      last_name varchar(255) NOT NULL, \
      specialization varchar(255) NOT NULL, \
      user_id int NOT NULL, \
      phone varchar(15) DEFAULT NULL, \
      schedule json DEFAULT NULL, \
      status enum('active','inactive') DEFAULT 'active', \
      PRIMARY KEY (id), \
      KEY user_id (user_id), \
      CONSTRAINT doctors_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id)\
    `);
  }
}

class AppointmentTable {
  static get definition() {
    return TableBuilder.createTable('appointments', `\
      id int NOT NULL AUTO_INCREMENT, \
      patient_id int NOT NULL, \
      doctor_id int NOT NULL, \
      appointment_date date NOT NULL, \
      appointment_time time NOT NULL, \
      status enum('scheduled','completed','cancelled') DEFAULT 'scheduled', \
      PRIMARY KEY (id), \
      KEY patient_id (patient_id), \
      KEY doctor_id (doctor_id), \
      CONSTRAINT appointments_ibfk_1 FOREIGN KEY (patient_id) REFERENCES patients (id), \
      CONSTRAINT appointments_ibfk_2 FOREIGN KEY (doctor_id) REFERENCES doctors (id)\
    `);
  }
}

// Migration manager class
class DatabaseMigration {
  constructor(connection) {
    this.db = connection;
    this.tables = [
      { name: 'appointments', definition: AppointmentTable.definition },
      { name: 'doctors', definition: DoctorTable.definition },
      { name: 'patients', definition: PatientTable.definition },
      { name: 'users', definition: UserTable.definition }
    ].reverse(); // Reverse order for proper foreign key constraints
  }

  async tableExists(tableName, connection) {
    const [rows] = await connection.query(
      'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
      [tableName]
    );
    return rows.length > 0;
  }

  async createTable(table, connection) {
    try {
      const exists = await this.tableExists(table.name, connection);
      
      if (exists) {
        console.warn(`⚠️  Table '${table.name}' already exists, skipping creation...`);
        return;
      }

      await connection.query(table.definition);
      console.log(`✅ Created table: ${table.name}`);
    } catch (error) {
      console.error(`❌ Error handling table ${table.name}:`, error);
      throw error;
    }
  }

  async migrate() {
    let connection;
    try {
      connection = await this.db.getConnection();
      await connection.beginTransaction();

      for (const table of this.tables) {
        await this.createTable(table, connection);
      }
      
      await connection.commit();
      console.log('✨ Migration completed successfully');
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      console.error('Migration failed:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
      await this.db.end();
    }
  }
}

// Execute migration
const migration = new DatabaseMigration(db);
migration.migrate().catch(console.error);