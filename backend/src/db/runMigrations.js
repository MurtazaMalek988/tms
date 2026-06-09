const { pool } = require('../config/database');

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('[MIGRATION] Running migrations...');

    // 1. attendance_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
        attendance_date DATE NOT NULL,
        action_type VARCHAR(10) NOT NULL CHECK (action_type IN ('check_in', 'check_out')),
        timestamp TIMESTAMP NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8)
      )
    `);

    // 2. holidays table
    await client.query(`
      CREATE TABLE IF NOT EXISTS holidays (
        id SERIAL PRIMARY KEY,
        holiday_name VARCHAR(255) NOT NULL,
        holiday_type VARCHAR(50) NOT NULL DEFAULT 'public_holiday',
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 3. Drop short_leave_cutoff_time column if it still exists
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'settings' AND column_name = 'short_leave_cutoff_time') THEN
          ALTER TABLE settings DROP COLUMN short_leave_cutoff_time;
        END IF;
      END $$
    `);

    // 4. Migrate short_leave → absent and update status constraint
    await client.query(`UPDATE attendance SET status = 'absent' WHERE status = 'short_leave'`);
    await client.query(`
      DO $$
      BEGIN
        -- Only update constraint if it doesn't already include the new statuses
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.check_constraints
          WHERE constraint_name = 'attendance_status_check'
          AND check_clause LIKE '%day_off%'
        ) THEN
          ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
          ALTER TABLE attendance ADD CONSTRAINT attendance_status_check
            CHECK (status IN ('present', 'absent', 'medical_leave', 'holiday', 'day_off'));
        END IF;
      END $$
    `);

    console.log('[MIGRATION] All migrations applied successfully.');
  } catch (err) {
    console.error('[MIGRATION] Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { runMigrations };
