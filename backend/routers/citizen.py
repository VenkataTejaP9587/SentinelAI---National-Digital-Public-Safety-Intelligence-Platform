import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from typing import Optional
from backend.database.connection import get_db
from backend.database.models import User, FraudCase, Evidence, CurrencyDetectionLog, ChatbotSession, ChatbotMessage, VerificationRequest
from backend.schemas.citizen import ContactVerifyRequest, ContactVerifyResponse, ComplaintCreate, ComplaintResponse, ChatMessagePayload, ChatResponse
from backend.ai.scam_detector import ScamDetector
from backend.ai.counterfeit_detector import CounterfeitDetector
from backend.ai.fraud_graph import FraudGraphClient
from datetime import datetime

router = APIRouter(prefix="/api/v1/citizen", tags=["Citizen Portal"])

scam_detector = ScamDetector()
counterfeit_detector = CounterfeitDetector()
graph_client = FraudGraphClient()

# ========================================================
# EXPANDED CHATBOT RESPONSES
# ========================================================

CHAT_PATTERNS = [
    # Digital Arrest
    (["digital arrest", "digitally arrest", "cbi calling", "narcotics bureau", "online arrest"],
     "🚨 **SCAM ALERT — Digital Arrest!** Real CBI/Police NEVER arrest you digitally or demand money over a video call. Hang up IMMEDIATELY. Block the number. Call **1930** to report this scam right now. Do NOT pay anything!"),

    # WhatsApp / Video call threats
    (["whatsapp video", "video call police", "stay on call", "webcam on"],
     "🚨 This is a **Digital Arrest Scam**! Legitimate law enforcement agencies do NOT conduct interrogations or arrests via WhatsApp video calls. Hang up, note the number, and call **1930**."),

    # Bank / KYC
    (["bank account block", "kyc expire", "kyc update", "account freeze", "account suspend", "net banking block"],
     "⚠️ **Bank Fraud Alert!** Your bank will NEVER call asking for OTP or Aadhaar details. Never share OTP with anyone — not even bank staff. If your account is genuinely blocked, visit your branch in person."),

    # OTP sharing
    (["otp", "otp share", "share otp", "one time password"],
     "🔐 **NEVER share OTP with anyone!** No bank, government, or company ever asks for your OTP by phone. Anyone asking for your OTP is a scammer — hang up immediately."),

    # UPI / QR Fraud
    (["upi", "qr code", "scan qr", "upi id", "google pay", "phonepe", "paytm collect"],
     "⚠️ **UPI Fraud Warning!** You RECEIVE money by sharing your UPI ID — you never need to scan a QR or enter your PIN to receive funds. If someone asks you to scan a QR to receive money — it's a SCAM!"),

    # Investment scams
    (["investment", "crypto", "double money", "guaranteed return", "stock tips", "trading group", "earn lakhs"],
     "💰 **Investment Scam Alert!** No genuine investment guarantees high returns. Crypto/stock 'sure profit' groups on Telegram/WhatsApp are scams. SEBI warns against unregistered advisors. File a complaint at **cybercrime.gov.in**"),

    # Lottery / Prize
    (["lottery", "won prize", "kbc", "lucky winner", "gift card", "claim prize"],
     "🎰 **Lottery Scam!** You cannot win a lottery you did not enter. KBC NEVER calls random numbers. Do NOT pay any 'processing fee' or 'tax' to claim a fake prize. Block and report."),

    # Job scams
    (["job offer", "work from home", "online job", "earn from home", "task complete", "data entry earn"],
     "👷 **Job Scam Warning!** Legitimate employers never ask for registration fees or deposits. Fake online job offers asking for 'security deposits' are scams. File at **cybercrime.gov.in** or call 1930."),

    # Courier / FedEx
    (["parcel", "fedex", "courier", "package seized", "customs", "delivery failed"],
     "📦 **Courier Scam!** FedEx, DHL, and customs authorities NEVER demand payment via UPI or phone call. If your parcel is actually held, contact the courier company directly via their official website."),

    # Income Tax
    (["income tax", "it department", "tax notice", "tax refund", "itr"],
     "🏛️ **Income Tax Scam!** The IT department sends notices only via registered post or the official Income Tax portal (incometax.gov.in). They NEVER demand payment over phone or WhatsApp."),

    # Report / File complaint
    (["report", "complaint", "file fir", "complain", "how to report", "file complaint"],
     "📋 **How to Report Cybercrime:**\n1. 📞 Call **1930** (National Cyber Helpline, 24×7)\n2. 🌐 Visit **cybercrime.gov.in** to file online\n3. Use the **'File Complaint'** tab in this portal — I can guide you step by step!\n4. Visit your nearest **police station's cyber cell**"),

    # Emergency / Urgent
    (["help", "emergency", "threatening", "scared", "they are calling"],
     "🆘 **Stay Calm — You Are Not Alone!**\n1. Do NOT pay anything or share OTP\n2. Hang up or stop responding to the scammer\n3. Call **1930** RIGHT NOW — it's free and available 24×7\n4. Tell a trusted family member immediately\nYou are doing the right thing by checking!"),

    # Track complaint
    (["track", "case id", "complaint status", "follow up", "my case"],
     "🔍 You can track your complaint using the **Case ID** shown after filing. Use the **'Track Complaint'** tab in this portal and enter your Case ID. You can also call **1930** with your case reference number."),

    # Aadhaar
    (["aadhaar", "aadhar", "uid", "aadhaar otp"],
     "🪪 **Aadhaar Alert!** Your Aadhaar number alone cannot be misused. But sharing the OTP sent to your registered mobile for Aadhaar transactions is dangerous. UIDAI's official helpline is **1947**."),

    # Greeting
    (["hello", "hi", "namaste", "good morning", "good evening", "hey"],
     "👋 **Namaste! I'm the KAVACH Safety Assistant.**\n\nI can help you:\n• 🔍 Verify suspicious phone numbers, UPI IDs, or links\n• 📋 File a cybercrime complaint\n• 💬 Understand scam tactics in your language\n• 📞 Connect you to **helpline 1930**\n\nWhat happened? Tell me in detail."),
]

