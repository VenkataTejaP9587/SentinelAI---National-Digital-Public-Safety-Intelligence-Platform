-- ============================================================
-- KAVACH-AI DATABASE SCHEMA
-- PostgreSQL 15 + TimescaleDB + PostGIS
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

DO $$ BEGIN
    CREATE TYPE case_type AS ENUM (
        'digital_arrest', 'currency_counterfeit', 'network_fraud',
        'phishing', 'upi_fraud', 'investment_scam', 'impersonation'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE case_status AS ENUM (
        'reported', 'under_review', 'investigating', 
        'resolved', 'closed', 'escalated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'citizen', 'police_officer', 'bank_officer',
        'telecom_officer', 'admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE evidence_type AS ENUM (
        'audio', 'text_message', 'sms', 'email', 'url',
        'currency_image', 'screenshot', 'transaction_log', 'document'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- CORE USER TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mobile_number_encrypted TEXT NOT NULL,        -- AES-256 encrypted
    mobile_number_hash TEXT UNIQUE NOT NULL,      -- SHA-256 for lookup
    aadhaar_hash TEXT,                            -- SHA-256 hash only
    full_name TEXT,
    password_hash TEXT NOT NULL,                  -- Bcrypt hash
    preferred_language VARCHAR(10) DEFAULT 'hi',
    state VARCHAR(50),
    district VARCHAR(50),
    role user_role DEFAULT 'citizen',
    is_active BOOLEAN DEFAULT TRUE,
    consent_given BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_mobile_hash ON users(mobile_number_hash);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Law enforcement officers
CREATE TABLE IF NOT EXISTS police_officers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_number VARCHAR(50) UNIQUE NOT NULL,
    rank VARCHAR(50),
    station_name VARCHAR(100),
    district VARCHAR(50),
    state VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FRAUD CASE MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS fraud_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id VARCHAR(20) UNIQUE NOT NULL,          -- FIR-style case ID e.g., KV2024001234
    case_type case_type NOT NULL,
    status case_status DEFAULT 'reported',
    fraud_risk_score DECIMAL(5,2) CHECK (fraud_risk_score BETWEEN 0 AND 100),
    risk_level risk_level GENERATED ALWAYS AS (
        CASE
            WHEN fraud_risk_score < 30 THEN 'low'::risk_level
            WHEN fraud_risk_score < 60 THEN 'medium'::risk_level
            WHEN fraud_risk_score < 80 THEN 'high'::risk_level
            ELSE 'critical'::risk_level
        END
    ) STORED,
    victim_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_officer_id UUID REFERENCES police_officers(id) ON DELETE SET NULL,
    fraud_amount_inr DECIMAL(15,2),
    location_lat DECIMAL(9,6),
    location_lng DECIMAL(9,6),
    location_address TEXT,
    district VARCHAR(50),
    state VARCHAR(50),
    description TEXT,
    ai_analysis_summary JSONB,
    report_source VARCHAR(20) DEFAULT 'web',      -- web, whatsapp, ivr, mobile_app
    ncrp_reference VARCHAR(50),                   -- cybercrime.gov.in reference
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_cases_type ON fraud_cases(case_type);
CREATE INDEX IF NOT EXISTS idx_fraud_cases_status ON fraud_cases(status);
CREATE INDEX IF NOT EXISTS idx_fraud_cases_created ON fraud_cases(created_at DESC);

-- ============================================================
-- EVIDENCE TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES fraud_cases(id) ON DELETE CASCADE,
    evidence_type evidence_type NOT NULL,
    raw_data_ref TEXT,                            -- S3/local file path for binary data
    text_content TEXT,                            -- For text-based evidence
    ai_model_used VARCHAR(100),
    analysis_result JSONB,                        -- Full AI analysis output
    confidence_score DECIMAL(5,4),
    explanation_data JSONB,                       -- SHAP/LIME/Grad-CAM output
    is_court_admissible BOOLEAN DEFAULT FALSE,
    chain_of_custody JSONB,                       -- Tamper-proof audit trail
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_case ON evidence(case_id);

-- ============================================================
-- FRAUD ACTORS (Suspects)
-- ============================================================

CREATE TABLE IF NOT EXISTS fraud_actors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_score DECIMAL(5,2),
    network_cluster_id UUID,
    total_cases_linked INTEGER DEFAULT 0,
    total_fraud_amount DECIMAL(15,2) DEFAULT 0,
    is_arrested BOOLEAN DEFAULT FALSE,
    arrest_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS actor_phone_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES fraud_actors(id) ON DELETE CASCADE,
    phone_number VARCHAR(15),
    phone_hash TEXT UNIQUE,
    carrier VARCHAR(50),
    circle VARCHAR(30),
    is_primary BOOLEAN DEFAULT FALSE,
    first_seen TIMESTAMPTZ,
    last_seen TIMESTAMPTZ,
    sim_count INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_actor_phones ON actor_phone_numbers(phone_hash);

CREATE TABLE IF NOT EXISTS actor_bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES fraud_actors(id) ON DELETE CASCADE,
    bank_account_encrypted TEXT,
    bank_account_hash TEXT UNIQUE,
    bank_name VARCHAR(100),
    bank_ifsc VARCHAR(11),
    upi_id_encrypted TEXT,
    upi_id_hash TEXT,
    account_type VARCHAR(20),
    total_credited DECIMAL(15,2),
    total_debited DECIMAL(15,2),
    is_frozen BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actor_banks ON actor_bank_accounts(bank_account_hash);

-- ============================================================
-- CURRENCY DETECTION LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS currency_detection_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_hash VARCHAR(64) NOT NULL,              -- SHA-256 of submitted image
    image_s3_path TEXT,
    denomination INTEGER,                          -- 10, 20, 50, 100, 200, 500, 2000
    series_year INTEGER,
    is_counterfeit BOOLEAN,
    overall_confidence DECIMAL(5,4),
    
    -- Feature-level scores (0-1)
    security_thread_score DECIMAL(5,4),
    watermark_score DECIMAL(5,4),
    microprint_score DECIMAL(5,4),
    serial_number_score DECIMAL(5,4),
    uv_feature_score DECIMAL(5,4),
    latent_image_score DECIMAL(5,4),
    texture_score DECIMAL(5,4),
    
    -- Models used
    models_used JSONB,
    gradcam_heatmap_path TEXT,
    
    -- Location
    location_lat DECIMAL(9,6),
    location_lng DECIMAL(9,6),
    district VARCHAR(50),
    state VARCHAR(50),
    
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    case_id UUID REFERENCES fraud_cases(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GEOSPATIAL CRIME DATA
-- ============================================================

CREATE TABLE IF NOT EXISTS geospatial_crime_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50),
    location_lat DECIMAL(9,6),
    location_lng DECIMAL(9,6),
    h3_index_resolution7 VARCHAR(20),            -- H3 hexagon index
    h3_index_resolution9 VARCHAR(20),
    district VARCHAR(50),
    state VARCHAR(50),
    severity risk_level,
    fraud_amount DECIMAL(15,2),
    case_id UUID REFERENCES fraud_cases(id) ON DELETE SET NULL,
    event_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predicted hotspots
CREATE TABLE IF NOT EXISTS crime_hotspot_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    h3_index VARCHAR(20) NOT NULL,
    predicted_event_count INTEGER,
    predicted_severity risk_level,
    confidence DECIMAL(5,4),
    prediction_model VARCHAR(50),
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    district VARCHAR(50),
    state VARCHAR(50),
    recommended_patrol_units INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI MODEL AUDIT LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_model_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(20),
    service_name VARCHAR(50),
    input_hash VARCHAR(64),
    prediction JSONB,
    confidence DECIMAL(5,4),
    latency_ms INTEGER,
    gpu_used BOOLEAN DEFAULT FALSE,
    explanation JSONB,
    case_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CITIZEN CHATBOT SESSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS chatbot_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    channel VARCHAR(20),                          -- whatsapp, web, ivr, mobile
    language VARCHAR(10),
    session_start TIMESTAMPTZ DEFAULT NOW(),
    session_end TIMESTAMPTZ,
    intent VARCHAR(50),
    outcome VARCHAR(100),
    fraud_case_created UUID REFERENCES fraud_cases(id) ON DELETE SET NULL,
    satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5)
);

