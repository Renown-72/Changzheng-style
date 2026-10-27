"""Import 大肥鱼's animation frames into packages/assets/src/mascot/deepy/.

Run by hand when the source frames change; the build never runs it:

    python scripts/import-dafeiyu.py <frames-dir> [--table]

<frames-dir> is the `assets/pet/` directory of QCYTSN/dsh-dafeiyu: transparent
412x344 WebP frames at 24 fps, one folder per clip, converted from the
MIT-licensed animation set of PC2005-cloud/dsh-pet (docs/THIRD_PARTY_NOTICES.md).
Needs Pillow with WebP.

Each clip becomes one sheet: frames taken every STEP source frames (12 fps),
cropped to the smallest box that holds every frame of the window, laid out
eight to a row with GUTTER logical pixels of transparency around each frame,
and scaled by SCALE. A logical pixel is one pixel of the source frame.

A looping clip plays a window of its source whose last frame comes back close
to its first, so the loop does not jump; a clip played once starts at the
source's own first frame (the character at rest) and ends where the frames
come back nearest to it.

The script prints DEEPY_SHEETS for packages/client/src/features/mascot/sheets.ts.
"""
import io
import json
import os
import sys

from PIL import Image, ImageChops, ImageStat

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'packages', 'assets', 'src', 'mascot', 'deepy')

STEP = 2            # 24 fps source → 12 fps
SCALE = 5 / 8       # sheet pixels per logical pixel
GUTTER = 8          # logical pixels; GUTTER * SCALE is a whole sheet pixel
ALIGN = 8           # a cell's logical size is a multiple of this, so it is whole in the sheet
QUALITY = 72
COLUMNS = 8

# sheet name → (source clip, mode, frames wanted, search range for the loop / end)
CLIPS = {
    'idle': ('idle', 'loop', 48, (40, 60)),
    'thinking': ('thinking', 'loop', 48, (40, 60)),
    'working': ('working', 'loop', 48, (40, 60)),
    'waiting': ('waiting', 'loop', 48, (40, 60)),
    'archive': ('working_command', 'loop', 48, (40, 60)),
    'eat': ('eat_token', 'loop', 48, (40, 64)),
    'drag': ('dragging', 'loop', 24, (18, 36)),
    'success': ('success', 'once', 60, (52, 72)),
    'error': ('error', 'once', 59, (59, 59)),
    'poke': ('poke', 'once', 36, (28, 48)),
    'tickle': ('head_pat', 'once', 40, (30, 52)),
    'bubbles': ('tail', 'once', 48, (36, 64)),
    'yawn': ('idle_yawn', 'once', 48, (36, 64)),
    'stretch': ('idle_stretch', 'once', 48, (36, 64)),
}


def thumb(image):
    """A small premultiplied grey copy, for comparing poses."""
    rgba = image.convert('RGBA').resize((64, 54))
    grey = rgba.convert('L')
    alpha = rgba.getchannel('A')
    return ImageChops.multiply(grey, alpha), alpha


def distance(a, b):
    ga, aa = a
    gb, ab = b
    return ImageStat.Stat(ImageChops.difference(ga, gb)).mean[0] + ImageStat.Stat(ImageChops.difference(aa, ab)).mean[0]


def window(frames, mode, lengths):
    """The source frame indices to keep (every STEP-th) for one clip."""
    thumbs = [thumb(f) for f in frames]
    lo, hi = lengths
    n = len(frames)
    if mode == 'once':
        best = None
        for length in range(lo, hi + 1):
            end = length * STEP
            if end >= n:
                break
            d = distance(thumbs[0], thumbs[end])
            if best is None or d < best[0]:
                best = (d, length)
        length = best[1] if best else min(lo, n // STEP)
        return list(range(0, length * STEP, STEP))
    best = None
    for start in range(0, n, STEP):
        for length in range(lo, hi + 1):
            end = start + length * STEP
            if end >= n:
                break
            d = distance(thumbs[start], thumbs[end])
            if best is None or d < best[0]:
                best = (d, start, length)
    _, start, length = best
    return list(range(start, start + length * STEP, STEP))


def crop_box(frames):
    box = None
    for f in frames:
        b = f.getchannel('A').point(lambda v: 255 if v > 6 else 0).getbbox()
        if b is None:
            continue
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    # Grow the box until a cell (box plus gutters) is a whole number of sheet pixels.
    W = -(-(w + 2 * GUTTER) // ALIGN) * ALIGN - 2 * GUTTER
    H = -(-(h + 2 * GUTTER) // ALIGN) * ALIGN - 2 * GUTTER
    x0 = max(0, x0 - (W - w) // 2)
    y0 = max(0, y0 - (H - h))   # grow upwards: the feet keep their row
    return [x0, y0, W, H]


def build(src, name, clip, mode, want, lengths):
    folder = os.path.join(src, clip)
    files = sorted(os.listdir(folder))
    frames = [Image.open(os.path.join(folder, f)).convert('RGBA') for f in files]
    keep = window(frames, mode, lengths)
    chosen = [frames[i] for i in keep]
    x, y, w, h = crop_box(chosen)
    cell_w, cell_h = w + 2 * GUTTER, h + 2 * GUTTER
    rows = -(-len(chosen) // COLUMNS)
    sheet = Image.new('RGBA', (cell_w * COLUMNS, cell_h * rows), (0, 0, 0, 0))
    for i, frame in enumerate(chosen):
        piece = Image.new('RGBA', (cell_w, cell_h), (0, 0, 0, 0))
        piece.paste(frame.crop((x, y, x + w, y + h)), (GUTTER, GUTTER))
        sheet.paste(piece, ((i % COLUMNS) * cell_w, (i // COLUMNS) * cell_h))
    out = sheet.resize((round(sheet.width * SCALE), round(sheet.height * SCALE)), Image.LANCZOS)
    buffer = io.BytesIO()
    out.save(buffer, 'WEBP', quality=QUALITY, method=6, alpha_quality=90)
    with open(os.path.join(OUT, f'{name}.webp'), 'wb') as handle:
        handle.write(buffer.getvalue())
    return {'frames': len(chosen), 'box': [x, y, w, h], 'bytes': len(buffer.getvalue()), 'source': [keep[0], keep[-1] + 1]}


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = sys.argv[1]
    os.makedirs(OUT, exist_ok=True)
    for old in os.listdir(OUT):
        os.remove(os.path.join(OUT, old))
    report = {}
    for name, (clip, mode, want, lengths) in CLIPS.items():
        report[name] = build(src, name, clip, mode, want, lengths)
        r = report[name]
        print(f'{name:9} {r["frames"]:3} frames  box {r["box"]}  source {r["source"]}  {r["bytes"] // 1024} KiB', file=sys.stderr)
    total = sum(r['bytes'] for r in report.values())
    print(f'total {total / 1024 / 1024:.2f} MiB', file=sys.stderr)
    if '--table' in sys.argv:
        print(json.dumps({k: {'frames': v['frames'], 'box': v['box']} for k, v in report.items()}, indent=2))


if __name__ == '__main__':
    main()
