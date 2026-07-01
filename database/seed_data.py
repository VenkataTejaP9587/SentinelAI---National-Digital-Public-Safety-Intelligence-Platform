import os
import sys
import hashlib
from datetime import datetime, timedelta

# Add parent workspace to sys path so backend imports resolve
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from backend.database.connection import SessionLocal, engine, Base
from backend.database.models import User, PoliceOfficer, FraudCase, Evidence, FraudActor, ActorPhoneNumber, ActorBankAccount, GeospatialCrimeEvent, AuditLog

def get_hash(val: str) -> str:
    return hashlib.sha256(val.encode()).hexdigest()

def encrypt_val(val: str) -> str:
    import base64
    return base64.b64encode(val.encode()).decode()

def seed_database():
    print("Initiating database seeding...")
    # Ensure SQLite tables exist before seeding
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # Check if database is already seeded
        if db.query(User).first():
            print("Database already contains data. Skipping seeding.")
            return

        # ========================================================
        # 1. SEED SYSTEM USERS
        # ========================================================
        print("Seeding Users...")
        
        # Passwords: standard 'password' hashed
        pwd_hash = get_hash("password")
        
        users_to_create = [
            User(
                full_name="System Administrator",
                mobile_number_encrypted=encrypt_val("9999999999"),
                mobile_number_hash=get_hash("9999999999"),
                password_hash=pwd_hash,
                role="admin",
                state="Delhi",
                district="Delhi Central"
            ),
            User(
                full_name="Inspector Sharma",
                mobile_number_encrypted=encrypt_val("8888888888"),
                mobile_number_hash=get_hash("8888888888"),
                password_hash=pwd_hash,
                role="police_officer",
                state="Maharashtra",
                district="Mumbai"
            ),
            User(
                full_name="Amit Patel (SBI Officer)",
                mobile_number_encrypted=encrypt_val("7777777777"),
                mobile_number_hash=get_hash("7777777777"),
                password_hash=pwd_hash,
                role="bank_officer",
                state="Gujarat",
                district="Ahmedabad"
            ),
            User(
                full_name="Sanjay Sen (Jio Analyst)",
                mobile_number_encrypted=encrypt_val("6666666666"),
                mobile_number_hash=get_hash("6666666666"),
                password_hash=pwd_hash,
                role="telecom_officer",
                state="Karnataka",
                district="Bengaluru"
            ),
            User(
                full_name="Subhash Rao (Citizen)",
                mobile_number_encrypted=encrypt_val("9876543210"),
                mobile_number_hash=get_hash("9876543210"),
                password_hash=pwd_hash,
                role="citizen",
                state="Maharashtra",
                district="Mumbai"
            )
        ]
        
        db.add_all(users_to_create)
        db.commit()
        
        # Get users for reference
        admin_user = db.query(User).filter(User.role == "admin").first()
        police_user = db.query(User).filter(User.role == "police_officer").first()
        citizen_user = db.query(User).filter(User.role == "citizen").first()

        # ========================================================
        # 2. SEED POLICE PROFILE
        # ========================================================
        print("Seeding Police Profile...")
        officer = PoliceOfficer(
            user_id=police_user.id,
            badge_number="PO-MUM4012",
            rank="Inspector",
            station_name="Mumbai Cyber Crime Cell",
            district="Mumbai",
            state="Maharashtra"
        )
        db.add(officer)
        db.commit()
        db.refresh(officer)

        # ========================================================
        # 3. SEED SUSPECT ACTORS (Neo4j mirrors)
        # ========================================================
        print("Seeding Suspect Profiles...")
        actor = FraudActor(
            risk_score=94.0,
            total_cases_linked=7,
            total_fraud_amount=4750000.0
        )
        db.add(actor)
        db.commit()
        db.refresh(actor)
        
        # Link phone numbers and banks to suspect actor
        phone = ActorPhoneNumber(
            actor_id=actor.id,
            phone_number="9876543210",
            phone_hash=get_hash("9876543210"),
            carrier="Airtel",
            circle="Maharashtra",
            is_primary=True,
            sim_count=4
        )
        bank_acc = ActorBankAccount(
            actor_id=actor.id,
            bank_account_encrypted=encrypt_val("12345678904"),
            bank_account_hash="AC-8904",
            bank_name="State Bank of India",
            bank_ifsc="SBIN0000214",
            upi_id_encrypted=encrypt_val("mule1@okaxis"),
            upi_id_hash="mule1@okaxis",
            account_type="Savings",
            total_credited=4250000.0,
            is_frozen=False
        )
        
        db.add(phone)
        db.add(bank_acc)
        db.commit()

        # ========================================================
        # 4. SEED COMPLAINTS (Fraud cases)
        # ========================================================
        print("Seeding Fraud cases...")
        
        cases = [
            FraudCase(
                case_id="KV2024001234",
                case_type="digital_arrest",
                status="investigating",
                fraud_risk_score=97.00,
                victim_id=citizen_user.id,
                assigned_officer_id=officer.id,
                fraud_amount_inr=1550000.0,
                location_lat=18.9696,
                location_lng=72.8230,
                location_address="Bandra West, Mumbai",
                district="Mumbai",
                state="Maharashtra",
                description="Victim received a call from +91 98765 43210 claiming to be CBI officers. They alleged a FedEx courier contains drugs and placed the victim under 'digital arrest' via Skype, extorting money.",
                ai_analysis_summary={
                    "is_fraud": True,
                    "risk_score": 97.0,
                    "explanation": {
                        "nlp_triggers": ["digital arrest", "CBI office", "drugs package"],
                        "deepfake_probability": 0.04
                    }
                },
                report_source="web"
            ),
            FraudCase(
                case_id="KV2024001235",
                case_type="currency_counterfeit",
                status="reported",
                fraud_risk_score=88.00,
                victim_id=citizen_user.id,
                fraud_amount_inr=500.0,
                location_lat=19.0176,
                location_lng=72.8561,
                location_address="Mumbai Central Railway Station",
                district="Mumbai",
                state="Maharashtra",
                description="Note of ₹500 scanned at the local ticket counter shows fake security thread under visual inspection and color-shift failures.",
                ai_analysis_summary={
                    "is_fraud": True,
                    "risk_score": 88.0,
                    "explanation": {
                        "thread_match_score": 0.12,
                        "watermark_match_score": 0.09
                    }
                },
                report_source="web"
            )
        ]
        
        db.add_all(cases)
        db.commit()

        # ========================================================
        # 5. SEED EVIDENCE
        # ========================================================
        print("Seeding Evidence attachments...")
        case_ref = db.query(FraudCase).filter(FraudCase.case_id == "KV2024001234").first()
        
        evidences = [
            Evidence(
                case_id=case_ref.id,
                evidence_type="audio",
                raw_data_ref="/uploads/evidence_arrest_audio.wav",
                text_content="A courier package containing illegal narcotics has been seized by customs. You are required to log into Skype call with CBI.",
                ai_model_used="Whisper-large-v3",
                confidence_score=0.9654,
                is_court_admissible=True
            ),
            Evidence(
                case_id=case_ref.id,
                evidence_type="screenshot",
                raw_data_ref="/uploads/whatsapp_profile_cbi.jpg",
                text_content="WhatsApp profile picture showing fake CBI ID card emblem used to intimidate citizen.",
                ai_model_used="YOLOv11-Badge-Detector",
                confidence_score=0.8920,
                is_court_admissible=False
            )
        ]
        db.add_all(evidences)
        db.commit()

        # ========================================================
        # 6. SEED GEOSPATIAL HEATMAPS
        # ========================================================
        print("Seeding Geospatial Events...")
        geo_events = [
            GeospatialCrimeEvent(
                event_type="digital_arrest",
                location_lat=18.9696,
                location_lng=72.8230,
                district="Mumbai",
                state="Maharashtra",
                severity="critical",
                fraud_amount=1550000.0,
                case_id=case_ref.id
            ),
            GeospatialCrimeEvent(
                event_type="currency_counterfeit",
                location_lat=19.0176,
                location_lng=72.8561,
                district="Mumbai",
                state="Maharashtra",
                severity="high",
                fraud_amount=500.0
            )
        ]
        db.add_all(geo_events)
        
        # ========================================================
        # 7. SEED AUDITS
        # ========================================================
        print("Seeding System Audit log...")
        audit = AuditLog(
            user_id=admin_user.id,
            action="DATABASE_SEED",
            description="System successfully initialized with default security roles, mock complaints, and graph metadata.",
            ip_address="127.0.0.1"
        )
        db.add(audit)
        db.commit()

        print("Seeding operations finished successfully!")
        
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
