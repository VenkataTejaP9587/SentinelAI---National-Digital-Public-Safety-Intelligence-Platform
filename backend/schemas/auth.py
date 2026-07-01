from pydantic import BaseModel, Field
from typing import Optional

class UserRegister(BaseModel):
    mobile_number: str = Field(..., description="10-digit mobile number")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    full_name: str = Field(..., description="Citizen or officer full name")
    role: str = Field("citizen", description="citizen, police_officer, bank_officer, telecom_officer, admin")
    preferred_language: Optional[str] = "en"
    state: Optional[str] = None
    district: Optional[str] = None

class UserLogin(BaseModel):
    mobile_number: str = Field(..., description="Registered mobile number")
    password: str = Field(..., description="Account password")

class OTPVerify(BaseModel):
    mobile_number: str = Field(...)
    otp_code: str = Field(..., min_length=6, max_length=6)

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: str
    mobile_number: str
    full_name: str
    role: str
    preferred_language: str
    state: Optional[str]
    district: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True
