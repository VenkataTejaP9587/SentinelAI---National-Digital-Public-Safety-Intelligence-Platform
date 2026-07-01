import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Numeric, Text, ForeignKey, Date, JSON, event
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    mobile_number_encrypted = Column(Text, nullable=False)
    mobile_number_hash = Column(String(255), unique=True, nullable=False)
    aadhaar_hash = Column(Text, nullable=True)
    full_name = Column(Text, nullable=True)
    password_hash = Column(Text, nullable=False)
    preferred_language = Column(String(10), default="hi")
    state = Column(String(50), nullable=True)
    district = Column(String(50), nullable=True)
    role = Column(String(50), default="citizen") # 'citizen', 'police_officer', 'bank_officer', 'telecom_officer', 'admin'
    is_active = Column(Boolean, default=True)
    consent_given = Column(Boolean, default=False)
    consent_timestamp = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    police_profile = relationship("PoliceOfficer", back_populates="user", uselist=False)
    complaints = relationship("FraudCase", back_populates="victim")

class PoliceOfficer(Base):
    __tablename__ = "police_officers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_number = Column(String(50), unique=True, nullable=False)
    rank = Column(String(50), nullable=True)
    station_name = Column(String(100), nullable=True)
    district = Column(String(50), nullable=True)
    state = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="police_profile")
    cases = relationship("FraudCase", back_populates="assigned_officer")

class FraudCase(Base):
    __tablename__ = "fraud_cases"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(20), unique=True, nullable=False)
    case_type = Column(String(50), nullable=False) # 'digital_arrest', 'currency_counterfeit', etc.
    status = Column(String(50), default="reported") # 'reported', 'under_review', 'investigating', 'resolved', 'closed'
    fraud_risk_score = Column(Numeric(5, 2), nullable=True)
    risk_level = Column(String(20), default="low") # Auto-calculated via listener below
    victim_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_officer_id = Column(String(36), ForeignKey("police_officers.id", ondelete="SET NULL"), nullable=True)
    fraud_amount_inr = Column(Numeric(15, 2), nullable=True)
    location_lat = Column(Numeric(9, 6), nullable=True)
    location_lng = Column(Numeric(9, 6), nullable=True)
    location_address = Column(Text, nullable=True)
    district = Column(String(50), nullable=True)
    state = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    ai_analysis_summary = Column(JSON, nullable=True)
    report_source = Column(String(20), default="web") # 'web', 'whatsapp', 'ivr', 'mobile_app'
    ncrp_reference = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    victim = relationship("User", back_populates="complaints")
    assigned_officer = relationship("PoliceOfficer", back_populates="cases")
    evidences = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    currency_logs = relationship("CurrencyDetectionLog", back_populates="case")

# Event listener to compute risk_level automatically in Python for SQLite/database independence
@event.listens_for(FraudCase, "before_insert")
@event.listens_for(FraudCase, "before_update")
def compute_fraud_case_risk_level(mapper, connection, target):
    if target.fraud_risk_score is not None:
        score = float(target.fraud_risk_score)
        if score < 30:
            target.risk_level = "low"
        elif score < 60:
            target.risk_level = "medium"
        elif score < 80:
            target.risk_level = "high"
        else:
            target.risk_level = "critical"
    else:
        target.risk_level = "low"

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("fraud_cases.id", ondelete="CASCADE"), nullable=False)
    evidence_type = Column(String(50), nullable=False) # 'audio', 'text_message', 'screenshot', etc.
    raw_data_ref = Column(Text, nullable=True) # file path
    text_content = Column(Text, nullable=True)
    ai_model_used = Column(String(100), nullable=True)
    analysis_result = Column(JSON, nullable=True)
    confidence_score = Column(Numeric(5, 4), nullable=True)
    explanation_data = Column(JSON, nullable=True)
    is_court_admissible = Column(Boolean, default=False)
    chain_of_custody = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("FraudCase", back_populates="evidences")

class FraudActor(Base):
    __tablename__ = "fraud_actors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    risk_score = Column(Numeric(5, 2), nullable=True)
    network_cluster_id = Column(String(36), nullable=True)
    total_cases_linked = Column(Integer, default=0)
    total_fraud_amount = Column(Numeric(15, 2), default=0)
    is_arrested = Column(Boolean, default=False)
    arrest_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    phone_numbers = relationship("ActorPhoneNumber", back_populates="actor", cascade="all, delete-orphan")
    bank_accounts = relationship("ActorBankAccount", back_populates="actor", cascade="all, delete-orphan")

class ActorPhoneNumber(Base):
    __tablename__ = "actor_phone_numbers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), ForeignKey("fraud_actors.id", ondelete="CASCADE"), nullable=False)
    phone_number = Column(String(15), nullable=True)
    phone_hash = Column(String(255), unique=True, nullable=True)
    carrier = Column(String(50), nullable=True)
    circle = Column(String(30), nullable=True)
    is_primary = Column(Boolean, default=False)
    first_seen = Column(DateTime(timezone=True), nullable=True)
    last_seen = Column(DateTime(timezone=True), nullable=True)
    sim_count = Column(Integer, default=1)

    actor = relationship("FraudActor", back_populates="phone_numbers")

class ActorBankAccount(Base):
    __tablename__ = "actor_bank_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), ForeignKey("fraud_actors.id", ondelete="CASCADE"), nullable=False)
    bank_account_encrypted = Column(Text, nullable=True)
    bank_account_hash = Column(String(255), unique=True, nullable=True)
    bank_name = Column(String(100), nullable=True)
    bank_ifsc = Column(String(11), nullable=True)
    upi_id_encrypted = Column(Text, nullable=True)
    upi_id_hash = Column(String(255), nullable=True)
    account_type = Column(String(20), nullable=True)
    total_credited = Column(Numeric(15, 2), default=0.0)
    total_debited = Column(Numeric(15, 2), default=0.0)
    is_frozen = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    actor = relationship("FraudActor", back_populates="bank_accounts")

class CurrencyDetectionLog(Base):
    __tablename__ = "currency_detection_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    image_hash = Column(String(64), nullable=False)
    image_s3_path = Column(Text, nullable=True)
    denomination = Column(Integer, nullable=True)
    series_year = Column(Integer, nullable=True)
    is_counterfeit = Column(Boolean, default=False)
    overall_confidence = Column(Numeric(5, 4), nullable=True)
    
    security_thread_score = Column(Numeric(5, 4), nullable=True)
    watermark_score = Column(Numeric(5, 4), nullable=True)
    microprint_score = Column(Numeric(5, 4), nullable=True)
    serial_number_score = Column(Numeric(5, 4), nullable=True)
    uv_feature_score = Column(Numeric(5, 4), nullable=True)
    latent_image_score = Column(Numeric(5, 4), nullable=True)
    texture_score = Column(Numeric(5, 4), nullable=True)
    
    models_used = Column(JSON, nullable=True)
    gradcam_heatmap_path = Column(Text, nullable=True)
    
    location_lat = Column(Numeric(9, 6), nullable=True)
    location_lng = Column(Numeric(9, 6), nullable=True)
    district = Column(String(50), nullable=True)
    state = Column(String(50), nullable=True)
    
    submitted_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    case_id = Column(String(36), ForeignKey("fraud_cases.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("FraudCase", back_populates="currency_logs")

class GeospatialCrimeEvent(Base):
    __tablename__ = "geospatial_crime_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String(50), nullable=True)
    location_lat = Column(Numeric(9, 6), nullable=False)
    location_lng = Column(Numeric(9, 6), nullable=False)
    h3_index_resolution7 = Column(String(20), nullable=True)
    h3_index_resolution9 = Column(String(20), nullable=True)
    district = Column(String(50), nullable=True)
    state = Column(String(50), nullable=True)
    severity = Column(String(20), nullable=True) # 'low', 'medium', 'high', 'critical'
    fraud_amount = Column(Numeric(15, 2), nullable=True)
    case_id = Column(String(36), ForeignKey("fraud_cases.id", ondelete="SET NULL"), nullable=True)
    event_timestamp = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CrimeHotspotPrediction(Base):
    __tablename__ = "crime_hotspot_predictions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    h3_index = Column(String(20), nullable=False)
    predicted_event_count = Column(Integer, nullable=True)
    predicted_severity = Column(String(20), nullable=True)
    confidence = Column(Numeric(5, 4), nullable=True)
    prediction_model = Column(String(50), nullable=True)
    valid_from = Column(DateTime(timezone=True), nullable=True)
    valid_until = Column(DateTime(timezone=True), nullable=True)
    district = Column(String(50), nullable=True)
    state = Column(String(50), nullable=True)
    recommended_patrol_units = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AIModelLog(Base):
    __tablename__ = "ai_model_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(20), nullable=True)
    service_name = Column(String(50), nullable=True)
    input_hash = Column(String(64), nullable=True)
    prediction = Column(JSON, nullable=True)
    confidence = Column(Numeric(5, 4), nullable=True)
    latency_ms = Column(Integer, nullable=True)
    gpu_used = Column(Boolean, default=False)
    explanation = Column(JSON, nullable=True)
    case_id = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ChatbotSession(Base):
    __tablename__ = "chatbot_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    channel = Column(String(20), default="web") # 'whatsapp', 'web', etc.
    language = Column(String(10), default="en")
    session_start = Column(DateTime(timezone=True), server_default=func.now())
    session_end = Column(DateTime(timezone=True), nullable=True)
    intent = Column(String(50), nullable=True)
    outcome = Column(String(100), nullable=True)
    fraud_case_created = Column(String(36), ForeignKey("fraud_cases.id", ondelete="SET NULL"), nullable=True)
    satisfaction_score = Column(Integer, nullable=True)

    messages = relationship("ChatbotMessage", back_populates="session", cascade="all, delete-orphan")

class ChatbotMessage(Base):
    __tablename__ = "chatbot_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("chatbot_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(10), nullable=False) # 'user', 'assistant'
    content = Column(Text, nullable=False)
    language = Column(String(10), default="en")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("ChatbotSession", back_populates="messages")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    alert_type = Column(String(50), nullable=True)
    severity = Column(String(20), nullable=True) # 'low', 'medium', 'high', 'critical'
    target_role = Column(String(50), nullable=True)
    target_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), nullable=True)
    message = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    is_read = Column(Boolean, default=False)
    sent_via = Column(JSON, nullable=True) # e.g. ["sms", "email"]
    case_id = Column(String(36), ForeignKey("fraud_cases.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class VerificationRequest(Base):
    __tablename__ = "verification_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_type = Column(String(30), nullable=True) # 'phone', 'upi', 'bank_account', 'url', 'qr'
    query_value = Column(String(255), nullable=False)
    result = Column(JSON, nullable=True)
    risk_score = Column(Numeric(5, 2), nullable=True)
    is_flagged = Column(Boolean, default=False)
    requested_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
