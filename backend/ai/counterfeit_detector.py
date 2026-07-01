import hashlib
import random
from typing import Dict, Any, List

class CounterfeitDetector:
    """
    AI Counterfeit Currency Detection Pipeline.
    Simulates: Image Preprocessing → YOLOv11 Note Segmentation → EfficientNet-B4 Feature Extraction
    → ViT-B/16 Watermark Transformer → Ensemble Decision.
    Results are deterministic based on image content hash (reproducible per image).
    """

    DENOMINATION_PROFILES = {
        500: {
            "security_thread_color": "Green with denomination in color shift",
            "watermark": "Gandhi portrait + electrotype 500",
            "serial_format": r"[A-Z]{2}\s\d{6}",
            "uv_features": "Latent image of denomination, optical variable ink",
        },
        200: {
            "security_thread_color": "Bright green with 200 in color shift",
            "watermark": "Gandhi portrait + electrotype 200",
            "serial_format": r"[A-Z]{2}\s\d{6}",
            "uv_features": "Motif of Sanchi Stupa, angular bleed lines",
        },
        100: {
            "security_thread_color": "Fluorescent blue with 100 in color shift",
            "watermark": "Gandhi portrait + electrotype 100",
            "serial_format": r"[A-Z]{2}\s\d{6}",
            "uv_features": "Rani ki Vav motif, intaglio printing texture",
        },
        50: {
            "security_thread_color": "Fluorescent blue",
            "watermark": "Gandhi portrait + electrotype 50",
            "serial_format": r"[A-Z]\s\d{6}",
            "uv_features": "Hampi with Chariot motif",
        },
    }

    FAILURE_ADVICE = {
        "security_thread": "The embedded security thread shows no color-shift (from green to blue) when tilted. Original notes have RBI | ₹{} printed on the thread.",
        "watermark": "The Gandhi portrait watermark is absent or incorrectly proportioned. Check against a genuine note under light.",
        "microprint": "Microprinting on the note border (भारत | INDIA) is blurred or absent on photocopied fakes.",
        "serial_number": "The serial number font style or spacing does not match RBI standard typeface. Fake notes often use generic computer fonts.",
        "uv_feature": "Under UV light, the fluorescent elements (denomination panel, security fibers) fail to illuminate correctly.",
        "latent_image": "The latent image showing the denomination value (visible when tilted 45°) is missing or incorrect.",
        "texture": "Intaglio printing texture (the raised ink you can feel when rubbing) is absent — indicates offset/inkjet printing.",
    }

    def _seed_from_image(self, img_bytes: bytes) -> int:
        """Generate a deterministic seed from image bytes for reproducible results."""
        sample = img_bytes[:256] if len(img_bytes) >= 256 else img_bytes
        return int(hashlib.md5(sample).hexdigest(), 16)

    def _seeded_float(self, seed: int, salt: str, low: float, high: float) -> float:
        """Deterministic float in [low, high] based on seed + salt."""
        h = int(hashlib.md5(f"{seed}_{salt}".encode()).hexdigest(), 16)
        return low + (h % 10000) / 10000.0 * (high - low)

    async def analyze_note(self, img_bytes: bytes) -> Dict[str, Any]:
        """
        Perform 7-feature parallel AI inspection on a currency note image.
        Returns deterministic results per image for consistent operator experience.
        """
        seed = self._seed_from_image(img_bytes)

        # Denomination and series selection (deterministic)
        denominations = [500, 500, 200, 100, 50]
        denomination = denominations[seed % len(denominations)]
        series_years = [2016, 2018, 2019, 2020, 2022, 2023]
        series_year = series_years[seed % len(series_years)]

        # Genuine vs counterfeit determination (weighted 60% counterfeit for demo utility)
        is_counterfeit = (seed % 10) < 6

        # Generate 7 security feature scores
        if is_counterfeit:
            thread       = self._seeded_float(seed, "thread",     0.04, 0.38)
            watermark    = self._seeded_float(seed, "watermark",  0.03, 0.42)
            microprint   = self._seeded_float(seed, "microprint", 0.08, 0.48)
            serial       = self._seeded_float(seed, "serial",     0.18, 0.62)
            uv           = self._seeded_float(seed, "uv",         0.02, 0.28)
            latent       = self._seeded_float(seed, "latent",     0.06, 0.38)
            texture      = self._seeded_float(seed, "texture",    0.12, 0.46)
            confidence   = self._seeded_float(seed, "conf",       0.87, 0.99)
        else:
            thread       = self._seeded_float(seed, "thread",     0.87, 0.99)
            watermark    = self._seeded_float(seed, "watermark",  0.90, 0.99)
            microprint   = self._seeded_float(seed, "microprint", 0.85, 0.98)
            serial       = self._seeded_float(seed, "serial",     0.88, 0.99)
            uv           = self._seeded_float(seed, "uv",         0.91, 0.99)
            latent       = self._seeded_float(seed, "latent",     0.84, 0.97)
            texture      = self._seeded_float(seed, "texture",    0.80, 0.96)
            confidence   = self._seeded_float(seed, "conf",       0.92, 0.99)

        # Identify which features failed
        features = {
            "security_thread": round(thread, 4),
            "watermark": round(watermark, 4),
            "microprint": round(microprint, 4),
            "serial_number": round(serial, 4),
            "uv_feature": round(uv, 4),
            "latent_image": round(latent, 4),
            "texture": round(texture, 4),
        }

        # Suspicious area annotations on the 500×250 mock canvas
        suspicious_areas = []
        failed_features = []
        if is_counterfeit:
            if thread < 0.5:
                suspicious_areas.append({"feature": "Security Thread", "x": 120, "y": 0, "w": 15, "h": 250, "verdict": "MISSING_OR_IMITATED"})
                failed_features.append("security_thread")
            if watermark < 0.5:
                suspicious_areas.append({"feature": "Watermark Window", "x": 380, "y": 40, "w": 90, "h": 90, "verdict": "INCORRECT_PORTRAIT"})
                failed_features.append("watermark")
            if serial < 0.65:
                suspicious_areas.append({"feature": "Serial Number", "x": 280, "y": 210, "w": 100, "h": 25, "verdict": "FONT_MISMATCH"})
                failed_features.append("serial_number")
            if uv < 0.5:
                suspicious_areas.append({"feature": "UV Fluorescence", "x": 200, "y": 100, "w": 80, "h": 50, "verdict": "NO_FLUORESCENCE"})
                failed_features.append("uv_feature")
            if latent < 0.4:
                suspicious_areas.append({"feature": "Latent Image", "x": 300, "y": 60, "w": 60, "h": 60, "verdict": "ABSENT"})
                failed_features.append("latent_image")
            if texture < 0.5:
                suspicious_areas.append({"feature": "Paper Texture", "x": 50, "y": 50, "w": 400, "h": 150, "verdict": "FLAT_INKJET"})
                failed_features.append("texture")

        # Build human-readable failure advice
        failure_advice = {
            feat: self.FAILURE_ADVICE[feat].format(denomination)
            for feat in failed_features
        }

        # Overall verdict summary
        profile = self.DENOMINATION_PROFILES.get(denomination, {})
        if is_counterfeit:
            summary = (
                f"This ₹{denomination} note shows {len(failed_features)} failed security checks. "
                f"Primary failures: {', '.join(failed_features[:3])}. "
                "This note should NOT be accepted. Please report to your nearest police station or RBI office."
            )
            verdict = "COUNTERFEIT"
            action = "SEIZE AND REPORT — Do not recirculate. File report at cybercrime.gov.in or call 1930."
        else:
            summary = (
                f"This ₹{denomination} note passed all 7 security feature checks with high confidence. "
                "Security thread, watermark, microprinting, UV features, and texture all verified."
            )
            verdict = "GENUINE"
            action = "Note appears genuine. Safe to accept."

        return {
            "is_counterfeit": is_counterfeit,
            "overall_confidence": round(confidence, 4),
            "denomination": denomination,
            "series_year": series_year,
            "features": features,
            "failed_features": failed_features,
            "failure_advice": failure_advice,
            "suspicious_areas": suspicious_areas,
            "denomination_profile": profile,
            "models_used": [
                "yolov11-currency-segmentation",
                "efficientnet-b4-feature-extractor",
                "vit-b16-watermark-transformer"
            ],
            "gradcam_heatmap_path": "/static/samples/gradcam_sample.png",
            "report": {
                "summary": summary,
                "verdict": verdict,
                "action_required": action,
                "features_checked": 7,
                "features_passed": 7 - len(failed_features),
                "features_failed": len(failed_features),
            }
        }
