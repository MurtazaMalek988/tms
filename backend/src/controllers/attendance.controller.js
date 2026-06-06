const { pool } = require('../config/database');
const { checkGeofence, isGeofenceEnabled } = require('../utils/geofence');

async function getSettings() {
  const result = await pool.query('SELECT * FROM settings WHERE id = 1');
  return result.rows[0];
}

async function validateGeofence(latitude, longitude, settings) {
  return checkGeofence(latitude, longitude, settings);
}

function geofenceErrorMessage(result) {
  return `You must be on school premises to mark attendance. You are about ${result.distance}m away (allowed: ${result.allowed_radius}m). Move closer to the school and try again.`;
}

async function checkIn(req, res, next) {
  try {
    const { latitude, longitude } = req.body;
    if (latitude == null || longitude == null) {
      return res.status(400).json({ success: false, message: 'Location is required for check-in' });
    }

    const settings = await getSettings();
    const geofence = await validateGeofence(latitude, longitude, settings);
    if (!geofence.valid) {
      return res.status(400).json({ success: false, message: geofenceErrorMessage(geofence) });
    }

    const teacherId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const existing = await pool.query(
      'SELECT * FROM attendance WHERE teacher_id = $1 AND attendance_date = $2',
      [teacherId, today]
    );

    if (existing.rows.length > 0) {
      if (existing.rows[0].check_in_time) {
        return res.status(400).json({ success: false, message: 'You have already checked in today.' });
      }
      if (existing.rows[0].status === 'medical_leave') {
        return res.status(400).json({ success: false, message: 'You are on medical leave today.' });
      }
    }

    const now = new Date();
    await pool.query(
      `INSERT INTO attendance (teacher_id, attendance_date, check_in_time, status, check_in_latitude, check_in_longitude)
       VALUES ($1, $2, $3, 'present', $4, $5)
       ON CONFLICT (teacher_id, attendance_date)
       DO UPDATE SET check_in_time = $3, status = 'present', check_in_latitude = $4, check_in_longitude = $5, updated_at = NOW()`,
      [teacherId, today, now, latitude, longitude]
    );

    res.json({ success: true, message: 'Check-in successful!', checkInTime: now });
  } catch (err) {
    next(err);
  }
}

async function checkOut(req, res, next) {
  try {
    const { latitude, longitude } = req.body;
    if (latitude == null || longitude == null) {
      return res.status(400).json({ success: false, message: 'Location is required for check-out' });
    }

    const settings = await getSettings();
    const geofence = await validateGeofence(latitude, longitude, settings);
    if (!geofence.valid) {
      return res.status(400).json({ success: false, message: geofenceErrorMessage(geofence) });
    }

    const teacherId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const existing = await pool.query(
      'SELECT * FROM attendance WHERE teacher_id = $1 AND attendance_date = $2',
      [teacherId, today]
    );

    if (existing.rows.length === 0 || !existing.rows[0].check_in_time) {
      return res.status(400).json({ success: false, message: 'You have not checked in today.' });
    }
    if (existing.rows[0].check_out_time) {
      return res.status(400).json({ success: false, message: 'You have already checked out today.' });
    }

    const now = new Date();
    const cutoffStr = settings.short_leave_cutoff_time;
    const [ch, cm] = cutoffStr.split(':').map(Number);
    const cutoff = new Date();
    cutoff.setHours(ch, cm, 0, 0);

    let newStatus = existing.rows[0].status;
    if (now < cutoff) newStatus = 'short_leave';

    await pool.query(
      'UPDATE attendance SET check_out_time = $1, status = $2, check_out_latitude = $3, check_out_longitude = $4, updated_at = NOW() WHERE id = $5',
      [now, newStatus, latitude, longitude, existing.rows[0].id]
    );

    res.json({
      success: true,
      message: newStatus === 'short_leave' ? 'Checked out early — marked as Short Leave.' : 'Check-out successful!',
      checkOutTime: now,
      status: newStatus,
    });
  } catch (err) {
    next(err);
  }
}

