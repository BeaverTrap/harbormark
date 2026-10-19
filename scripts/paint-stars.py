"""Sharp star tile. Repeats down the page so the points stay crisp."""
from PIL import Image
import numpy as np

S = 480
rng = np.random.default_rng(21)
img = np.zeros((S, S, 4), np.uint8)
count = 160
xs = rng.integers(0, S, count)
ys = rng.integers(0, S, count)
roll = rng.random(count)
for i in range(count):
    x = int(xs[i])
    y = int(ys[i])
    b = float(roll[i])
    if b > 0.94:
        color = (255, 244, 214, 255) if b > 0.97 else (214, 228, 255, 255)
        radius = 2
    elif b > 0.72:
        color = (255, 255, 255, 235)
        radius = 1
    else:
        color = (232, 238, 255, 210)
        radius = 0
    img[y, x] = color
    if radius >= 1:
        for dx, dy, fade in ((1, 0, 0.45), (-1, 0, 0.45), (0, 1, 0.45), (0, -1, 0.45)):
            px, py = x + dx, y + dy
            if 0 <= px < S and 0 <= py < S:
                img[py, px] = (*color[:3], int(color[3] * fade))
    if radius == 2:
        for dx, dy in ((2, 0), (-2, 0), (0, 2), (0, -2), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            px, py = x + dx, y + dy
            if 0 <= px < S and 0 <= py < S and img[py, px, 3] == 0:
                img[py, px] = (*color[:3], 70)

Image.fromarray(img, "RGBA").save(r"E:\MandM\public\stars.png")
print("stars", count)
