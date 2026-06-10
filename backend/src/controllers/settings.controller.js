const { pool } = require('../config/database');
const { markAbsentTeachers } = require('./attendance.controller');

async function getSettings(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE id = 1');
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Settings not found' });
    res.json({ success: true, settings: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const {
      school_name,
      school_latitude,
      school_longitude,
      allowed_radius,
      late_cutoff_time,
      absence_processing_time,
    } = req.body;

    const result = await pool.query(
      `UPDATE settings SET
         school_name = COALESCE($1, school_name),
         school_latitude = COALESCE($2, school_latitude),
         school_longitude = COALESCE($3, school_longitude),
         allowed_radius = COALESCE($4, allowed_radius),
         late_cutoff_time = COALESCE($5, late_cutoff_time),
         absence_processing_time = COALESCE($6, absence_processing_time),
         updated_at = NOW()
       WHERE id = 1
       RETURNING *`,
      [
        school_name,
        school_latitude != null ? parseFloat(school_latitude) : null,
        school_longitude != null ? parseFloat(school_longitude) : null,
        allowed_radius != null ? parseInt(allowed_radius) : null,
        late_cutoff_time,
        absence_processing_time,
      ]
    );

    const saved = result.rows[0];

    // If absence_processing_time changed and it has already passed today, mark absent now
    if (absence_processing_time) {
      const [h, m] = absence_processing_time.split(':').map(Number);
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const cutoffMinutes = h * 60 + m;
      if (nowMinutes >= cutoffMinutes) {
        setImmediate(async () => {
          try {
            console.log('[SETTINGS] Cutoff time already passed — running markAbsentTeachers immediately');
            await markAbsentTeachers();
          } catch (e) {
            console.error('[SETTINGS] Error running markAbsentTeachers:', e.message);
          }
        });
      }
    }

    res.json({ success: true, settings: saved });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, updateSettings };
