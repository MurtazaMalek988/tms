const { pool } = require('../config/database');

async function getHolidays(req, res, next) {
  try {
    const { year } = req.query;
    let query, params;

    if (year) {
      query = `SELECT * FROM holidays
               WHERE EXTRACT(YEAR FROM start_date) = $1 OR EXTRACT(YEAR FROM end_date) = $1
               ORDER BY start_date ASC`;
      params = [parseInt(year)];
    } else {
      query = 'SELECT * FROM holidays ORDER BY start_date ASC';
      params = [];
    }

    const result = await pool.query(query, params);
    res.json({ success: true, holidays: result.rows });
  } catch (err) {
    next(err);
  }
}

async function createHoliday(req, res, next) {
  try {
    const { holiday_name, holiday_type, start_date, end_date, description } = req.body;

    if (!holiday_name || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'holiday_name, start_date, and end_date are required' });
    }
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
    }

    const result = await pool.query(
      `INSERT INTO holidays (holiday_name, holiday_type, start_date, end_date, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [holiday_name, holiday_type || 'public_holiday', start_date, end_date, description || null]
    );

    res.status(201).json({ success: true, holiday: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateHoliday(req, res, next) {
  try {
    const { holiday_name, holiday_type, start_date, end_date, description } = req.body;

    if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
    }

    const result = await pool.query(
      `UPDATE holidays SET
         holiday_name = COALESCE($1, holiday_name),
         holiday_type = COALESCE($2, holiday_type),
         start_date = COALESCE($3, start_date),
         end_date = COALESCE($4, end_date),
         description = $5,
         updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [holiday_name || null, holiday_type || null, start_date || null, end_date || null, description || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Holiday not found' });
    }

    res.json({ success: true, holiday: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteHoliday(req, res, next) {
  try {
    const result = await pool.query('DELETE FROM holidays WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Holiday not found' });
    }
    res.json({ success: true, message: 'Holiday deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHolidays, createHoliday, updateHoliday, deleteHoliday };