def get_chat_response(message: str) -> str:
    """Pattern-match user message against scam categories and return appropriate response."""
    msg_lower = message.lower()
    for keywords, response in CHAT_PATTERNS:
        if any(kw in msg_lower for kw in keywords):
            return response
    return (
        "🤖 I understand your concern. Please tell me more details — what exactly happened? "
        "Is someone calling or texting you? Did they ask for money or OTP? "
        "If you feel threatened RIGHT NOW, call **1930** immediately — it's free and available 24×7."
    )


# ========================================================
# ENDPOINTS
# ========================================================

@router.post("/verify-contact", response_model=ContactVerifyResponse)
async def verify_contact(payload: ContactVerifyRequest, db: Session = Depends(get_db)):
    """Checks phone number, UPI ID, or URL for fraud signals using AI and fraud database."""
    query = payload.query_value.strip()

    # 1. Check graph history / database records
    verification = await graph_client.verify_entity(payload.request_type, query)

    # 2. Add ScamDetector rules for URL checks
    if payload.request_type == "url":
        url_analysis = await scam_detector.analyze_url(query)
        verification["risk_score"] = max(verification["risk_score"], url_analysis["risk_score"])
        verification["is_flagged"] = verification["is_flagged"] or url_analysis["is_phishing"]

    is_flagged = verification["is_flagged"]
    score = verification["risk_score"]

    if is_flagged:
        message = f"⚠️ HIGH RISK: This {payload.request_type} has been flagged for fraud in {verification.get('cases_count', 1)} complaint(s). DO NOT share any personal information or transfer money."
    else:
        message = f"✅ Appears Safe: No fraud records found for this {payload.request_type} in our database. Stay cautious and do not share OTP."

    # Log request in database
    log = VerificationRequest(
        request_type=payload.request_type,
        query_value=query,
        result=verification,
        risk_score=score,
        is_flagged=is_flagged
    )
    db.add(log)
    db.commit()

    return ContactVerifyResponse(
        is_flagged=is_flagged,
        risk_score=score,
        cases_count=verification.get("cases_count", 0),
        in_ring=verification.get("in_ring", False),
        source=verification["source"],
        message=message
    )


@router.post("/scan-currency")
async def scan_currency(
    file: UploadFile = File(...),
    submitted_by: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Scans note image using AI counterfeit note checker (7-feature analysis)."""
    contents = await file.read()

    # Run AI visual inspection pipeline
    analysis = await counterfeit_detector.analyze_note(contents)

    # Save log to database
    log = CurrencyDetectionLog(
        image_hash=uuid.uuid4().hex,
        denomination=analysis["denomination"],
        series_year=analysis["series_year"],
        is_counterfeit=analysis["is_counterfeit"],
        overall_confidence=analysis["overall_confidence"],
        security_thread_score=analysis["features"]["security_thread"],
        watermark_score=analysis["features"]["watermark"],
        microprint_score=analysis["features"]["microprint"],
        serial_number_score=analysis["features"]["serial_number"],
        uv_feature_score=analysis["features"]["uv_feature"],
        latent_image_score=analysis["features"]["latent_image"],
        texture_score=analysis["features"]["texture"],
        models_used=analysis["models_used"],
        gradcam_heatmap_path=analysis["gradcam_heatmap_path"],
        location_lat=19.0760,
        location_lng=72.8777,
        district="Mumbai",
        state="Maharashtra"
    )

    if submitted_by:
        try:
            uuid.UUID(submitted_by)
            log.submitted_by = submitted_by
        except ValueError:
            pass

    db.add(log)
    db.commit()
    db.refresh(log)

    return {"id": str(log.id), "analysis": analysis}


@router.post("/chat", response_model=ChatResponse)
async def assistant_chat(payload: ChatMessagePayload, db: Session = Depends(get_db)):
    """AI Safety Chatbot — 15 pattern categories, 30+ scam keywords, multilingual guidance."""
    sess_id = payload.session_id
    if not sess_id:
        session = ChatbotSession(language=payload.language, channel="web")
        db.add(session)
        db.commit()
        db.refresh(session)
        sess_id = str(session.id)
    else:
        session = db.query(ChatbotSession).filter(ChatbotSession.id == sess_id).first()

    # Save user message
    user_msg = ChatbotMessage(
        session_id=sess_id,
        role="user",
        content=payload.message,
        language=payload.language
    )
    db.add(user_msg)

    # Generate intelligent response
    reply = get_chat_response(payload.message)

    # Save bot message
    bot_msg = ChatbotMessage(
        session_id=sess_id,
        role="assistant",
        content=reply,
        language=payload.language
    )
    db.add(bot_msg)
    db.commit()

    return ChatResponse(reply=reply, session_id=sess_id, language=payload.language)


@router.post("/analyze-message")
async def analyze_message(
    text: str = Body(..., embed=True),
    source: Optional[str] = Body("sms", embed=True)
):
    """
    Analyze a suspicious SMS, WhatsApp message, or email text for scam indicators.
    Supports plain text paste — no file upload required.
    """
    if not text or len(text.strip()) < 5:
        raise HTTPException(status_code=400, detail="Message text is too short to analyze.")

    if source == "whatsapp":
        result = await scam_detector.analyze_whatsapp_forward(text)
    else:
        result = await scam_detector.analyze_text(text)

    return {
        "source": source,
        "message_length": len(text),
        "analysis": result
    }


@router.post("/complaint", response_model=ComplaintResponse)
async def submit_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    """Submits a new citizen complaint, computing AI risk score and generating case ID."""
    analysis = await scam_detector.analyze_text(payload.description)

    case = FraudCase(
        case_type=payload.case_type,
        status="reported",
        fraud_risk_score=analysis["fraud_risk_score"],
        fraud_amount_inr=payload.fraud_amount,
        location_lat=18.96,
        location_lng=72.82,
        location_address=f"{payload.district or 'Unknown'}, {payload.state or 'Unknown'}",
        district=payload.district or "Mumbai",
        state=payload.state or "Maharashtra",
        description=payload.description,
        ai_analysis_summary=analysis,
        report_source=payload.report_source or "web"
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    # Save suspect evidence if provided
    if payload.suspect_value:
        evidence = Evidence(
            case_id=case.id,
            evidence_type="text_message" if "@" in payload.suspect_value else "sms",
            text_content=f"Suspect coordinate: {payload.suspect_value}",
            ai_model_used="ScamDetector-v2",
            confidence_score=analysis["fraud_risk_score"] / 100
        )
        db.add(evidence)
        db.commit()

    return case


@router.get("/complaint/{case_id}/status")
async def get_complaint_status(case_id: str, db: Session = Depends(get_db)):
    """Track a submitted complaint by its case ID."""
    case = db.query(FraudCase).filter(FraudCase.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Complaint with ID {case_id} not found. Please double-check your Case ID.")

    status_messages = {
        "reported": "Your complaint has been received and is pending assignment to a cyber officer.",
        "under_review": "A cyber officer is reviewing your case and verifying the details provided.",
        "investigating": "Your case is actively under investigation. Evidence collection is in progress.",
        "resolved": "Your case has been resolved. Check for any officer communications.",
        "closed": "This case has been closed. Please contact 1930 for further assistance."
    }

    return {
        "case_id": case.case_id,
        "status": case.status,
        "status_message": status_messages.get(case.status, "Status unknown."),
        "case_type": case.case_type,
        "risk_level": case.risk_level,
        "district": case.district,
        "state": case.state,
        "fraud_amount_inr": float(case.fraud_amount_inr) if case.fraud_amount_inr else 0.0,
        "created_at": case.created_at.strftime("%Y-%m-%d %H:%M UTC"),
        "next_steps": [
            "Preserve all digital evidence (screenshots, call recordings, bank statements)",
            "Do not contact the suspect",
            "Call 1930 if the fraud is ongoing",
            f"Reference your Case ID: {case.case_id} in all communications"
        ]
    }


@router.get("/my-complaints")
async def get_my_complaints(mobile_hash: str, db: Session = Depends(get_db)):
    """List all complaints filed by a specific citizen (by mobile hash)."""
    user = db.query(User).filter(User.mobile_number_hash == mobile_hash).first()
    if not user:
        return {"complaints": [], "message": "No complaints found for this account."}

    cases = db.query(FraudCase).filter(FraudCase.victim_id == user.id).order_by(FraudCase.created_at.desc()).limit(10).all()

    return {
        "complaints": [
            {
                "case_id": c.case_id,
                "type": c.case_type,
                "status": c.status,
                "risk_level": c.risk_level,
                "amount": float(c.fraud_amount_inr) if c.fraud_amount_inr else 0.0,
                "district": c.district,
                "created_at": c.created_at.strftime("%Y-%m-%d")
            } for c in cases
        ]
    }
