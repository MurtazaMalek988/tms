const { pool } = require('../config/database');

async function getDashboardStats(req, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [totalTeachers, todayStats, recentActivity] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM teachers WHERE is_active = TRUE'),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'present') AS present,
           COUNT(*) FILTER (WHERE status = 'absent') AS absent,
           COUNT(*) FILTER (WHERE status = 'short_leave') AS short_leave,
           COUNT(*) FILTER (WHERE status = 'medical_leave') AS medical_leave
         FROM attendance WHERE attendance_date = $1`,
        [today]
      ),
      pool.query(
        `SELECT a.status, a.check_in_time, a.check_out_time, t.name AS teacher_name
         FROM attendance a
         JOIN teachers t ON a.teacher_id = t.id
         WHERE a.attendance_date = $1
         ORDER BY a.updated_at DESC
         LIMIT 10`,
        [today]
      ),
    ]);

    const total = parseInt(totalTeachers.rows[0].count);
    const stats = todayStats.rows[0];
    const present = parseInt(stats.present) || 0;
    const absent = parseInt(stats.absent) || 0;
    const shortLeave = parseInt(stats.short_leave) || 0;
    const medicalLeave = parseInt(stats.medical_leave) || 0;
    const notMarked = total - present - absent - shortLeave - medicalLeave;

    res.json({
      success: true,
      stats: {
        totalTeachers: total,
        present,
        absent,
        shortLeave,
        medicalLeave,
        notMarked: Math.max(0, notMarked),
        date: today,
      },
      recentActivity: recentActivity.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboardStats };
