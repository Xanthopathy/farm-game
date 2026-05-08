from PIL import Image
import os

# Config
base_dir = os.path.dirname(__file__)
FILENAME = os.path.join(base_dir, "..", "public", "assets", "terrain.png")
TILE_SIZE = 16
OFFSET = 0
COLS, ROWS = 12, 4
# Tilled dirt starts 4 rows (64 pixels) below the grass batch
START_Y_PIXEL = 64 

def get_tilled_mask(tile_img):
    w, h = tile_img.size
    
    def is_tilled(x, y):
        r, g, b, a = tile_img.getpixel((x, y))
        if a == 0: return False
        
        # COLOR LOGIC: Tilled dirt is darker brown. 
        # Regular dirt/sand is bright (R > 150). 
        # Tilled dirt usually has Red values between 60-120.
        return r < 160

    mask = 0
    mid = TILE_SIZE // 2
    end = TILE_SIZE - 1 - OFFSET

    # Cardinals (N:2, W:8, E:16, S:64)
    if is_tilled(mid, OFFSET):     mask += 2
    if is_tilled(OFFSET, mid):     mask += 8
    if is_tilled(end, mid):        mask += 16
    if is_tilled(mid, end):        mask += 64

    # Corners (NW:1, NE:4, SW:32, SE:128)
    if is_tilled(OFFSET, OFFSET):  mask += 1
    if is_tilled(end, OFFSET):     mask += 4
    if is_tilled(OFFSET, end):     mask += 32
    if is_tilled(end, end):        mask += 128
    
    return mask

def generate_tilled_constants():
    img = Image.open(FILENAME).convert("RGBA")
    
    print("TILLED_BITMASK_TABLE = {")
    for r in range(ROWS):
        for c in range(COLS):
            # Calculate crop with the vertical offset for the second batch
            left = c * TILE_SIZE
            top = START_Y_PIXEL + (r * TILE_SIZE)
            right = left + TILE_SIZE
            bottom = top + TILE_SIZE
            
            tile = img.crop((left, top, right, bottom))
            mask = get_tilled_mask(tile)
            
            # The frame index in the full spritesheet
            # (r + 4) because it's the second 12x4 block
            index = ((r + 4) * COLS) + c
            
            if mask > 0:
                print(f"{mask}: {index}, // Row {r+4}, Col {c}")
    print("}")

generate_tilled_constants()