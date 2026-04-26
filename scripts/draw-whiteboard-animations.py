import os
import cv2
import time
import numpy as np
import math
import sys
import datetime

def euc_dist(arr1, point):
    square_sub = (arr1 - point) ** 2
    return np.sqrt(np.sum(square_sub, axis=1))

def preprocess_image(img_path, variables):
    img = cv2.imread(img_path)
    if img is None:
        raise ValueError(f"Could not read image from {img_path}")
    img_ht, img_wd = img.shape[0], img.shape[1]
    img = cv2.resize(img, (variables.resize_wd, variables.resize_ht))
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # color histogram equilization
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(3, 3))
    cl1 = clahe.apply(img_gray)

    # gaussian adaptive thresholding
    img_thresh = cv2.adaptiveThreshold(
        img_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 10
    )

    variables.img_ht = img_ht
    variables.img_wd = img_wd
    variables.img_gray = img_gray
    variables.img_thresh = img_thresh
    variables.img = img
    return variables

def preprocess_hand_image(hand_path, hand_mask_path, variables):
    hand = cv2.imread(hand_path)
    hand_mask = cv2.imread(hand_mask_path, cv2.IMREAD_GRAYSCALE)
    if hand is None or hand_mask is None:
        raise ValueError("Could not read hand images. Make sure public/assets/drawing-hand.png and hand-mask.png exist.")

    top_left, bottom_right = get_extreme_coordinates(hand_mask)
    hand = hand[top_left[1] : bottom_right[1], top_left[0] : bottom_right[0]]
    hand_mask = hand_mask[top_left[1] : bottom_right[1], top_left[0] : bottom_right[0]]
    hand_mask_inv = 255 - hand_mask

    hand_mask = hand_mask / 255
    hand_mask_inv = hand_mask_inv / 255

    hand_bg_ind = np.where(hand_mask == 0)
    hand[hand_bg_ind] = [0, 0, 0]

    hand_ht, hand_wd = hand.shape[0], hand.shape[1]

    variables.hand_ht = hand_ht
    variables.hand_wd = hand_wd
    variables.hand = hand
    variables.hand_mask = hand_mask
    variables.hand_mask_inv = hand_mask_inv
    return variables

def get_extreme_coordinates(mask):
    indices = np.where(mask == 255)
    x = indices[1]
    y = indices[0]
    topleft = (np.min(x), np.min(y))
    bottomright = (np.max(x), np.max(y))
    return topleft, bottomright

def draw_hand_on_img(drawing, hand, drawing_coord_x, drawing_coord_y, hand_mask_inv, hand_ht, hand_wd, img_ht, img_wd):
    remaining_ht = img_ht - drawing_coord_y
    remaining_wd = img_wd - drawing_coord_x
    crop_hand_ht = hand_ht if remaining_ht > hand_ht else remaining_ht
    crop_hand_wd = hand_wd if remaining_wd > hand_wd else remaining_wd

    hand_cropped = hand[:crop_hand_ht, :crop_hand_wd]
    hand_mask_inv_cropped = hand_mask_inv[:crop_hand_ht, :crop_hand_wd]

    for c in range(3):
        drawing[
            drawing_coord_y : drawing_coord_y + crop_hand_ht,
            drawing_coord_x : drawing_coord_x + crop_hand_wd,
        ][:, :, c] = (
            drawing[
                drawing_coord_y : drawing_coord_y + crop_hand_ht,
                drawing_coord_x : drawing_coord_x + crop_hand_wd,
            ][:, :, c]
            * hand_mask_inv_cropped
        )

    drawing[
        drawing_coord_y : drawing_coord_y + crop_hand_ht,
        drawing_coord_x : drawing_coord_x + crop_hand_wd,
    ] = (
        drawing[
            drawing_coord_y : drawing_coord_y + crop_hand_ht,
            drawing_coord_x : drawing_coord_x + crop_hand_wd,
        ]
        + hand_cropped
    )
    return drawing

