from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ContactVerifyRequest(BaseModel):
    request_type: str = Field(..., description="phone, upi, bank_account, url, qr")
    query_value: str = Field(..., description="The value of the contact / URL to check")

class ContactVerifyResponse(BaseModel):
    is_flagged: bool
    risk_score: float
    cases_count: int
    in_ring: bool
    source: str
    message: str

class ComplaintCreate(BaseModel):
    case_type: str = Field(..., description="digital_arrest, currency_counterfeit, upi_fraud, etc.")
    description: str = Field(..., description="Description of the incident")
    suspect_value: Optional[str] = Field(None, description="Suspect's phone number or account number")
    fraud_amount: Optional[float] = Field(0.0, description="Amount lost in INR")
    state: Optional[str] = None
    district: Optional[str] = None
    report_source: Optional[str] = "web"

class ComplaintResponse(BaseModel):
    id: str
    case_id: str
    case_type: str
    status: str
    fraud_risk_score: Optional[float]
    risk_level: str
    fraud_amount_inr: Optional[float]
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ChatMessagePayload(BaseModel):
    message: str = Field(..., description="User message content")
    language: Optional[str] = "en"
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    session_id: str
    language: str
