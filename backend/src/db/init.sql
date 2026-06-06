-- TAMS Database Initialization

CREATE TABLE IF NOT EXISTS principals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'principal',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    school_name VARCHAR(255) DEFAULT 'My School',
    school_latitude DECIMAL(10, 8) DEFAULT 0,
    school_longitude DECIMAL(11, 8) DEFAULT 0,
    allowed_radius INTEGER DEFAULT 100,
    short_leave_cutoff_time TIME DEFAULT '13:30:00',
    late_cutoff_time TIME DEFAULT '09:00:00',
    absence_processing_time TIME DEFAULT '17:00:00',
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'absent'
        CHECK (status IN ('present', 'absent', 'short_leave', 'medical_leave')),
    check_in_latitude DECIMAL(10, 8),
    check_in_longitude DECIMAL(11, 8),
    check_out_latitude DECIMAL(10, 8),
    check_out_longitude DECIMAL(11, 8),
    remarks TEXT,
    medical_certificate_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(teacher_id, attendance_date)
);

-- Default settings row (will be replaced by seed.js with proper defaults)
INSERT INTO settings (id, school_name) VALUES (1, 'My School')
ON CONFLICT (id) DO NOTHING;