def draw_masked_object(variables, skip_rate=5, black_pixel_threshold=10):
    img_thresh_copy = variables.img_thresh.copy()
    
    n_cuts_vertical = int(math.ceil(variables.resize_ht / variables.split_len))
    n_cuts_horizontal = int(math.ceil(variables.resize_wd / variables.split_len))

    grid_of_cuts = np.array(np.split(img_thresh_copy, n_cuts_horizontal, axis=-1))
    grid_of_cuts = np.array(np.split(grid_of_cuts, n_cuts_vertical, axis=-2))

    cut_having_black = (grid_of_cuts < black_pixel_threshold) * 1
    cut_having_black = np.sum(np.sum(cut_having_black, axis=-1), axis=-1)
    cut_black_indices = np.array(np.where(cut_having_black > 0)).T

    if len(cut_black_indices) == 0:
        variables.drawn_frame[:, :, :] = variables.img
        return

    selected_ind = 0
    counter = 0

    while len(cut_black_indices) > 1:
        selected_ind_val = cut_black_indices[selected_ind].copy()
        range_v_start = selected_ind_val[0] * variables.split_len
        range_v_end = range_v_start + variables.split_len
        range_h_start = selected_ind_val[1] * variables.split_len
        range_h_end = range_h_start + variables.split_len

        temp_drawing = np.zeros((variables.split_len, variables.split_len, 3))
        for c in range(3):
            temp_drawing[:, :, c] = grid_of_cuts[selected_ind_val[0]][selected_ind_val[1]]

        variables.drawn_frame[range_v_start:range_v_end, range_h_start:range_h_end] = temp_drawing

        hand_coord_x = range_h_start + int(variables.split_len / 2)
        hand_coord_y = range_v_start + int(variables.split_len / 2)
        drawn_frame_with_hand = draw_hand_on_img(
            variables.drawn_frame.copy(),
            variables.hand.copy(),
            hand_coord_x,
            hand_coord_y,
            variables.hand_mask_inv.copy(),
            variables.hand_ht,
            variables.hand_wd,
            variables.resize_ht,
            variables.resize_wd,
        )

        cut_black_indices[selected_ind] = cut_black_indices[-1]
        cut_black_indices = cut_black_indices[:-1]

        euc_arr = euc_dist(cut_black_indices, selected_ind_val)
        selected_ind = np.argmin(euc_arr)

        counter += 1
        if counter % skip_rate == 0:
            variables.video_object.write(drawn_frame_with_hand)

    variables.drawn_frame[:, :, :] = variables.img
    variables.video_object.write(variables.drawn_frame)

def draw_whiteboard_animations(img_path, save_video_path, hand_path, hand_mask_path, variables):
    variables = preprocess_image(img_path=img_path, variables=variables)
    variables = preprocess_hand_image(hand_path=hand_path, hand_mask_path=hand_mask_path, variables=variables)

    variables.video_object = cv2.VideoWriter(
        save_video_path,
        cv2.VideoWriter_fourcc(*"mp4v"),
        variables.frame_rate,
        (variables.resize_wd, variables.resize_ht),
    )

    variables.drawn_frame = np.zeros(variables.img.shape, np.uint8) + np.array([255, 255, 255], np.uint8)
    
    draw_masked_object(variables=variables, skip_rate=variables.object_skip_rate)

    for i in range(variables.frame_rate * variables.end_gray_img_duration_in_sec):
        variables.video_object.write(variables.img)

    variables.video_object.release()

class AllVariables:
    def __init__(self, frame_rate=25, resize_wd=1020, resize_ht=1020, split_len=10, object_skip_rate=8, end_gray_img_duration_in_sec=1):
        self.frame_rate = frame_rate
        self.resize_wd = resize_wd
        self.resize_ht = resize_ht
        self.split_len = split_len
        self.object_skip_rate = object_skip_rate
        self.end_gray_img_duration_in_sec = end_gray_img_duration_in_sec

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python draw-whiteboard-animations.py <input_img_path> <output_video_path>")
        sys.exit(1)

    img_path = sys.argv[1]
    save_video_path = sys.argv[2]
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    hand_path = os.path.join(base_dir, "public", "assets", "drawing-hand.png")
    hand_mask_path = os.path.join(base_dir, "public", "assets", "hand-mask.png")

    variables = AllVariables(
        frame_rate=30,
        resize_wd=512,
        resize_ht=512,
        split_len=16,  # 512 is perfectly divisible by 16
        object_skip_rate=25, 
        end_gray_img_duration_in_sec=1,
    )

    try:
        draw_whiteboard_animations(img_path, save_video_path, hand_path, hand_mask_path, variables)
        print(f"Successfully generated video at {save_video_path}")
    except Exception as e:
        print(f"Error generating video: {str(e)}")
        sys.exit(1)
