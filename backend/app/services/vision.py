# backend/app/services/vision.py
import cv2
import numpy as np
from PIL import Image

def refine_box_to_ink_otsu(gray_img, box):
    x1, y1, x2, y2 = box
    crop_gray = gray_img[y1:y2, x1:x2]
    if crop_gray.size == 0:
        return box

    _, ink_mask = cv2.threshold(crop_gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    pts = cv2.findNonZero(ink_mask)
    if pts is None:
        return box

    rx, ry, rw, rh = cv2.boundingRect(pts)
    return [x1 + rx, y1 + ry, x1 + rx + rw, y1 + ry + rh]

def is_valid_jewellery_sketch(crop_cv2_bgr, box, page_height):
    gray = cv2.cvtColor(crop_cv2_bgr, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    if w < 35 or h < 35:
        return False

    aspect_ratio = float(w) / max(h, 1)
    if aspect_ratio > 7.0 or aspect_ratio < 0.14:
        return False

    _, thresh = cv2.threshold(gray, 220, 255, cv2.THRESH_BINARY_INV)
    ink_pixels = cv2.countNonZero(thresh)
    if ink_pixels < 120:
        return False

    y2 = box[3]
    is_bottom_zone = y2 > (page_height * 0.85)
    if is_bottom_zone and aspect_ratio > 2.0 and h < (page_height * 0.12):
        return False

    return True

def detect_sketches(pil_image, min_area_pct=0.0006, dilation_kernel_size=(25, 75)):
    img_np = cv2.cvtColor(np.array(pil_image.convert("RGB")), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)

    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, dilation_kernel_size)
    dilated = cv2.dilate(thresh, kernel, iterations=2)

    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    page_area = pil_image.width * pil_image.height
    min_area = page_area * min_area_pct

    valid_boxes = []
    img_h, img_w = img_np.shape[:2]

    for cnt in contours:
        if cv2.contourArea(cnt) > min_area:
            x, y, w, h = cv2.boundingRect(cnt)
            tx1, ty1, tx2, ty2 = refine_box_to_ink_otsu(gray, [x, y, x + w, y + h])

            # 10% safety margin padding
            pad_x = int((tx2 - tx1) * 0.10)
            pad_y = int((ty2 - ty1) * 0.10)

            px1 = max(0, tx1 - pad_x)
            py1 = max(0, ty1 - pad_y)
            px2 = min(img_w, tx2 + pad_x)
            py2 = min(img_h, ty2 + pad_y)

            crop_bgr = img_np[py1:py2, px1:px2]
            if crop_bgr.size > 0 and is_valid_jewellery_sketch(crop_bgr, [px1, py1, px2, py2], pil_image.height):
                valid_boxes.append({"x1": int(px1), "y1": int(py1), "x2": int(px2), "y2": int(py2)})

    return sorted(valid_boxes, key=lambda b: b["y1"])