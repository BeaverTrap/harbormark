"""Tall night sky. Vertical milky way, no ground, no moons. Stars are a separate tile."""
from PIL import Image, ImageFilter
import numpy as np

W, H = 1400, 6400


def noise(h: int, w: int, cell: int, seed: int) -> np.ndarray:
    r = np.random.default_rng(seed)
    gh, gw = h // cell + 3, w // cell + 3
    grid = r.random((gh, gw)).astype(np.float32)
    ys = np.linspace(0, gh - 2, h, dtype=np.float32)
    xs = np.linspace(0, gw - 2, w, dtype=np.float32)
    y0 = np.floor(ys).astype(np.int32)
    x0 = np.floor(xs).astype(np.int32)
    fy = (ys - y0)[:, None]
    fx = (xs - x0)[None, :]
    fy = fy * fy * (3 - 2 * fy)
    fx = fx * fx * (3 - 2 * fx)
    n00 = grid[y0[:, None], x0[None, :]]
    n10 = grid[y0[:, None] + 1, x0[None, :]]
    n01 = grid[y0[:, None], x0[None, :] + 1]
    n11 = grid[y0[:, None] + 1, x0[None, :] + 1]
    return n00 * (1 - fy) * (1 - fx) + n10 * fy * (1 - fx) + n01 * (1 - fy) * fx + n11 * fy * fx


y = np.linspace(0, 1, H, dtype=np.float32)
x = np.linspace(0, 1, W, dtype=np.float32)
n_fine = noise(H, W, 70, 3)
n_mid = noise(H, W, 180, 9)
n_slow = noise(H, W, 420, 11)
field = n_fine * 0.45 + n_mid * 0.35 + n_slow * 0.20

center = 0.50 + 0.04 * np.sin(y * np.pi * 2.2)
cx = center[:, None]
width = 0.36 + 0.05 * n_mid
band = np.exp(-0.5 * ((x[None, :] - cx) / width) ** 2)

phase = (y[:, None] * 2.2 + n_slow * 0.85) % 1.0
palette = [
    (0.02, np.array([86, 52, 28], np.float32)),
    (0.22, np.array([28, 52, 108], np.float32)),
    (0.44, np.array([78, 42, 102], np.float32)),
    (0.66, np.array([26, 78, 58], np.float32)),
    (0.86, np.array([96, 74, 40], np.float32)),
]
weights = []
for center_phase, _color in palette:
    delta = (phase - center_phase + 0.5) % 1.0 - 0.5
    weights.append(np.exp(-0.5 * (delta / 0.18) ** 2))
weight_sum = sum(weights) + 1e-4
color = sum(wgt[..., None] * col for wgt, (_p, col) in zip(weights, palette)) / weight_sum[..., None]

img = np.zeros((H, W, 3), np.float32)
img[:] = (2, 3, 8)
density = np.clip(band * (0.62 + 0.38 * field), 0, 1)
img += color * density[..., None] * 0.7
haze = np.exp(-0.5 * ((x[None, :] - cx) / 0.46) ** 2)
img += np.array([8, 12, 24], np.float32) * haze[..., None]
img = np.clip(img, 0, 112)

soft = Image.fromarray(img.astype(np.uint8), "RGB").filter(ImageFilter.GaussianBlur(radius=22))
arr = np.asarray(soft).astype(np.float32)

out = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")
out.save(r"E:\MandM\public\sky-bg.jpg", quality=86, optimize=True)
print(out.size)
