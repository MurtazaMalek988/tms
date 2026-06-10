require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const cron = require('node-cron');
const fs = require('fs');

const { initializeDatabase } = require('./config/database');
const { seedDatabase } = require('./utils/seed');
const { runMigrations } = require('./db/runMigrations');
const errorHandler = require('./middleware/errorHandler');
const { markAbsentTeachers, markDayOffOrHoliday } = require('./controllers/attendance.controller');

const authRoutes = require('./routes/auth.routes');
const teacherRoutes = require('./routes/teacher-routes');
const adminRoutes = require('./routes/admin-routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload directories exist
['uploads/excel', 'uploads/certificates'].forEach((dir) => {
  const p = path.join(__dirname, '..', dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

const { pool } = require('./config/database');

// Cron: mark day-off / holiday records at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('[CRON] Running day-off/holiday marking...');
  try { await markDayOffOrHoliday(); } catch (e) { console.error('[CRON] Error:', e.message); }
});

// Cron: every minute — fire absent marking when current time matches absence_processing_time from settings
cron.schedule('* * * * *', async () => {
  try {
    const result = await pool.query('SELECT absence_processing_time FROM settings WHERE id = 1');
    if (!result.rows.length) return;

    const timeStr = result.rows[0].absence_processing_time; // e.g. "08:37:00"
    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date();
    if (now.getHours() === h && now.getMinutes() === m) {
      console.log(`[CRON] absence_processing_time hit (${h}:${String(m).padStart(2,'0')}) — marking absent...`);
      await markAbsentTeachers();
    }
  } catch (e) { console.error('[CRON] Error checking absence time:', e.message); }
});

async function start() {
  await initializeDatabase();
  await runMigrations();
  await seedDatabase();
  app.listen(PORT, '0.0.0.0', () => console.log(`TAMS Backend running on port ${PORT}`));
}

start().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1);
});
