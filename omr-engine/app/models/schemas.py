from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

class QualityChecks(BaseModel):
    alignment_detected: bool = Field(..., description="Whether sheet boundaries or 4 corner markers were detected")
    alignment_confidence: float = Field(..., description="Confidence score 0.0 - 1.0 of the geometric alignment")
    image_acceptable: bool = Field(..., description="Whether image resolution and contrast meet processing thresholds")
    qr_detected: bool = Field(..., description="Whether QR code was located and decoded")

class OmrProcessResponse(BaseModel):
    success: bool
    template_id: str
    detected_answers: Dict[str, Optional[str]] = Field(..., description="Mapping of question number to option ('A', 'B', 'C', 'D' or null)")
    fill_ratios: Dict[str, Dict[str, float]] = Field(..., description="Fill density ratio per option per question")
    multiple_marked: List[int] = Field(default_factory=list, description="Question numbers with multiple marked bubbles")
    uncertain_questions: List[int] = Field(default_factory=list, description="Question numbers with ambiguous markings requiring review")
    quality_checks: QualityChecks
    qr_code: Optional[str] = None
    processed_image_base64: Optional[str] = None
    message: Optional[str] = None

