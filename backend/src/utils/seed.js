const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function seedDatabase() {
  try {
    const principalCount = await pool.query('SELECT COUNT(*) FROM principals');
    if (parseInt(principalCount.rows[0].count) === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      const hash2 = await bcrypt.hash('principal123', 10);
      await pool.query(
        `INSERT INTO principals (name, username, password_hash, role) VALUES
         ($1, $2, $3, 'principal'),
         ($4, $5, $6, 'principal')
         ON CONFLICT (username) DO NOTHING`,
        ['Principal Admin', 'admin', hash, 'Vice Principal', 'principal2', hash2]
      );
      console.log('Default principals seeded: admin / admin123, principal2 / principal123');
    }

    const settingsCount = await pool.query('SELECT COUNT(*) FROM settings');
    if (parseInt(settingsCount.rows[0].count) === 0) {
      await pool.query(
        `INSERT INTO settings (school_name, school_latitude, school_longitude, allowed_radius, short_leave_cutoff_time, late_cutoff_time, absence_processing_time)
         VALUES ('My School', 0, 0, 100, '13:30:00', '09:00:00', '17:00:00')`
      );
      console.log('Default settings seeded');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

module.exports = { seedDatabase };
