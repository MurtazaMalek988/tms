const { pool } = require('../config/database');
const { checkGeofence, isGeofenceEnabled } = require('../utils/geofence');

// Friday=5, Saturday=6 (JS getDay: 0=Sun ... 6=Sat)
const WEEKLY_OFF_DAYS = [5, 6];

async function getSettings() {
  const result = await pool.query('SELECT * FROM settings WHERE id = 1');
  return result.rows[0];
}

function isWeeklyOff(dateStr) {
  return WEEKLY_OFF_DAYS.includes(new Date(dateStr + 'T00:00:00').getDay());
}

async function getTodayHoliday(dateStr) {
  const result = await pool.query(
    "SELECT * FROM holidays WHERE $1::date BETWEEN start_date AND end_date LIMIT 1",
    [dateStr]
  );
  return result.rows[0] || null;
}

async function getLastLogAction(teacherId, dateStr) {
  const result = await pool.query(
    'SELECT action_type FROM attendance_logs WHERE teacher_id = $1 AND attendance_date = $2 ORDER BY timestamp DESC LIMIT 1',
    [teacherId, dateStr]
  );
  return result.rows[0]?.action_type || null;
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
    const geofence = checkGeofence(latitude, longitude, settings);
    if (!geofence.valid) {
      return res.status(400).json({ success: false, message: geofenceErrorMessage(geofence) });
    }

    const teacherId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    if (isWeeklyOff(today)) {
      return res.status(400).json({ success: false, message: 'Today is a day off. No attendance required.' });
    }

    const holiday = await getTodayHoliday(today);
    if (holiday) {
      return res.status(400).json({ success: false, message: `Today is a holiday: ${holiday.holiday_name}. No attendance required.` });
    }

    const existing = await pool.query(
      'SELECT * FROM attendance WHERE teacher_id = $1 AND attendance_date = $2',
      [teacherId, today]
    );

    if (existing.rows.length > 0 && existing.rows[0].status === 'medical_leave') {
      return res.status(400).json({ success: false, message: 'You are on medical leave today.' });
    }

    const lastAction = await getLastLogAction(teacherId, today);
    if (lastAction === 'check_in') {
      return res.status(400).json({ success: false, message: 'You are already checked in. Please check out first.' });
    }

    const now = new Date();

    await pool.query(
      `INSERT INTO attendance (teacher_id, attendance_date, check_in_time, status, check_in_latitude, check_in_longitude)
       VALUES ($1, $2, $3, 'present', $4, $5)
       ON CONFLICT (teacher_id, attendance_date) DO UPDATE SET
         check_in_time = CASE WHEN attendance.check_in_time IS NULL THEN $3 ELSE attendance.check_in_time END,
         check_out_time = NULL,
         status = 'present',
         check_in_latitude = CASE WHEN attendance.check_in_time IS NULL THEN $4 ELSE attendance.check_in_latitude END,
         check_in_longitude = CASE WHEN attendance.check_in_time IS NULL THEN $5 ELSE attendance.check_in_longitude END,
         updated_at = NOW()`,
      [teacherId, today, now, latitude, longitude]
    );

    await pool.query(
      'INSERT INTO attendance_logs (teacher_id, attendance_date, action_type, timestamp, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6)',
      [teacherId, today, 'check_in', now, latitude, longitude]
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
    const geofence = checkGeofence(latitude, longitude, settings);
    if (!geofence.valid) {
      return res.status(400).json({ success: false, message: geofenceErrorMessage(geofence) });
    }

    const teacherId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const lastAction = await getLastLogAction(teacherId, today);
    if (lastAction !== 'check_in') {
      return res.status(400).json({ success: false, message: 'You have not checked in yet.' });
    }

    const now = new Date();

    const existing = await pool.query(
      'SELECT id FROM attendance WHERE teacher_id = $1 AND attendance_date = $2',
      [teacherId, today]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE attendance SET check_out_time = $1, check_out_latitude = $2, check_out_longitude = $3, updated_at = NOW() WHERE id = $4',
        [now, latitude, longitude, existing.rows[0].id]
      );
    }


    await pool.query(
      'INSERT INTO attendance_logs (teacher_id, attendance_date, action_type, timestamp, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6)',
      [teacherId, today, 'check_out', now, latitude, longitude]
    );

    res.json({ success: true, message: 'Check-out successful!', checkOutTime: now });
  } catch (err) {
    next(err);
  }
}

