const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    const patient = rows[0];

    if (!patient || !(await bcrypt.compare(password, patient.password_hash))) {
        return res.status(400).json({ error: "Invalid credentials" });
    }

    req.session.patientId = patient.id;
    res.json({ message: "Login successful" });
};
