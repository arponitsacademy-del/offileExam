from typing import Dict, List, Tuple
from app.config import config

class OMRTemplateLayout:
    def __init__(self, template_code: str, total_questions: int, columns: int, rows_per_col: int):
        self.template_code = template_code
        self.total_questions = total_questions
        self.columns = columns
        self.rows_per_col = rows_per_col
        self.options = ['A', 'B', 'C', 'D']
        self.bubble_radius = 18

    def get_bubble_coordinates(self) -> Dict[int, Dict[str, Tuple[int, int]]]:
        """
        Returns mapping: { question_num: { 'A': (cx, cy), 'B': (cx, cy), 'C': (cx, cy), 'D': (cx, cy) } }
        calculated on the standard normalized warped canvas (config.WARPED_WIDTH x config.WARPED_HEIGHT).
        """
        grid: Dict[int, Dict[str, Tuple[int, int]]] = {}

        canvas_w = config.WARPED_WIDTH   # 1200
        canvas_h = config.WARPED_HEIGHT  # 1697

        grid_top_y = 520
        grid_bottom_y = 1560
        total_grid_h = grid_bottom_y - grid_top_y

        row_step = total_grid_h / max(self.rows_per_col, 1)

        # Distribute columns across horizontal space
        col_margin_left = 110
        col_margin_right = 110
        available_w = canvas_w - col_margin_left - col_margin_right
        col_w = available_w / self.columns

        bubble_spacing = 75  # Horizontal distance between bubbles A, B, C, D
        first_bubble_offset = 120 # Distance from column start to bubble A (leaving space for Q. number)

        for q in range(1, self.total_questions + 1):
            # Determine column index (0-based) and row index (0-based)
            col_idx = (q - 1) // self.rows_per_col
            row_idx = (q - 1) % self.rows_per_col

            col_start_x = col_margin_left + (col_idx * col_w)
            cy = int(grid_top_y + (row_idx * row_step) + (row_step / 2))

            q_bubbles = {}
            for opt_idx, opt in enumerate(self.options):
                cx = int(col_start_x + first_bubble_offset + (opt_idx * bubble_spacing))
                q_bubbles[opt] = (cx, cy)

            grid[q] = q_bubbles

        return grid

TEMPLATES: Dict[str, OMRTemplateLayout] = {
    'omr_20_v1': OMRTemplateLayout('omr_20_v1', total_questions=20, columns=2, rows_per_col=10),
    'omr_25_v1': OMRTemplateLayout('omr_25_v1', total_questions=25, columns=2, rows_per_col=13),
    'omr_50_v1': OMRTemplateLayout('omr_50_v1', total_questions=50, columns=2, rows_per_col=25),
    'omr_100_v1': OMRTemplateLayout('omr_100_v1', total_questions=100, columns=4, rows_per_col=25),
}

def get_template(template_code: str, total_questions: int = 50) -> OMRTemplateLayout:
    if template_code in TEMPLATES:
        return TEMPLATES[template_code]
    # Fallback by question count
    if total_questions <= 20:
        return TEMPLATES['omr_20_v1']
    elif total_questions <= 25:
        return TEMPLATES['omr_25_v1']
    elif total_questions <= 50:
        return TEMPLATES['omr_50_v1']
    else:
        return TEMPLATES['omr_100_v1']