async function applyMedicalLeave(req, res, next) {
  try {
    const teacherId = req.user.id;
    const { remarks, start_date, end_date } = req.body;
    const certPath = req.file ? req.file.path : null;

    const today = new Date().toISOString().split('T')[0];
    const startDate = start_date || today;
    const endDate = end_date || startDate;

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ success: false, message: 'Start date cannot be after end date.' });
    }

    // Build list of dates in range
    const dates = [];
    const cur = new Date(startDate + 'T00:00:00');
    const fin = new Date(endDate + 'T00:00:00');
    while (cur <= fin) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }

    let applied = 0;
    for (const date of dates) {
      const existing = await pool.query(
        'SELECT check_in_time FROM attendance WHERE teacher_id = $1 AND attendance_date = $2',
        [teacherId, date]
      );
      if (existing.rows.length > 0 && existing.rows[0].check_in_time) continue;

      await pool.query(
        `INSERT INTO attendance (teacher_id, attendance_date, status, remarks, medical_certificate_path)
         VALUES ($1, $2, 'medical_leave', $3, $4)
         ON CONFLICT (teacher_id, attendance_date)
         DO UPDATE SET status = 'medical_leave', remarks = $3, medical_certificate_path = $4, updated_at = NOW()`,
        [teacherId, date, remarks || null, certPath]
      );
      applied++;
    }

    res.json({ success: true, message: `Medical leave applied for ${applied} day(s).` });
  } catch (err) {
    next(err);
  }
}

