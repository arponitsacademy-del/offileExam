import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import argparse
import json
import cv2
import numpy as np

from app.config import config
from app.engine.templates import get_template
from app.engine.preprocessor import detect_sheet_corners, four_point_transform, decode_qr
from app.engine.detector import evaluate_bubble_grid, encode_image_base64

def process_file(image_path: str, template_code: str = "omr_25_v1", total_questions: int = 25):
    image = cv2.imread(image_path)
    if image is None:
        return {"success": False, "message": "Failed to read image file."}

    orig_h, orig_w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    corners, alignment_conf, is_fiducial = detect_sheet_corners(gray)
    alignment_detected = corners is not None and alignment_conf >= 0.70

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
        warped_gray = cv2.resize(gray, (config.WARPED_WIDTH, config.WARPED_HEIGHT))
        warped_bgr = cv2.resize(image, (config.WARPED_WIDTH, config.WARPED_HEIGHT))

    qr_data = decode_qr(warped_bgr)
    template = get_template(template_code, total_questions)

    detected_answers, fill_ratios, multiple_marked, uncertain_questions, annotated_bgr = evaluate_bubble_grid(
        warped_gray,
        template
    )

    annotated_b64 = encode_image_base64(annotated_bgr)

    return {
        "success": True,
        "template_id": template.template_code,
        "detected_answers": detected_answers,
        "fill_ratios": fill_ratios,
        "multiple_marked": multiple_marked,
        "uncertain_questions": uncertain_questions,
        "quality_checks": {
            "alignment_detected": alignment_detected,
            "alignment_confidence": float(round(alignment_conf, 2)),
            "image_acceptable": True,
            "qr_detected": qr_data is not None
        },
        "qr_code": qr_data,
        "processed_image_base64": annotated_b64,
        "message": "OMR processed successfully."
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True)
    parser.add_argument("--template", default="omr_25_v1")
    parser.add_argument("--questions", type=int, default=25)
    args = parser.parse_args()

    result = process_file(args.image, args.template, args.questions)
    print(json.dumps(result))