async function applyMedicalLeave(req, res, next) {
  try {
    const teacherId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const { remarks } = req.body;
    const certPath = req.file ? req.file.path : null;

    const existing = await pool.query(
      'SELECT * FROM attendance WHERE teacher_id = $1 AND attendance_date = $2',
      [teacherId, today]
    );

    if (existing.rows.length > 0) {
      if (existing.rows[0].check_in_time) {
        return res.status(400).json({ success: false, message: 'Cannot apply medical leave after checking in.' });
      }
      if (existing.rows[0].status === 'medical_leave') {
        return res.status(400).json({ success: false, message: 'Medical leave already applied for today.' });
      }
    }

    await pool.query(
      `INSERT INTO attendance (teacher_id, attendance_date, status, remarks, medical_certificate_path)
       VALUES ($1, $2, 'medical_leave', $3, $4)
       ON CONFLICT (teacher_id, attendance_date)
       DO UPDATE SET status = 'medical_leave', remarks = $3, medical_certificate_path = $4, updated_at = NOW()`,
      [teacherId, today, remarks || null, certPath]
    );

    res.json({ success: true, message: 'Medical leave applied successfully.' });
  } catch (err) {
    next(err);
  }
}

async function getTodayStatus(req, res, next) {
  try {
    const teacherId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(
      'SELECT * FROM attendance WHERE teacher_id = $1 AND attendance_date = $2',
      [teacherId, today]
    );
    const settings = await getSettings();
    res.json({
      success: true,
      attendance: result.rows.length > 0
        ? result.rows[0]
        : { status: 'not_marked', check_in_time: null, check_out_time: null },
      geofence: {
        enabled: isGeofenceEnabled(settings),
        school_name: settings.school_name,
        school_latitude: parseFloat(settings.school_latitude),
        school_longitude: parseFloat(settings.school_longitude),
        allowed_radius: parseInt(settings.allowed_radius, 10) || 100,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getAttendanceList(req, res, next) {
  try {
    const { date, status, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = ['1=1'];
    let i = 1;

    if (date) { conditions.push(`a.attendance_date = $${i++}`); params.push(date); }
    if (status) { conditions.push(`a.status = $${i++}`); params.push(status); }
    if (search) { conditions.push(`(t.name ILIKE $${i} OR t.username ILIKE $${i})`); params.push(`%${search}%`); i++; }

    const where = conditions.join(' AND ');

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM attendance a JOIN teachers t ON a.teacher_id = t.id WHERE ${where}`,
      params
    );

    const dataResult = await pool.query(
      `SELECT a.*, t.name AS teacher_name, t.username, t.mobile_number
       FROM attendance a JOIN teachers t ON a.teacher_id = t.id
       WHERE ${where}
       ORDER BY a.attendance_date DESC, t.name ASC
       LIMIT $${i++} OFFSET $${i++}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      attendance: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
}

async function updateAttendance(req, res, next) {
  try {
    const { status, remarks } = req.body;
    const validStatuses = ['present', 'absent', 'short_leave', 'medical_leave'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const result = await pool.query(
      `UPDATE attendance SET
         status = COALESCE($1, status),
         remarks = COALESCE($2, remarks),
         updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status || null, remarks || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Attendance record not found' });
    res.json({ success: true, attendance: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function markAbsentTeachers() {
  const today = new Date().toISOString().split('T')[0];
  const teachers = await pool.query('SELECT id FROM teachers WHERE is_active = TRUE');
  for (const teacher of teachers.rows) {
    await pool.query(
      `INSERT INTO attendance (teacher_id, attendance_date, status)
       VALUES ($1, $2, 'absent')
       ON CONFLICT (teacher_id, attendance_date) DO NOTHING`,
      [teacher.id, today]
    );
  }
  console.log(`Auto-marked absent for ${teachers.rows.length} teachers on ${today}`);
}

module.exports = { checkIn, checkOut, applyMedicalLeave, getTodayStatus, getAttendanceList, updateAttendance, markAbsentTeachers };