async function getTodayStatus(req, res, next) {
  try {
    const teacherId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const settings = await getSettings();

    const [attendanceResult, logsResult] = await Promise.all([
      pool.query('SELECT * FROM attendance WHERE teacher_id = $1 AND attendance_date = $2', [teacherId, today]),
      pool.query(
        'SELECT action_type, timestamp, latitude, longitude FROM attendance_logs WHERE teacher_id = $1 AND attendance_date = $2 ORDER BY timestamp ASC',
        [teacherId, today]
      ),
    ]);

    let attendance;
    if (attendanceResult.rows.length > 0) {
      attendance = attendanceResult.rows[0];
    } else if (isWeeklyOff(today)) {
      attendance = { status: 'day_off', check_in_time: null, check_out_time: null };
    } else {
      const holiday = await getTodayHoliday(today);
      if (holiday) {
        attendance = { status: 'holiday', holiday_name: holiday.holiday_name, check_in_time: null, check_out_time: null };
      } else {
        attendance = { status: 'not_marked_yet', check_in_time: null, check_out_time: null };
      }
    }

    res.json({
      success: true,
      attendance,
      logs: logsResult.rows,
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

    // When filtering by date: LEFT JOIN so teachers with no record show as not_marked_yet
    if (date) {
      const params = [date];
      let i = 2;
      const conditions = ['t.is_active = TRUE'];

      if (search) {
        conditions.push(`(t.name ILIKE $${i} OR t.username ILIKE $${i})`);
        params.push(`%${search}%`);
        i++;
      }

      let statusCondition = '';
      if (status === 'not_marked_yet') {
        statusCondition = 'AND a.id IS NULL';
      } else if (status) {
        statusCondition = `AND a.status = $${i}`;
        params.push(status);
        i++;
      }

      const where = conditions.join(' AND ');

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM teachers t
         LEFT JOIN attendance a ON a.teacher_id = t.id AND a.attendance_date = $1
         WHERE ${where} ${statusCondition}`,
        params
      );

      const dataResult = await pool.query(
        `SELECT
           t.id AS teacher_id, t.name AS teacher_name, t.username, t.mobile_number,
           a.id, $1::date AS attendance_date,
           COALESCE(a.status, 'not_marked_yet') AS status,
           a.check_in_time, a.check_out_time, a.remarks, a.medical_certificate_path
         FROM teachers t
         LEFT JOIN attendance a ON a.teacher_id = t.id AND a.attendance_date = $1
         WHERE ${where} ${statusCondition}
         ORDER BY t.name ASC
         LIMIT $${i} OFFSET $${i + 1}`,
        [...params, parseInt(limit), offset]
      );

      const total = parseInt(countResult.rows[0].count);
      return res.json({
        success: true,
        attendance: dataResult.rows,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      });
    }

    // No date filter: show existing records only
    const params = [];
    const conditions = ['1=1'];
    let i = 1;

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

async function getAttendanceLogs(req, res, next) {
  try {
    const { teacher_id, date } = req.query;
    const params = [];
    const conditions = ['1=1'];
    let i = 1;

    if (teacher_id) { conditions.push(`al.teacher_id = $${i++}`); params.push(teacher_id); }
    if (date) { conditions.push(`al.attendance_date = $${i++}`); params.push(date); }

    const result = await pool.query(
      `SELECT al.*, t.name AS teacher_name
       FROM attendance_logs al
       JOIN teachers t ON al.teacher_id = t.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY al.timestamp DESC
       LIMIT 200`,
      params
    );

    res.json({ success: true, logs: result.rows });
  } catch (err) {
    next(err);
  }
}

async function updateAttendance(req, res, next) {
  try {
    const { status, remarks } = req.body;
    const validStatuses = ['present', 'absent', 'medical_leave', 'holiday', 'day_off'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const result = await pool.query(
      `UPDATE attendance SET
         status = COALESCE($1, status),
         remarks = $2,
         updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status || null, remarks !== undefined ? remarks : null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Attendance record not found' });
    res.json({ success: true, attendance: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function markDayOffOrHoliday() {
  const today = new Date().toISOString().split('T')[0];

  if (isWeeklyOff(today)) {
    const teachers = await pool.query('SELECT id FROM teachers WHERE is_active = TRUE');
    for (const t of teachers.rows) {
      await pool.query(
        `INSERT INTO attendance (teacher_id, attendance_date, status) VALUES ($1, $2, 'day_off')
         ON CONFLICT (teacher_id, attendance_date) DO NOTHING`,
        [t.id, today]
      );
    }
    console.log(`[CRON] Marked day_off for ${teachers.rows.length} teachers on ${today}`);
    return;
  }

  const holiday = await getTodayHoliday(today);
  if (holiday) {
    const teachers = await pool.query('SELECT id FROM teachers WHERE is_active = TRUE');
    for (const t of teachers.rows) {
      await pool.query(
        `INSERT INTO attendance (teacher_id, attendance_date, status) VALUES ($1, $2, 'holiday')
         ON CONFLICT (teacher_id, attendance_date) DO NOTHING`,
        [t.id, today]
      );
    }
    console.log(`[CRON] Marked holiday (${holiday.holiday_name}) for ${teachers.rows.length} teachers on ${today}`);
  }
}

async function markAbsentTeachers() {
  const today = new Date().toISOString().split('T')[0];

  if (isWeeklyOff(today)) {
    console.log(`[CRON] Skipping absent marking — day off (${today})`);
    return;
  }

  const holiday = await getTodayHoliday(today);
  if (holiday) {
    console.log(`[CRON] Skipping absent marking — holiday: ${holiday.holiday_name}`);
    return;
  }

  const teachers = await pool.query('SELECT id FROM teachers WHERE is_active = TRUE');
  for (const t of teachers.rows) {
    await pool.query(
      `INSERT INTO attendance (teacher_id, attendance_date, status) VALUES ($1, $2, 'absent')
       ON CONFLICT (teacher_id, attendance_date) DO NOTHING`,
      [t.id, today]
    );
  }
  console.log(`[CRON] Auto-marked absent for ${teachers.rows.length} teachers on ${today}`);
}

module.exports = {
  checkIn, checkOut, applyMedicalLeave, getTodayStatus,
  getAttendanceList, getAttendanceLogs, updateAttendance,
  markAbsentTeachers, markDayOffOrHoliday,
};