-- Conversation messages
CREATE TABLE IF NOT EXISTS chatbot_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
    role VARCHAR(10),                             -- user, assistant
    content TEXT,
    language VARCHAR(10),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ALERT & NOTIFICATION LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(50),
    severity risk_level,
    target_role user_role,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(200),
    message TEXT,
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    sent_via TEXT[],                              -- push, sms, email, whatsapp
    case_id UUID REFERENCES fraud_cases(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VERIFICATION REQUESTS (Citizen queries)
-- ============================================================

CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_type VARCHAR(30),                     -- phone, upi, bank_account, url, qr
    query_value VARCHAR(255) NOT NULL,
    result JSONB,
    risk_score DECIMAL(5,2),
    is_flagged BOOLEAN,
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SYSTEM AUDIT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fraud_cases_updated_at ON fraud_cases;
CREATE TRIGGER fraud_cases_updated_at
    BEFORE UPDATE ON fraud_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Case ID Sequence and Trigger
CREATE SEQUENCE IF NOT EXISTS case_id_seq START 1000;

CREATE OR REPLACE FUNCTION generate_case_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.case_id IS NULL THEN
        NEW.case_id = 'KV' || TO_CHAR(NOW(), 'YYYY') || LPAD(nextval('case_id_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_fraud_case_id ON fraud_cases;
CREATE TRIGGER generate_fraud_case_id
    BEFORE INSERT ON fraud_cases
    FOR EACH ROW EXECUTE FUNCTION generate_case_id();
