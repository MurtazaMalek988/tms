const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    // Check principals first
    let user = null;
    let role = null;

    const principalResult = await pool.query(
      'SELECT * FROM principals WHERE username = $1 AND is_active = TRUE',
      [username.trim()]
    );

    if (principalResult.rows.length > 0) {
      user = principalResult.rows[0];
      role = 'principal';
    } else {
      const teacherResult = await pool.query(
        'SELECT * FROM teachers WHERE username = $1 AND is_active = TRUE',
        [username.trim()]
      );
      if (teacherResult.rows.length > 0) {
        user = teacherResult.rows[0];
        role = 'teacher';
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name, role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, username: user.username, role },
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res) {
  res.json({ success: true, user: req.user });
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'New password must be at least 4 characters' });
    }

    const table = req.user.role === 'principal' ? 'principals' : 'teachers';
    const result = await pool.query(
      `SELECT password_hash FROM ${table} WHERE id = $1 AND is_active = TRUE`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE ${table} SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [hash, req.user.id]
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, getMe, changePassword };
