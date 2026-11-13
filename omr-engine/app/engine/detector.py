import cv2
import numpy as np
import base64
from typing import Dict, List, Tuple, Optional, Any
from app.config import config
from app.engine.templates import OMRTemplateLayout

def evaluate_bubble_grid(
    warped_gray: np.ndarray,
    template: OMRTemplateLayout
) -> Tuple[Dict[str, Optional[str]], Dict[str, Dict[str, float]], List[int], List[int], np.ndarray]:
    """
    Evaluates bubble fill ratios, decides marked options, detects blank/multiple/uncertain,
    and paints an annotated visual image.

    Returns:
    (detected_answers, fill_ratios, multiple_marked_list, uncertain_list, annotated_bgr)
    """
    # 1. Image preprocessing: adaptive thresholding to detect black/dark marks
    blurred = cv2.GaussianBlur(warped_gray, (5, 5), 0)
    # Otsu + Inverse binary thresholding: filled pencil/pen bubbles become white (255)
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Convert grayscale to BGR for color annotations
    annotated_bgr = cv2.cvtColor(warped_gray, cv2.COLOR_GRAY2BGR)

    coordinates = template.get_bubble_coordinates()
    r = template.bubble_radius

    detected_answers: Dict[str, Optional[str]] = {}
    fill_ratios: Dict[str, Dict[str, float]] = {}
    multiple_marked: List[int] = []
    uncertain_questions: List[int] = []

    # Mask for circular bubble ROI
    mask_template = np.zeros((2 * r + 1, 2 * r + 1), dtype=np.uint8)
    cv2.circle(mask_template, (r, r), r - 2, 255, -1)
    total_bubble_pixels = cv2.countNonZero(mask_template)

    for q_num, options_coords in coordinates.items():
        q_fill_ratios: Dict[str, float] = {}

        for opt, (cx, cy) in options_coords.items():
            # Extract ROI around bubble
            x1, y1 = max(0, cx - r), max(0, cy - r)
            x2, y2 = min(warped_gray.shape[1], cx + r + 1), min(warped_gray.shape[0], cy + r + 1)

            roi_thresh = thresh[y1:y2, x1:x2]
            roi_mask = mask_template[0:(y2 - y1), 0:(x2 - x1)]

            if roi_thresh.shape == roi_mask.shape:
                filled_pixels = cv2.countNonZero(cv2.bitwise_and(roi_thresh, roi_mask))
                ratio = round(float(filled_pixels) / float(total_bubble_pixels), 3)
            else:
                ratio = 0.0

            q_fill_ratios[opt] = ratio

        fill_ratios[str(q_num)] = q_fill_ratios

        # Sort options by fill ratio descending
        sorted_opts = sorted(q_fill_ratios.items(), key=lambda x: x[1], reverse=True)
        top_opt, top_val = sorted_opts[0]
        second_opt, second_val = sorted_opts[1]

        # Analyze decisions
        if top_val < config.BLANK_THRESHOLD:
            # Question is completely blank
            detected_answers[str(q_num)] = None
            # Draw neutral blank circles
            for opt, (cx, cy) in options_coords.items():
                cv2.circle(annotated_bgr, (cx, cy), r, (180, 180, 180), 1)

        elif top_val >= config.MULTIPLE_THRESHOLD and second_val >= config.MULTIPLE_THRESHOLD:
            # Multiple marked
            multiple_marked.append(q_num)
            detected_answers[str(q_num)] = None
            # Draw red indicators for conflicting bubbles
            for opt, (cx, cy) in options_coords.items():
                val = q_fill_ratios[opt]
                if val >= config.MULTIPLE_THRESHOLD:
                    cv2.circle(annotated_bgr, (cx, cy), r, (0, 0, 220), 2)
                    cv2.circle(annotated_bgr, (cx, cy), r - 4, (0, 0, 220), -1)
                else:
                    cv2.circle(annotated_bgr, (cx, cy), r, (180, 180, 180), 1)

        elif (config.UNCERTAIN_LOWER <= top_val < config.FILLED_THRESHOLD) or \
             (top_val >= config.FILLED_THRESHOLD and (top_val - second_val) < config.UNCERTAIN_SPREAD):
            # Uncertain / ambiguous mark
            uncertain_questions.append(q_num)
            detected_answers[str(q_num)] = top_opt  # Provide tentative top option for review
            # Draw yellow/amber indicator
            for opt, (cx, cy) in options_coords.items():
                if opt == top_opt:
                    cv2.circle(annotated_bgr, (cx, cy), r, (0, 165, 255), 2)
                    cv2.putText(annotated_bgr, "?", (cx - 5, cy + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 165, 255), 1)
                else:
                    cv2.circle(annotated_bgr, (cx, cy), r, (180, 180, 180), 1)

        else:
            # Single clearly marked option
            detected_answers[str(q_num)] = top_opt
            # Draw green indicator for marked bubble
            for opt, (cx, cy) in options_coords.items():
                if opt == top_opt:
                    cv2.circle(annotated_bgr, (cx, cy), r, (34, 180, 34), 2)
                    cv2.circle(annotated_bgr, (cx, cy), r - 5, (34, 180, 34), -1)
                else:
                    cv2.circle(annotated_bgr, (cx, cy), r, (180, 180, 180), 1)

        # Draw Question Number label to the left of column
        first_opt_pos = options_coords['A']
        cv2.putText(
            annotated_bgr,
            f"{q_num}",
            (first_opt_pos[0] - 65, first_opt_pos[1] + 5),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            (50, 50, 50),
            1
        )

    return detected_answers, fill_ratios, multiple_marked, uncertain_questions, annotated_bgr

def encode_image_base64(image_bgr: np.ndarray, quality: int = 80) -> str:
    """
    Compresses image as JPEG and encodes to Base64 string.
    """
    encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
    _, buffer = cv2.imencode('.jpg', image_bgr, encode_params)
    return base64.b64encode(buffer).decode('utf-8')

