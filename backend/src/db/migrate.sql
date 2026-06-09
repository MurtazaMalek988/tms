-- TAMS Migration: run once against existing database

CREATE TABLE IF NOT EXISTS attendance_logs (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    action_type VARCHAR(10) NOT NULL CHECK (action_type IN ('check_in', 'check_out')),
    timestamp TIMESTAMP NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
);

CREATE TABLE IF NOT EXISTS holidays (
    id SERIAL PRIMARY KEY,
    holiday_name VARCHAR(255) NOT NULL,
    holiday_type VARCHAR(50) NOT NULL DEFAULT 'public_holiday',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Drop short_leave_cutoff_time if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'settings' AND column_name = 'short_leave_cutoff_time') THEN
        ALTER TABLE settings DROP COLUMN short_leave_cutoff_time;
    END IF;
END $$;

-- Migrate status constraint
DO $$
BEGIN
    UPDATE attendance SET status = 'absent' WHERE status = 'short_leave';
    ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
    ALTER TABLE attendance ADD CONSTRAINT attendance_status_check
        CHECK (status IN ('present', 'absent', 'medical_leave', 'holiday', 'day_off'));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint migration skipped: %', SQLERRM;
END $$;
