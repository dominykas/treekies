#!/usr/bin/env python3
"""
Turn a scanned/photographed drawing into a game-ready sprite.

  python3 tools/cutout.py scans/fox.jpg public/assets/characters/fox.png

What it does:
  1. Makes the paper background transparent. It "flood fills" from the edges,
     so white areas INSIDE the drawing (eyes, teeth) stay white as long as the
     drawing has a closed outline around them.
  2. Crops away the empty space around the drawing.
  3. Shrinks it so the tallest side is at most --max pixels (default 512).

Tips:
  - Scan on white paper, with a dark, closed outline around the character.
  - If shadows/grey paper survive, lower --white (e.g. 200). If parts of the
    drawing disappear, raise it (e.g. 235).

Needs Pillow:  pip install pillow
"""
import argparse
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps

ap = argparse.ArgumentParser()
ap.add_argument("src")
ap.add_argument("dst")
ap.add_argument("--white", type=int, default=220, help="how bright counts as paper (0-255)")
ap.add_argument("--max", type=int, default=512, help="max width/height of the result")
args = ap.parse_args()

img = ImageOps.exif_transpose(Image.open(args.src)).convert("RGBA")

# 1. pixels brighter than --white in all channels are "paper-like" (255), rest 0
r, g, b = (ch.point(lambda v: 255 if v >= args.white else 0) for ch in img.convert("RGB").split())
paper = ImageChops.multiply(ImageChops.multiply(r, g), b)
w, h = img.size

# flood from a 1px border so only paper connected to the edge is removed
padded = Image.new("L", (w + 2, h + 2), 255)
padded.paste(paper, (1, 1))
ImageDraw.floodfill(padded, (0, 0), 128)
background = padded.crop((1, 1, w + 1, h + 1)).point(lambda v: 255 if v == 128 else 0)

# soften the edge a touch so it doesn't look jagged
alpha = ImageOps.invert(background).filter(ImageFilter.GaussianBlur(0.8))
img.putalpha(alpha)

# 2. crop to the drawing
bbox = alpha.point(lambda v: 255 if v > 20 else 0).getbbox()
if bbox:
    img = img.crop(bbox)

# 3. shrink
img.thumbnail((args.max, args.max), Image.LANCZOS)
img.save(args.dst)
print(f"saved {args.dst} ({img.width}x{img.height})")
