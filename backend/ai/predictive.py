import hashlib
from typing import Dict, Any, List

class PredictiveEngine:
    """
    Predictive AI Engine.
    Simulates XGBoost transaction risk scoring, mule velocity detection,
    and emerging scam campaign intelligence with realistic Indian fraud context.
    """

    # Known mule account patterns
    KNOWN_MULE_PATTERNS = [
        "mule", "scam", "904", "214", "8904", "1124", "9041", "rentpay", "collect"
    ]

    # Indian high-value scam campaigns (regularly updated dataset)
    SCAM_CAMPAIGNS = [
        {
            "campaign_id": "CAMP-ARREST-2024-01",
            "name": "Digital Arrest CBI Impersonation Wave",
            "confidence_score": 0.963,
            "urgency_level": "critical",
            "trend": "rising",
            "channels": ["WhatsApp Video Call", "Phone Call"],
            "target_demographics": "Senior Citizens (60+), Retired Government Employees",
            "predominant_states": ["MH", "DL", "KA", "GJ"],
            "registered_domains": ["cbi-arrest.online", "cybercrime-notice.top"],
            "estimated_active_nodes": 312,
            "avg_victim_loss_inr": 850000,
            "total_cases_last_30d": 1847,
            "state_advisory": "Issue public advisories via Doordarshan and regional FM radio channels.",
            "target_helpline": "1930",
            "modus_operandi": "Caller claims victim's Aadhaar/SIM is linked to money laundering. Keeps victim on video call for hours demanding 'digital bail'."
        },
        {
            "campaign_id": "CAMP-TRAI-2024-02",
            "name": "TRAI SIM Verification Scam",
            "confidence_score": 0.942,
            "urgency_level": "high",
            "trend": "stable",
            "channels": ["Automated IVR Call", "WhatsApp"],
            "target_demographics": "Prepaid Mobile Users, Senior Citizens",
            "predominant_states": ["UP", "RJ", "HR"],
            "registered_domains": ["trai-sim-verify.online", "trai-kyc-check.cc"],
            "estimated_active_nodes": 185,
            "avg_victim_loss_inr": 45000,
            "total_cases_last_30d": 2341,
            "state_advisory": "Coordinate with Jio, Airtel, Vi to block spoofed TRAI caller IDs.",
            "target_helpline": "1800-11-4000",
            "modus_operandi": "Robocall warns SIM will be disconnected unless KYC is updated via a phishing link within 2 hours."
        },
        {
            "campaign_id": "CAMP-PIG-2024-03",
            "name": "Pig Butchering Investment Fraud (Crypto)",
            "confidence_score": 0.938,
            "urgency_level": "high",
            "trend": "rising",
            "channels": ["Instagram", "WhatsApp", "Telegram"],
            "target_demographics": "Young Professionals (25-45), NRIs",
            "predominant_states": ["MH", "TN", "KA", "AP"],
            "registered_domains": ["crypto-profits-india.cc", "ai-trading-bot.xyz"],
            "estimated_active_nodes": 89,
            "avg_victim_loss_inr": 2400000,
            "total_cases_last_30d": 428,
            "state_advisory": "Coordinate with SEBI to suspend unregistered investment platforms.",
            "target_helpline": "1930",
            "modus_operandi": "Scammer builds trust over weeks via social media, introduces victim to a fake investment platform showing artificial profits, then drains all funds."
        },
        {
            "campaign_id": "CAMP-UTILITY-2024-04",
            "name": "Electricity Disconnection Threat Scam",
            "confidence_score": 0.886,
            "urgency_level": "medium",
            "trend": "stable",
            "channels": ["SMS", "WhatsApp"],
            "target_demographics": "Urban Householders, Small Business Owners",
            "predominant_states": ["UP", "GJ", "RJ", "MP"],
            "registered_domains": ["electricity-bill-pay.xyz", "power-bill-support.top"],
            "estimated_active_nodes": 220,
            "avg_victim_loss_inr": 12000,
            "total_cases_last_30d": 3120,
            "state_advisory": "Advise DISCOMs to send verified SMS only from registered short codes.",
            "target_helpline": "1912",
            "modus_operandi": "SMS threatens power cut within 2 hours unless UPI payment is made to a scam VPA."
        },
        {
            "campaign_id": "CAMP-FEDEX-2024-05",
            "name": "FedEx / Courier Parcel Scam",
            "confidence_score": 0.871,
            "urgency_level": "high",
            "trend": "rising",
            "channels": ["Phone Call", "WhatsApp"],
            "target_demographics": "Online Shoppers, NRIs",
            "predominant_states": ["DL", "MH", "KA"],
            "registered_domains": ["fedex-customs.online", "dhl-clearance.top"],
            "estimated_active_nodes": 145,
            "avg_victim_loss_inr": 180000,
            "total_cases_last_30d": 892,
            "state_advisory": "Coordinate with customs authorities for official communication protocols.",
            "target_helpline": "1930",
            "modus_operandi": "Caller says international parcel contains contraband, demands customs penalty payment to avoid arrest."
        },
        {
            "campaign_id": "CAMP-JOB-2024-06",
            "name": "Fake Job Offer / Part-Time Task Scam",
            "confidence_score": 0.844,
            "urgency_level": "medium",
            "trend": "rising",
            "channels": ["Telegram", "WhatsApp", "LinkedIn Fake Profiles"],
            "target_demographics": "Job Seekers (18-35), Homemakers",
            "predominant_states": ["All States"],
            "registered_domains": ["work-from-home-earn.xyz", "online-jobs-india.click"],
            "estimated_active_nodes": 450,
            "avg_victim_loss_inr": 35000,
            "total_cases_last_30d": 5200,
            "state_advisory": "Campaign with Ministry of Labour to raise awareness about fake job portals.",
            "target_helpline": "1800-180-5412",
            "modus_operandi": "Offers easy tasks (YouTube likes, hotel reviews) for pay. Once victim is hooked, asks for 'task deposit' that is never returned."
        },
    ]

    def _risk_from_string(self, s: str, spread: float = 8.0) -> float:
        """Deterministic float noise from a string for non-random variation."""
        h = int(hashlib.md5(s.encode()).hexdigest(), 16)
        return ((h % 1000) / 1000.0 - 0.5) * spread

    async def predict_transaction_risk(self, amount: float, sender_acc: str, receiver_acc: str) -> Dict[str, Any]:
        """
        Real-time transaction risk scoring simulating XGBoost + Isolation Forest ensemble.
        Deterministic for same (amount, sender, receiver) triple.
        """
        risk_score = 10.0
        indicators = []
        risk_factors = {}

        # High value transfer
        if amount > 1000000:
            risk_score += 40.0
            indicators.append("VERY_HIGH_VALUE_TRANSFER")
            risk_factors["amount_risk"] = "Very high (>₹10L)"
        elif amount > 500000:
            risk_score += 28.0
            indicators.append("HIGH_VALUE_TRANSFER")
            risk_factors["amount_risk"] = "High (>₹5L)"
        elif amount > 100000:
            risk_score += 12.0
            indicators.append("ABOVE_THRESHOLD_TRANSFER")
            risk_factors["amount_risk"] = "Moderate (>₹1L)"

        # Known mule patterns
        combined = f"{sender_acc.lower()} {receiver_acc.lower()}"
        mule_matches = [p for p in self.KNOWN_MULE_PATTERNS if p in combined]
        if mule_matches:
            risk_score += 45.0
            indicators.append("KNOWN_MULE_INTERACTION")
            risk_factors["mule_pattern"] = f"Matched: {', '.join(mule_matches)}"

        # Unusual receiver patterns
        if "@" in receiver_acc and any(bank in receiver_acc.lower() for bank in ["okaxis", "okhdfc", "oksbi", "okicici"]):
            risk_score += 8.0
            indicators.append("UPI_HIGH_VELOCITY_RECEIVER")
            risk_factors["receiver_risk"] = "High-frequency UPI collector pattern"

        # Round number suspicious (often fraud amounts)
        if amount % 10000 == 0 and amount >= 50000:
            risk_score += 5.0
            indicators.append("ROUND_AMOUNT_FLAG")

        # Add deterministic noise
        noise = self._risk_from_string(f"{sender_acc}_{receiver_acc}_{amount}", 5.0)
        risk_score = min(100.0, max(5.0, risk_score + noise))
        is_high_risk = risk_score >= 60.0

        return {
            "transaction_risk_score": round(risk_score, 2),
            "is_high_risk": is_high_risk,
            "risk_level": "critical" if risk_score >= 80 else "high" if risk_score >= 60 else "medium" if risk_score >= 35 else "low",
            "indicators": indicators,
            "risk_factors": risk_factors,
            "decision": "BLOCK_TRANSACTION" if risk_score >= 82.0 else "HOLD_AND_VERIFY" if is_high_risk else "APPROVE",
            "recommended_action": (
                "Immediately block this transaction and notify bank fraud team."
                if risk_score >= 82.0 else
                "Place transaction on 24-hour manual review hold before processing."
                if is_high_risk else
                "Transaction approved. Continue monitoring."
            )
        }

    async def predict_mule_velocity(self, account_hash: str, credits_last_24h: float, credit_count: int) -> Dict[str, Any]:
        """
        Detect money mule accounts based on abnormal credit velocity patterns.
        """
        velocity_score = 5.0
        flags = []

        # High credit frequency (many small credits = smurfing)
        if credit_count > 20:
            velocity_score += 40.0
            flags.append("HIGH_CREDIT_FREQUENCY")
        elif credit_count > 10:
            velocity_score += 20.0
            flags.append("ELEVATED_CREDIT_FREQUENCY")

        # High credit volume
        if credits_last_24h > 500000:
            velocity_score += 45.0
            flags.append("VELOCITY_HIGH_CREDIT_VOLUME")
        elif credits_last_24h > 100000:
            velocity_score += 20.0
            flags.append("VELOCITY_MODERATE_CREDIT_VOLUME")

        # Add deterministic noise
        noise = self._risk_from_string(account_hash, 4.0)
        velocity_score = min(100.0, max(5.0, velocity_score + noise))

        return {
            "account_hash": account_hash,
            "mule_probability": round(velocity_score / 100.0, 4),
            "velocity_risk_score": round(velocity_score, 2),
            "is_suspected_mule": velocity_score >= 60.0,
            "flags": flags,
            "recommendation": (
                "FREEZE_ACCOUNT — Escalate to bank fraud team for immediate investigation."
                if velocity_score >= 80.0 else
                "FLAG_FOR_REVIEW — Monitor closely for next 48 hours."
                if velocity_score >= 60.0 else
                "MONITOR — Normal activity pattern."
            )
        }

    async def get_emerging_scam_campaigns(self) -> List[Dict[str, Any]]:
        """
        Returns active scam campaign intelligence sorted by confidence score.
        Represents aggregated intelligence from cybercrime portal, NCRP, and telecom data.
        """
        return sorted(self.SCAM_CAMPAIGNS, key=lambda c: -c["confidence_score"])
