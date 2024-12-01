const db = require("../config/db");
const DoctorSeeder = require("./sample/doctorsSeeder");

async function runSeeders() {
  try {
    // Add more seeders here in the order they should run
    const doctorSeeder = new DoctorSeeder(db);
    await doctorSeeder.seed();

    console.log('✨ All seeding completed successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await db.end();
  }
}

// Run seeders if this file is executed directly
if (require.main === module) {
  runSeeders()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = runSeeders;