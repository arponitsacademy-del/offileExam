import os

class Config:
    API_KEY = os.getenv("OMR_ENGINE_API_KEY", "smartomr_engine_internal_token_2026")
    WARPED_WIDTH = 1200
    WARPED_HEIGHT = 1697  # Standard A4 aspect ratio 1:1.4142

    # Calibration thresholds
    BLANK_THRESHOLD = 0.22       # Below this fill ratio, bubble is guaranteed blank
    FILLED_THRESHOLD = 0.42      # At or above this fill ratio, bubble is filled
    UNCERTAIN_LOWER = 0.28       # Between 0.28 and 0.42 is ambiguous / partially marked
    UNCERTAIN_SPREAD = 0.12      # If top 2 options differ by less than this, flag ambiguous
    MULTIPLE_THRESHOLD = 0.38    # If two options exceed this, flag multiple marked

config = Config()

