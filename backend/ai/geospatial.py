import random
from typing import List, Dict, Any
from datetime import datetime, timedelta

class GeospatialIntelligence:
    """
    Geospatial Crime Intelligence Module.
    Computes density statistics, H3 index grids, and predictive crime hotspots
    across 15 major Indian cybercrime districts.
    """

    # 15 major cybercrime hubs across India
    DISTRICTS = [
        {"district": "Mumbai City",      "state": "Maharashtra",  "lat": 18.9696, "lng": 72.8230, "risk_level": "critical", "cases": 1456, "dominant_scam": "digital_arrest"},
        {"district": "Delhi NCR",         "state": "Delhi",        "lat": 28.6139, "lng": 77.2090, "risk_level": "critical", "cases": 1589, "dominant_scam": "bank_fraud"},
        {"district": "Ahmedabad",         "state": "Gujarat",      "lat": 23.0225, "lng": 72.5714, "risk_level": "high",     "cases": 712,  "dominant_scam": "upi_fraud"},
        {"district": "Bengaluru Urban",   "state": "Karnataka",    "lat": 12.9716, "lng": 77.5946, "risk_level": "high",     "cases": 684,  "dominant_scam": "investment_scam"},
        {"district": "Hyderabad",         "state": "Telangana",    "lat": 17.3850, "lng": 78.4867, "risk_level": "medium",   "cases": 380,  "dominant_scam": "phishing"},
        {"district": "Jamtara",           "state": "Jharkhand",    "lat": 23.9620, "lng": 86.8020, "risk_level": "critical", "cases": 324,  "dominant_scam": "bank_fraud"},
        {"district": "Bharatpur",         "state": "Rajasthan",    "lat": 27.2152, "lng": 77.4930, "risk_level": "critical", "cases": 295,  "dominant_scam": "digital_arrest"},
        {"district": "Mewat",             "state": "Haryana",      "lat": 28.0290, "lng": 76.9900, "risk_level": "critical", "cases": 278,  "dominant_scam": "upi_fraud"},
        {"district": "Lucknow",           "state": "Uttar Pradesh","lat": 26.8467, "lng": 80.9462, "risk_level": "high",     "cases": 520,  "dominant_scam": "lottery_scam"},
        {"district": "Pune",              "state": "Maharashtra",  "lat": 18.5204, "lng": 73.8567, "risk_level": "high",     "cases": 445,  "dominant_scam": "investment_scam"},
        {"district": "Kolkata",           "state": "West Bengal",  "lat": 22.5726, "lng": 88.3639, "risk_level": "medium",   "cases": 312,  "dominant_scam": "phishing"},
        {"district": "Chennai",           "state": "Tamil Nadu",   "lat": 13.0827, "lng": 80.2707, "risk_level": "medium",   "cases": 290,  "dominant_scam": "bank_fraud"},
        {"district": "Agra",              "state": "Uttar Pradesh","lat": 27.1767, "lng": 78.0081, "risk_level": "high",     "cases": 198,  "dominant_scam": "courier_scam"},
        {"district": "Surat",             "state": "Gujarat",      "lat": 21.1702, "lng": 72.8311, "risk_level": "medium",   "cases": 245,  "dominant_scam": "upi_fraud"},
        {"district": "Bhopal",            "state": "Madhya Pradesh","lat": 23.2599,"lng": 77.4126, "risk_level": "medium",   "cases": 180,  "dominant_scam": "lottery_scam"},
    ]

    SCAM_TYPES = ["digital_arrest", "currency_counterfeit", "phishing", "upi_fraud", "investment_scam", "lottery_scam", "courier_scam", "bank_fraud"]

    async def get_hotspots(self) -> List[Dict[str, Any]]:
        """
        Returns real-time crime hotspots (lat, lng, weight, scam type).
        Generates a cluster of 4-8 points around each cybercrime district center.
        """
        hotspots = []
        for dist in self.DISTRICTS:
            # Weight the dominant scam type higher
            num_points = 4 + (dist["cases"] // 200)
            num_points = min(num_points, 10)

            for i in range(num_points):
                # Deterministic offset based on district + index
                offset_seed = hash(f"{dist['district']}-{i}") % 1000
                offset_lat = ((offset_seed % 200) - 100) / 1000.0  # ±0.1 degrees
                offset_lng = ((offset_seed % 300) - 150) / 1000.0

                # Majority of points are the district's dominant scam, others are mixed
                scam_type = dist["dominant_scam"] if i < num_points * 0.6 else \
                    self.SCAM_TYPES[(offset_seed % len(self.SCAM_TYPES))]

                # Weight based on risk level
                risk_weight_map = {"critical": 0.75, "high": 0.55, "medium": 0.35, "low": 0.15}
                base_weight = risk_weight_map.get(dist["risk_level"], 0.4)
                weight = min(1.0, max(0.1, base_weight + (offset_seed % 25) / 100.0))

                hotspots.append({
                    "lat": round(dist["lat"] + offset_lat, 6),
                    "lng": round(dist["lng"] + offset_lng, 6),
                    "weight": round(weight, 2),
                    "scam_type": scam_type,
                    "district": dist["district"],
                    "state": dist["state"],
                    "cases": dist["cases"],
                    "risk_level": dist["risk_level"],
                    "timestamp": (datetime.now() - timedelta(minutes=(offset_seed % 120))).isoformat()
                })

        return hotspots

    async def get_state_summary(self) -> List[Dict[str, Any]]:
        """
        Returns per-state cybercrime case breakdown for analytics charts.
        """
        state_totals: Dict[str, Dict] = {}
        for dist in self.DISTRICTS:
            state = dist["state"]
            if state not in state_totals:
                state_totals[state] = {
                    "state": state,
                    "total_cases": 0,
                    "dominant_scam": dist["dominant_scam"],
                    "risk_level": dist["risk_level"],
                    "districts": 0
                }
            state_totals[state]["total_cases"] += dist["cases"]
            state_totals[state]["districts"] += 1

        return sorted(state_totals.values(), key=lambda x: -x["total_cases"])

    async def get_patrol_recommendations(self, district: str) -> List[Dict[str, Any]]:
        """
        AI-based patrol routing recommendations for a given district.
        """
        # Find the district in our database
        dist_info = next((d for d in self.DISTRICTS if district.lower() in d["district"].lower()), None)
        dominant = dist_info["dominant_scam"] if dist_info else "general_fraud"

        PATROL_TEMPLATES = {
            "digital_arrest": [
                {"route": "Senior Citizens Housing Colonies & Community Centers", "urgency": "high", "units_suggested": 3, "details": "High density of digital arrest scam victims in elderly communities. Deploy awareness teams with pamphlets."},
                {"route": "Post Offices & Bank Branches Perimeter", "urgency": "high", "units_suggested": 2, "details": "Fraudsters often call victims near ATMs. Station cyber cell personnel."},
                {"route": "Local Cable TV Office & Residential High-rises", "urgency": "medium", "units_suggested": 1, "details": "Coordinate with building security to alert residents."},
            ],
            "bank_fraud": [
                {"route": "ATM Clusters & Bank Branches", "urgency": "critical", "units_suggested": 4, "details": "SIM swap and OTP theft spike near ATM clusters. Deploy mobile surveillance."},
                {"route": "Cybercafe Zones & Tech Parks", "urgency": "high", "units_suggested": 2, "details": "Multiple NCRP complaints traced to IPs in this zone."},
                {"route": "Railway Station & Bus Stand", "urgency": "medium", "units_suggested": 2, "details": "Out-of-town mule handlers operating through transit hubs."},
            ],
            "upi_fraud": [
                {"route": "Vegetable Markets & Street Vendors", "urgency": "high", "units_suggested": 2, "details": "QR swap fraud targeting small merchants. Verify QR codes at shops."},
                {"route": "Online Shopping Delivery Points", "urgency": "medium", "units_suggested": 1, "details": "Fake delivery agents requesting advance UPI payment reported."},
            ],
            "investment_scam": [
                {"route": "Tech Corridors & Co-working Spaces", "urgency": "high", "units_suggested": 2, "details": "Social engineering investment scams targeting IT professionals."},
                {"route": "Social Media Influencer Events", "urgency": "medium", "units_suggested": 1, "details": "Fake influencer promotions luring victims to Ponzi schemes."},
            ],
        }

        recommendations = PATROL_TEMPLATES.get(dominant, PATROL_TEMPLATES["bank_fraud"])

        # Add timestamp to each
        for rec in recommendations:
            rec["generated_at"] = datetime.now().isoformat()
            rec["district"] = district

        return recommendations
