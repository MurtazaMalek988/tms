const { pool } = require('../config/database');

async function getDashboardStats(req, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [totalResult, todayStats, recentActivity, notMarkedResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM teachers WHERE is_active = TRUE'),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'present')       AS present,
           COUNT(*) FILTER (WHERE status = 'absent')        AS absent,
           COUNT(*) FILTER (WHERE status = 'medical_leave') AS medical_leave,
           COUNT(*) FILTER (WHERE status = 'holiday')       AS holiday,
           COUNT(*) FILTER (WHERE status = 'day_off')       AS day_off
         FROM attendance WHERE attendance_date = $1`,
        [today]
      ),
      pool.query(
        `SELECT a.status, a.check_in_time, a.check_out_time, t.name AS teacher_name
         FROM attendance a
         JOIN teachers t ON a.teacher_id = t.id
         WHERE a.attendance_date = $1
         ORDER BY a.updated_at DESC LIMIT 10`,
        [today]
      ),
      pool.query(
        `SELECT COUNT(*) FROM teachers t
         WHERE t.is_active = TRUE
         AND NOT EXISTS (
           SELECT 1 FROM attendance a WHERE a.teacher_id = t.id AND a.attendance_date = $1
         )`,
        [today]
      ),
    ]);

    const stats = todayStats.rows[0];
    res.json({
      success: true,
      stats: {
        totalTeachers: parseInt(totalResult.rows[0].count),
        present:       parseInt(stats.present)       || 0,
        absent:        parseInt(stats.absent)        || 0,
        medicalLeave:  parseInt(stats.medical_leave) || 0,
        holiday:       parseInt(stats.holiday)       || 0,
        dayOff:        parseInt(stats.day_off)       || 0,
        notMarked:     parseInt(notMarkedResult.rows[0].count) || 0,
        date: today,
      },
      recentActivity: recentActivity.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboardStats };
