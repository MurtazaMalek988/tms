const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { parseTeacherExcel } = require('../utils/excelParser');
const path = require('path');
const fs = require('fs');

async function getTeachers(req, res, next) {
  try {
    const { search } = req.query;
    let query = 'SELECT id, name, mobile_number, username, is_active, created_at FROM teachers';
    const params = [];
    if (search) {
      query += ' WHERE name ILIKE $1 OR username ILIKE $1';
      params.push(`%${search}%`);
    }
    query += ' ORDER BY name ASC';
    const result = await pool.query(query, params);
    res.json({ success: true, teachers: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getTeacher(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT id, name, mobile_number, username, is_active, created_at FROM teachers WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Teacher not found' });
    res.json({ success: true, teacher: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function createTeacher(req, res, next) {
  try {
    const { name, mobile_number, username, password } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ success: false, message: 'Name, username, and password are required' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO teachers (name, mobile_number, username, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, mobile_number, username, created_at',
      [name.trim(), mobile_number?.trim() || null, username.trim(), hash]
    );
    res.status(201).json({ success: true, teacher: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateTeacher(req, res, next) {
  try {
    const { name, mobile_number, username, is_active } = req.body;
    const result = await pool.query(
      `UPDATE teachers SET
        name = COALESCE($1, name),
        mobile_number = COALESCE($2, mobile_number),
        username = COALESCE($3, username),
        is_active = COALESCE($4, is_active),
        updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, mobile_number, username, is_active`,
      [name?.trim(), mobile_number?.trim() || null, username?.trim(), is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Teacher not found' });
    res.json({ success: true, teacher: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteTeacher(req, res, next) {
  try {
    const result = await pool.query('DELETE FROM teachers WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Teacher not found' });
    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { password } = req.body;
    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'UPDATE teachers SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
      [hash, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Teacher not found' });
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
}

async function importTeachers(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { teachers, errors } = parseTeacherExcel(req.file.path);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (errors.length > 0 && teachers.length === 0) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors });
    }

    const imported = [];
    const failed = [...errors];

    for (const t of teachers) {
      try {
        const hash = await bcrypt.hash(t.password, 10);
        const result = await pool.query(
          'INSERT INTO teachers (name, mobile_number, username, password_hash) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING RETURNING id, name, username',
          [t.name, t.mobile_number || null, t.username, hash]
        );
        if (result.rows.length > 0) {
          imported.push(result.rows[0]);
        } else {
          failed.push(`Username "${t.username}" already exists — skipped`);
        }
      } catch (e) {
        failed.push(`"${t.username}": ${e.message}`);
      }
    }

    res.json({
      success: true,
      message: `Imported ${imported.length} teachers`,
      imported,
      skipped: failed,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher, resetPassword, importTeachers };
