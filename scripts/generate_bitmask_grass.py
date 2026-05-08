from PIL import Image
import os

# Config
base_dir = os.path.dirname(__file__)
FILENAME = os.path.join(base_dir, "..", "public", "assets", "terrain.png"
TILE_SIZE = 16
OFFSET = 0  # How many pixels in from the edge to check
COLS, ROWS = 12, 4

def get_grass_mask(tile_img):
    w, h = tile_img.size
    
    def is_grass(x, y):
        r, g, b, a = tile_img.getpixel((x, y))
        # If it's transparent, it's not grass
        if a == 0: return False
        # If green is dominant, it's grass. If red/brown is dominant, it's dirt.
        return g > r 

    mask = 0
    # 8-Bit Values
    # NW:1, N:2, NE:4, W:8, E:16, SW:32, S:64, SE:128
    # TL:1, T:2, TR:4, L:8, R:16, BL:32, B:64, BR:128
    
    # Cardinals
    if is_grass(w//2, OFFSET):      mask += 2   # N
    if is_grass(OFFSET, h//2):      mask += 8   # W
    if is_grass(w-1-OFFSET, h//2):  mask += 16  # E
    if is_grass(w//2, h-1-OFFSET):  mask += 64  # S

    # Corners
    if is_grass(OFFSET, OFFSET):           mask += 1   # NW
    if is_grass(w-1-OFFSET, OFFSET):       mask += 4   # NE
    if is_grass(OFFSET, h-1-OFFSET):       mask += 32  # SW
    if is_grass(w-1-OFFSET, h-1-OFFSET):   mask += 128 # SE
    
    return mask

def generate_constants():
    img = Image.open(FILENAME).convert("RGBA")
    results = {}

    print("GRASS_BITMASK_TABLE = {")
    for r in range(ROWS):
        for c in range(COLS):
            tile = img.crop((c*16, r*16, (c+1)*16, (r+1)*16))
            mask = get_grass_mask(tile)
            index = (r * COLS) + c
            
            # If mask is 0, it's likely an empty/dirt tile, skip it
            if mask > 0:
                print(f"{mask}: {index}, // Row {r}, Col {c}")
    print("}")

generate_constants()