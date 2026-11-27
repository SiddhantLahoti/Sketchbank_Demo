# backend/app/services/vision.py
import cv2
import numpy as np


def _refine_box_to_pencil_ink(gray_img, box):
    """Snaps box edges tightly to actual pencil/color strokes without clipping faint shading."""
    x1, y1, x2, y2 = box
    crop = gray_img[y1:y2, x1:x2]
    if crop.size == 0:
        return box

    # Combine Otsu with a light pencil cutoff (236) so faint stone facets aren't clipped
    otsu_val, _ = cv2.threshold(crop, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    cutoff = max(otsu_val, 232)
    _, ink_mask = cv2.threshold(crop, cutoff, 255, cv2.THRESH_BINARY_INV)
    ink_mask = cv2.morphologyEx(ink_mask, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))

    pts = cv2.findNonZero(ink_mask)
    if pts is None:
        return box

    rx, ry, rw, rh = cv2.boundingRect(pts)
    return [x1 + rx, y1 + ry, x1 + rx + rw, y1 + ry + rh]


def _merge_column_views(boxes, img_w, img_h):
    """Pairs overlapping fragments and vertically aligned top/side views in the same column."""
    if not boxes:
        return []

    max_center_dx = img_w * 0.045   # Views of the same ring share the same vertical centerline
    max_v_gap = img_h * 0.19        # Bridges wider top-to-side gaps (e.g., pages 8–10 & 20)
    max_pair_h = img_h * 0.82

    merged = [list(b) for b in boxes]
    changed = True
    while changed:
        changed = False
        next_boxes = []
        while merged:
            curr = merged.pop(0)
            i = 0
            while i < len(merged):
                other = merged[i]

                # 1. Directly overlapping or touching parts of the same sketch
                overlaps = not (
                    curr[2] + 12 < other[0]
                    or curr[0] - 12 > other[2]
                    or curr[3] + 12 < other[1]
                    or curr[1] - 12 > other[3]
                )

                # 2. Vertically stacked top view + side view on the same centerline
                cx1 = (curr[0] + curr[2]) / 2.0
                cx2 = (other[0] + other[2]) / 2.0
                same_column = abs(cx1 - cx2) <= max_center_dx
                y_gap = max(0, max(other[1] - curr[3], curr[1] - other[3]))
                combined_h = max(curr[3], other[3]) - min(curr[1], other[1])

                if overlaps or (same_column and y_gap <= max_v_gap and combined_h <= max_pair_h):
                    curr = [
                        min(curr[0], other[0]),
                        min(curr[1], other[1]),
                        max(curr[2], other[2]),
                        max(curr[3], other[3]),
                    ]
                    merged.pop(i)
                    changed = True
                else:
                    i += 1
            next_boxes.append(curr)
        merged = next_boxes
    return merged


def detect_sketches(pil_image):
    img_np = cv2.cvtColor(np.array(pil_image.convert("RGB")), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
    img_h, img_w = gray.shape

    # 1. Boost faint pencil contrast locally while keeping white paper uniform
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(16, 16))
    enhanced = clahe.apply(gray)
    blurred = cv2.GaussianBlur(enhanced, (5, 5), 0)

    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 35, 10
    )

    # Mask out 1.5% page edges so scanner frame borders never trigger boxes
    margin_x = int(img_w * 0.015)
    margin_y = int(img_h * 0.015)
    thresh[:margin_y, :] = 0
    thresh[img_h - margin_y :, :] = 0
    thresh[:, :margin_x] = 0
    thresh[:, img_w - margin_x :] = 0

    # Remove 1px construction guidelines & dust, then bridge ring facets/shanks
    clean = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    closed = cv2.morphologyEx(clean, cv2.MORPH_CLOSE, np.ones((18, 18), np.uint8))

    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    raw_boxes = []
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        area = cv2.contourArea(cnt)

        # Ignore tiny specks and thin straight border lines
        if w < 38 or h < 38 or area < 750:
            continue
        if (w / float(h)) > 7.5 or (h / float(w)) > 7.5:
            continue

        # Ignore bottom-right signature + date block before merging
        is_signature = (y > img_h * 0.80) and (x > img_w * 0.65) and (h < img_h * 0.15)
        if not is_signature:
            raw_boxes.append([x, y, x + w, y + h])

    # 2. Pair top + side views vertically within each column
    merged_boxes = _merge_column_views(raw_boxes, img_w, img_h)

    # 3. Snap tightly to pencil strokes with 4% padding
    valid_boxes = []
    min_final_area = (img_w * img_h) * 0.0022
    for box in merged_boxes:
        tx1, ty1, tx2, ty2 = _refine_box_to_pencil_ink(gray, box)
        bw, bh = tx2 - tx1, ty2 - ty1
        if (bw * bh) < min_final_area:
            continue

        pad_x = int(bw * 0.04)
        pad_y = int(bh * 0.04)
        px1 = max(0, tx1 - pad_x)
        py1 = max(0, ty1 - pad_y)
        px2 = min(img_w, tx2 + pad_x)
        py2 = min(img_h, ty2 + pad_y)

        valid_boxes.append({"x1": int(px1), "y1": int(py1), "x2": int(px2), "y2": int(py2)})

    return sorted(valid_boxes, key=lambda b: (b["y1"] // 150, b["x1"]))