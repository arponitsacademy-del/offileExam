import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import cv2
import numpy as np
import pytest
from app.config import config
from app.engine.templates import get_template
from app.engine.detector import evaluate_bubble_grid
from app.engine.preprocessor import detect_sheet_corners, four_point_transform

def generate_synthetic_omr_sheet(template_code="omr_25_v1"):
    """
    Synthesizes a realistic OMR sheet image matching the template coordinates
    with known answers marked for automated testing.
    """
    w, h = config.WARPED_WIDTH, config.WARPED_HEIGHT
    # White background paper
    canvas = np.ones((h, w), dtype=np.uint8) * 255

    # 1. Draw 4 corner alignment markers (solid black squares)
    marker_size = 40
    # Top-left
    canvas[50:50+marker_size, 50:50+marker_size] = 0
    # Top-right
    canvas[50:50+marker_size, w-50-marker_size:w-50] = 0
    # Bottom-left
    canvas[h-50-marker_size:h-50, 50:50+marker_size] = 0
    # Bottom-right
    canvas[h-50-marker_size:h-50, w-50-marker_size:w-50] = 0

    # 2. Get template layout coordinates
    template = get_template(template_code, 25)
    coords = template.get_bubble_coordinates()
    r = template.bubble_radius

    # Draw all bubble circles
    for q_num, opts in coords.items():
        for opt, (cx, cy) in opts.items():
            cv2.circle(canvas, (cx, cy), r, 80, 2)

    # 3. Mark known answers:
    # Q1: Solid A
    cv2.circle(canvas, coords[1]['A'], r - 3, 20, -1)
    # Q2: Solid B
    cv2.circle(canvas, coords[2]['B'], r - 3, 20, -1)
    # Q3: Blank (no mark)
    # Q4: Multiple marked (C and D both filled)
    cv2.circle(canvas, coords[4]['C'], r - 3, 20, -1)
    cv2.circle(canvas, coords[4]['D'], r - 3, 20, -1)
    # Q5: Uncertain mark (partially filled)
    cv2.circle(canvas, coords[5]['A'], int(r * 0.6), 110, -1)

    return canvas, template

def test_bubble_detection():
    sheet, template = generate_synthetic_omr_sheet("omr_25_v1")
    detected, fill_ratios, multiple, uncertain, _ = evaluate_bubble_grid(sheet, template)

    assert detected["1"] == "A", f"Expected Q1 to be 'A', got {detected['1']}"
    assert detected["2"] == "B", f"Expected Q2 to be 'B', got {detected['2']}"
    assert fill_ratios["1"]["A"] >= config.FILLED_THRESHOLD

def test_blank_detection():
    sheet, template = generate_synthetic_omr_sheet("omr_25_v1")
    detected, fill_ratios, multiple, uncertain, _ = evaluate_bubble_grid(sheet, template)

    assert detected["3"] is None, f"Expected Q3 to be None (blank), got {detected['3']}"
    for opt in ['A', 'B', 'C', 'D']:
        assert fill_ratios["3"][opt] < config.BLANK_THRESHOLD

def test_multiple_marks_detection():
    sheet, template = generate_synthetic_omr_sheet("omr_25_v1")
    detected, fill_ratios, multiple, uncertain, _ = evaluate_bubble_grid(sheet, template)

    assert 4 in multiple, f"Expected Q4 to be flagged in multiple_marked, got {multiple}"
    assert detected["4"] is None, "Multiple marked questions must not be assigned a single answer"

def test_uncertain_marks_detection():
    sheet, template = generate_synthetic_omr_sheet("omr_25_v1")
    detected, fill_ratios, multiple, uncertain, _ = evaluate_bubble_grid(sheet, template)

    assert 5 in uncertain, f"Expected Q5 to be flagged as uncertain, got {uncertain}"

def test_alignment_correction():
    sheet, _ = generate_synthetic_omr_sheet("omr_25_v1")

    # Place the sheet on a larger dark background with slight rotation and offset
    bg_h, bg_w = config.WARPED_HEIGHT + 200, config.WARPED_WIDTH + 200
    composite = np.zeros((bg_h, bg_w), dtype=np.uint8) + 40
    composite[100:100+config.WARPED_HEIGHT, 100:100+config.WARPED_WIDTH] = sheet

    corners, confidence, is_fiducial = detect_sheet_corners(composite)
    assert corners is not None, "Failed to detect sheet corners on composite image"
    assert confidence >= 0.70, f"Expected confidence >= 0.70, got {confidence}"

    dst_pts = np.array([
        [70, 70],
        [config.WARPED_WIDTH - 70, 70],
        [config.WARPED_WIDTH - 70, config.WARPED_HEIGHT - 70],
        [70, config.WARPED_HEIGHT - 70]
    ], dtype="float32") if is_fiducial else None

    warped = four_point_transform(composite, corners, config.WARPED_WIDTH, config.WARPED_HEIGHT, dst_pts)
    assert warped.shape == (config.WARPED_HEIGHT, config.WARPED_WIDTH)

    # Verify bubble detection succeeds on warped sheet
    template = get_template("omr_25_v1", 25)
    detected, _, _, _, _ = evaluate_bubble_grid(warped, template)
    assert detected["1"] == "A", f"Expected Q1 'A' after alignment warp, got {detected['1']}"
    assert detected["2"] == "B", f"Expected Q2 'B' after alignment warp, got {detected['2']}"
