import cv2
import numpy as np
from typing import Tuple, Optional, List
from app.config import config

def order_points(pts: np.ndarray) -> np.ndarray:
    """
    Orders 4 coordinate points in order: [top-left, top-right, bottom-right, bottom-left]
    """
    rect = np.zeros((4, 2), dtype="float32")

    # Sum of coordinates: top-left has smallest sum, bottom-right has largest sum
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]

    # Difference of coordinates: top-right has smallest diff, bottom-left has largest diff
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]

    return rect

def four_point_transform(image: np.ndarray, pts: np.ndarray, width: int, height: int, dst_pts: Optional[np.ndarray] = None) -> np.ndarray:
    """
    Warps perspective of image to standard rectangle (width x height).
    """
    rect = order_points(pts)
    if dst_pts is None:
        dst_pts = np.array([
            [0, 0],
            [width - 1, 0],
            [width - 1, height - 1],
            [0, height - 1]
        ], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst_pts)
    warped = cv2.warpPerspective(image, M, (width, height))
    return warped

def detect_sheet_corners(gray_image: np.ndarray) -> Tuple[Optional[np.ndarray], float, bool]:
    """
    Detects the 4 corner points of the OMR sheet or 4 corner fiducial markers.
    Returns (points_4x2, confidence_score, is_fiducial).
    """
    h, w = gray_image.shape[:2]

    # Blur and edge detection
    blurred = cv2.GaussianBlur(gray_image, (5, 5), 0)
    edged = cv2.Canny(blurred, 50, 180)

    # 1. Attempt to find 4 corner alignment markers (solid dark squares in 4 quadrants)
    quadrants = [
        # (x_min, x_max, y_min, y_max)
        (0, int(w * 0.35), 0, int(h * 0.30)),                 # Top-Left
        (int(w * 0.65), w, 0, int(h * 0.30)),                 # Top-Right
        (int(w * 0.65), w, int(h * 0.70), h),                 # Bottom-Right
        (0, int(w * 0.35), int(h * 0.70), h),                 # Bottom-Left
    ]

    corner_centers = []
    # Threshold for finding dark solid squares
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    for (xmin, xmax, ymin, ymax) in quadrants:
        roi = thresh[ymin:ymax, xmin:xmax]
        contours, _ = cv2.findContours(roi, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        best_marker = None
        best_area = 0

        for c in contours:
            area = cv2.contourArea(c)
            if area < 150 or area > (w * h * 0.05):
                continue
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.04 * peri, True)
            if len(approx) == 4:
                # Check aspect ratio
                x, y, bw, bh = cv2.boundingRect(approx)
                aspect = float(bw) / float(bh)
                if 0.7 <= aspect <= 1.3:
                    if area > best_area:
                        best_area = area
                        M = cv2.moments(c)
                        if M["m00"] != 0:
                            cX = int(M["m10"] / M["m00"]) + xmin
                            cY = int(M["m01"] / M["m00"]) + ymin
                            best_marker = (cX, cY)

        if best_marker:
            corner_centers.append(best_marker)

    if len(corner_centers) == 4:
        pts = np.array(corner_centers, dtype="float32")
        return order_points(pts), 0.98, True

    # 2. Fallback: Find largest 4-point contour for the sheet perimeter
    contours, _ = cv2.findContours(edged, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]

    for c in contours:
        area = cv2.contourArea(c)
        if area < (w * h * 0.25):
            continue
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            pts = approx.reshape(4, 2).astype("float32")
            return order_points(pts), 0.90, False

    # 3. Fallback: If image is already cropped tightly to page boundary
    default_pts = np.array([
        [0, 0],
        [w - 1, 0],
        [w - 1, h - 1],
        [0, h - 1]
    ], dtype="float32")
    return default_pts, 0.75, False

def decode_qr(image: np.ndarray) -> Optional[str]:
    """
    Decodes QR code from the warped image using OpenCV's built-in QR detector.
    """
    detector = cv2.QRCodeDetector()
    try:
        # Search the top header region first for performance and accuracy
        h, w = image.shape[:2]
        header_roi = image[0:int(h * 0.35), int(w * 0.50):w]
        data, _, _ = detector.detectAndDecode(header_roi)
        if data and len(data.strip()) > 0:
            return data.strip()

        # If not found in ROI, search entire image
        data, _, _ = detector.detectAndDecode(image)
        if data and len(data.strip()) > 0:
            return data.strip()
    except Exception:
        pass
    return None
