from fastapi import FastAPI, File, UploadFile, Form, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import cv2
import numpy as np

from app.config import config
from app.models.schemas import OmrProcessResponse, QualityChecks
from app.engine.templates import get_template, TEMPLATES
from app.engine.preprocessor import detect_sheet_corners, four_point_transform, decode_qr
from app.engine.detector import evaluate_bubble_grid, encode_image_base64

app = FastAPI(
    title="SmartOMR Recognition Microservice",
    description="High-precision Computer Vision OMR scanning engine powered by OpenCV & NumPy",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_api_key(x_omr_api_key: Optional[str] = Header(None)):
    if config.API_KEY and x_omr_api_key != config.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-OMR-API-KEY authentication header."
        )

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SmartOMR Recognition Engine",
        "opencv_version": cv2.__version__,
        "supported_templates": list(TEMPLATES.keys())
    }

@app.get("/api/v1/omr/templates")
def list_templates():
    return {
        "templates": [
            {
                "code": k,
                "total_questions": v.total_questions,
                "columns": v.columns,
                "rows_per_col": v.rows_per_col,
                "bubble_radius": v.bubble_radius
            }
            for k, v in TEMPLATES.items()
        ]
    }

@app.post("/api/v1/omr/process", response_model=OmrProcessResponse)
async def process_omr_sheet(
    file: UploadFile = File(...),
    template_code: str = Form("omr_25_v1"),
    total_questions: int = Form(25),
    options_per_question: int = Form(4),
    x_omr_api_key: Optional[str] = Header(None)
):
    # Authenticate service-to-service call
    verify_api_key(x_omr_api_key)

    # 1. Read uploaded file bytes
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty image payload received.")

    # 2. Decode image
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="Failed to decode image file. Invalid image format.")

    orig_h, orig_w = image.shape[:2]
    if orig_h < 400 or orig_w < 400:
        raise HTTPException(status_code=400, detail=f"Image resolution too low ({orig_w}x{orig_h}). Minimum 400x400 required.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # 3. Detect sheet corners or alignment markers
    corners, alignment_conf, is_fiducial = detect_sheet_corners(gray)
    alignment_detected = corners is not None and alignment_conf >= 0.70

    # 4. Apply perspective transform to standard template canvas
    if alignment_detected:
        if is_fiducial:
            dst_pts = np.array([
                [70, 70],
                [config.WARPED_WIDTH - 70, 70],
                [config.WARPED_WIDTH - 70, config.WARPED_HEIGHT - 70],
                [70, config.WARPED_HEIGHT - 70]
            ], dtype="float32")
        else:
            dst_pts = np.array([
                [0, 0],
                [config.WARPED_WIDTH - 1, 0],
                [config.WARPED_WIDTH - 1, config.WARPED_HEIGHT - 1],
                [0, config.WARPED_HEIGHT - 1]
            ], dtype="float32")
        warped_gray = four_point_transform(gray, corners, config.WARPED_WIDTH, config.WARPED_HEIGHT, dst_pts)
        warped_bgr = four_point_transform(image, corners, config.WARPED_WIDTH, config.WARPED_HEIGHT, dst_pts)
    else:
        # Resize to standard template dimensions
        warped_gray = cv2.resize(gray, (config.WARPED_WIDTH, config.WARPED_HEIGHT))
        warped_bgr = cv2.resize(image, (config.WARPED_WIDTH, config.WARPED_HEIGHT))

    # 5. Decode QR code if present on sheet
    qr_data = decode_qr(warped_bgr)

    # 6. Locate template definition
    template = get_template(template_code, total_questions)

    # 7. Evaluate bubbles
    detected_answers, fill_ratios, multiple_marked, uncertain_questions, annotated_bgr = evaluate_bubble_grid(
        warped_gray,
        template
    )

    # 8. Encode annotated preview image
    annotated_b64 = encode_image_base64(annotated_bgr)

    quality = QualityChecks(
        alignment_detected=alignment_detected,
        alignment_confidence=float(round(alignment_conf, 2)),
        image_acceptable=True,
        qr_detected=qr_data is not None
    )

    return OmrProcessResponse(
        success=True,
        template_id=template.template_code,
        detected_answers=detected_answers,
        fill_ratios=fill_ratios,
        multiple_marked=multiple_marked,
        uncertain_questions=uncertain_questions,
        quality_checks=quality,
        qr_code=qr_data,
        processed_image_base64=annotated_b64,
        message="OMR image processed successfully."
    )
