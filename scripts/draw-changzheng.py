"""Draw 长征姬's composer sheets into packages/assets/src/mascot/changzheng/.

Run by hand after changing a drawing; the build never runs it:

    python scripts/draw-changzheng.py

Needs Pillow. The script writes the sheets and prints the MASCOT_SHEETS table
packages/client/src/features/mascot/sheets.ts carries; paste it there.

The grid is 52x36 cells, one cell to one pixel of a sheet — the page draws a
cell two device pixels wide — with her feet on the bottom row of the grid. She
is drawn in a block of ART_W cells by ART_H rows at ART_X, ART_Y, a little left
of the grid's middle, so the right of the grid stays free for what she puts
there: the laptop, the thought bubble, the notes, the sparks.

Every animation is three sheets over the same frames and the same crop box, so
the page paints one set of drawings in either palette:

    <key>.png         what the palette does not decide: white hair and sailor
                      top, skin, the crimson irises, the gold star, and the dark
                      line that holds the silhouette together.
    <key>-accent.png  a mask of the parts the palette decides — the neckerchief
                      and the pleated skirt — filled on the page with the
                      theme's accent, so both palettes come from one drawing.
    <key>-ink.png     a mask of what is not her: the laptop, the bubble, the
                      notes, the letters, the hard hat.

A sheet holds eight frames to a row, each cropped to the smallest box that
holds every frame of that animation. A mask sheet is black where it paints and
transparent elsewhere; an animation with nothing in a mask still gets that
sheet, fully transparent, because the build asks for the three by name.
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'packages', 'assets', 'src', 'mascot', 'changzheng')

W, H = 52, 36

# The colours of the sheet the palette does not decide. The masks carry shape
# only: the page fills them with its own ink and accent.
PALETTE = {
    'hair': (0xf4, 0xf0, 0xff, 255),
    'top': (0xf4, 0xf0, 0xff, 255),
    'skin': (0xff, 0xd9, 0xc4, 255),
    'iris': (0xff, 0x33, 0x55, 255),
    'star': (0xff, 0xd5, 0x4a, 255),
    'line': (0x0f, 0x0a, 0x1a, 255),
}
MASK = (0, 0, 0, 255)

# Her block in the grid: ART_W cells wide, ART_H rows tall, its top-left cell at
# ART_X, ART_Y. Every offset in this file counts from that corner.
ART_X, ART_Y = 15, 8
ART_W, ART_H = 19, 28

# Her block in its own cells: `H` white hair, `S` skin, `T` the white sailor top
# and stockings, `A` the accent the page fills (neckerchief, pleated skirt), `D`
# a dark cell, `.` nothing. The arms and the legs are drawn by arm() and legs()
# over it, because they move; the block's rows run 0 to 27, so its last row is
# the shoes on the grid's bottom row.
ART = [
    '.......HHHHH.......',
    '.....HHHHHHHHH.....',
    '....HHHHHHHHHHH....',
    '...HHHHHHHHHHHHH...',
    '...HHHHHHHHHHHHH...',
    '..HHHHHHHHHHHHHHH..',
    '..HHHSSSSSSSSSHHH..',
    '..HHHSSSSSSSSSHHH..',
    '..HHHSSSSSSSSSHHH..',
    '..HHHSSSSSSSSSHHH..',
    '...HHHSSSSSSSHHH...',
    '..HH....SSS....HH..',
    '..HH..TTAAATT..HH..',
    '..HH..TAAAAAT..HH..',
    '..HH..TTAAATT..HH..',
    '..HH..TTTATTT..HH..',
    '..HH..TTTTTTT..HH..',
    '..HH..TTTTTTT..HH..',
    '..HH..TTTTTTT..HH..',
    '.....AAAAAAAAA.....',
    '....AAAAAAAAAAA....',
    '...AAAAAAAAAAAAA...',
    '...AAAAAAAAAAAAA...',
    '.......TT.TT.......',
    '.......TT.TT.......',
    '.......TT.TT.......',
    '.......TT.TT.......',
    '......DDD.DDD......',
]

# The cells the face is put on, and the hairpin's, inside the block.
EYE_L, EYE_R, EYE_ROW = 6, 10, 6
MOUTH_COL, MOUTH_ROW = 9, 10
STAR_COL, STAR_ROW = 2, 1


class Frame:
    """One frame: the coloured cells, the accent mask and the ink mask.

    A cell belongs to one layer at most, so the three sheets of an animation
    never paint over one another on the page.
    """

    def __init__(self):
        self.body = {}
        self.accent = set()
        self.ink = set()

    def put(self, x, y, colour='line'):
        if 0 <= x < W and 0 <= y < H:
            self.body[(x, y)] = colour
            self.accent.discard((x, y))
            self.ink.discard((x, y))

    def fill(self, x, y, w, h, colour='line'):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.put(xx, yy, colour)

    def accent_at(self, x, y):
        if 0 <= x < W and 0 <= y < H:
            self.accent.add((x, y))
            self.body.pop((x, y), None)
            self.ink.discard((x, y))

    def accent_rect(self, x, y, w, h):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.accent_at(xx, yy)

    def mark(self, x, y):
        if 0 <= x < W and 0 <= y < H:
            self.ink.add((x, y))
            self.body.pop((x, y), None)
            self.accent.discard((x, y))

    def mark_rect(self, x, y, w, h):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.mark(xx, yy)

    def glyph(self, x, y, rows):
        for dy, row in enumerate(rows):
            for dx, ch in enumerate(row):
                if ch == '#':
                    self.mark(x + dx, y + dy)

    def cells(self):
        return set(self.body) | self.accent


def ring(f, cells):
    """Put the dark line round `cells`: every four-neighbour of theirs that they
    do not hold is a dark cell. A white sleeve over white hair would otherwise
    read as one shape."""
    for (x, y) in cells:
        for at in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if at not in cells:
                f.put(at[0], at[1], 'line')


GLYPHS = {
    'z': ['####', '..#.', '.#..', '####'],
    'Z': ['#####', '...#.', '..#..', '.#...', '#####'],
    '!': ['##', '##', '##', '##', '..', '##'],
    '?': ['.###.', '#...#', '...#.', '..#..', '.....', '..#..'],
    'note': ['.###', '.#.#', '.#..', '.#..', '##..', '##..'],
    'note2': ['###.', '#.#.', '#...', '#...', '##..', '##..'],
    'spark': ['.#.', '###', '.#.'],
    'dot': ['##', '##'],
    'small': ['#'],
    'x': ['#.#', '.#.', '#.#'],
    'bubble': ['.#########.', '#.........#', '#.........#', '#.........#', '.#########.'],
}


def ox(col):
    """A column in the block's cells, as a grid column."""
    return ART_X + col


def oy(row):
    """A row in the block's cells, as a grid row."""
    return ART_Y + row


# ── Her face ────────────────────────────────────────────────────────────────
def eye(f, x, y, kind='open'):
    """One eye in a three-by-three slot at (x, y): the dark lash, the crimson
    iris under it with the pupil in the middle, then the iris's lower lid."""
    if kind == 'shut':
        f.fill(x, y + 1, 3, 1, 'line')
        return
    if kind == 'happy':
        f.put(x, y + 2, 'line')
        f.put(x + 1, y + 1, 'line')
        f.put(x + 2, y + 2, 'line')
        return
    if kind == 'x':
        for (px, py) in ((0, 0), (2, 0), (1, 1), (0, 2), (2, 2)):
            f.put(x + px, y + py, 'line')
        return
    if kind == 'wide':
        f.fill(x, y, 3, 1, 'line')
        f.fill(x, y + 3, 3, 1, 'line')
        f.put(x, y + 1, 'line')
        f.put(x + 1, y + 1, 'iris')
        f.put(x + 2, y + 1, 'line')
        f.put(x + 1, y + 2, 'iris')
        return
    dx, dy = {'left': (-1, 0), 'right': (1, 0), 'up': (0, -1), 'down': (0, 1)}.get(kind, (0, 0))
    x, y = x + dx, y + dy
    f.fill(x, y, 3, 1, 'line')
    f.put(x, y + 1, 'iris')
    f.put(x + 1, y + 1, 'line')
    f.put(x + 2, y + 1, 'iris')
    f.fill(x, y + 2, 3, 1, 'iris')


def star(f, x, y):
    """The hairpin: a five-pointed star, five cells each way."""
    for (px, py) in ((2, 0), (1, 1), (2, 1), (3, 1), (0, 2), (1, 2), (2, 2), (3, 2), (4, 2), (1, 3), (3, 3), (0, 4), (4, 4)):
        f.put(x + px, y + py, 'star')


def face(f, bx, by, eyes='open', squish=0):
    """Her face over the block already painted: the eyes, the mouth, the
    hairpin, all sunk by `squish` rows with the head."""
    y = by + squish
    eye(f, bx + EYE_L, y + EYE_ROW, eyes)
    eye(f, bx + EYE_R, y + EYE_ROW, eyes)
    f.fill(bx + MOUTH_COL, y + MOUTH_ROW, 2, 1, 'line')
    star(f, bx + STAR_COL, y + STAR_ROW)


# ── Her arms and legs ───────────────────────────────────────────────────────
# Where each pose puts a two-cell sleeve on her right: the block column of its
# top, the row, how many rows it runs and which end the bare hand is at. Her
# left is the mirror image (arm()). The sleeves hang in the gaps at columns 4-5
# and 13-14, in front of the hair.
ARMS = {
    'rest': (4, 13, 6, 'down'),
    'down': (4, 15, 4, 'down'),
    'type': (4, 14, 4, 'down'),
    'mid': (3, 11, 4, 'up'),
    'up': (2, 8, 4, 'up'),
    'high': (1, 5, 4, 'up'),
}


def arm(f, bx, by, side, pose):
    """A two-cell sleeve in `pose`, on her right for `side` -1 and on her left
    for 1, with the bare hand at the end the pose raises. The sleeve is ringed in
    the dark line: it is the same white as the hair it passes in front of."""
    col, top, length, hand = ARMS[pose]
    x = bx + (col if side < 0 else ART_W - 2 - col)
    y = by + top
    cells = {(x + dx, y + i) for i in range(length) for dx in (0, 1)}
    for (cx, cy) in cells:
        f.put(cx, cy, 'top')
    f.fill(x, y + (length - 1 if hand == 'down' else 0), 2, 1, 'skin')
    ring(f, cells)


def legs(f, bx, by, kind='stand'):
    """The two legs under the skirt and the shoes on the bottom row. The block
    already holds the standing pair; the other kinds redraw them."""
    if kind == 'stand':
        return
    if kind == 'tuck':
        f.fill(bx + 7, by + 22, 2, 3, 'top')
        f.fill(bx + 10, by + 22, 2, 3, 'top')
        f.fill(bx + 6, by + 25, 3, 2, 'line')
        f.fill(bx + 10, by + 25, 3, 2, 'line')
    elif kind == 'dangle':
        f.fill(bx + 7, by + 22, 2, 3, 'top')
        f.fill(bx + 10, by + 22, 2, 3, 'top')
        f.fill(bx + 7, by + 25, 2, 1, 'line')
        f.fill(bx + 10, by + 24, 2, 1, 'line')
    elif kind == 'stepA':
        f.fill(bx + 7, by + 22, 2, 5, 'top')
        f.fill(bx + 10, by + 22, 2, 3, 'top')
        f.fill(bx + 6, by + 26, 3, 1, 'line')
        f.fill(bx + 10, by + 25, 3, 1, 'line')
    elif kind == 'stepB':
        f.fill(bx + 7, by + 22, 2, 3, 'top')
        f.fill(bx + 10, by + 22, 2, 5, 'top')
        f.fill(bx + 6, by + 25, 3, 1, 'line')
        f.fill(bx + 10, by + 26, 3, 1, 'line')


def changzheng(f, dx=0, dy=0, eyes='open', left='rest', right='rest', legs_kind='stand', squish=0):
    """Draw her on the grid, moved by (dx, dy) and sunk by `squish` rows."""
    bx, by = ART_X + dx, ART_Y + dy
    for row, text in enumerate(ART):
        for col, ch in enumerate(text):
            x, y = bx + col, by + row
            if ch == 'H':
                f.put(x, y, 'hair')
            elif ch == 'S':
                f.put(x, y, 'skin')
            elif ch == 'T':
                f.put(x, y, 'top')
            elif ch == 'A':
                f.accent_at(x, y)
            elif ch == 'D':
                f.put(x, y, 'line')
    legs(f, bx, by, legs_kind)
    arm(f, bx, by, -1, left)
    arm(f, bx, by, 1, right)
    face(f, bx, by, eyes, squish)


def outline(f):
    """Put the dark line round the whole silhouette: the sheets are drawn over
    the composer card in either canvas, and white hair needs an edge to stand
    against the light one."""
    ring(f, f.cells())


def new(**pose):
    f = Frame()
    changzheng(f, **pose)
    outline(f)
    return f


# ── What she holds and what floats beside her ───────────────────────────────
def laptop(f, x, y):
    """The open laptop she is holding, in the ink mask: the screen standing on
    its base, the screen hollow so it reads as a panel rather than a slab."""
    f.mark_rect(x, y, 11, 1)
    f.mark_rect(x, y, 1, 5)
    f.mark_rect(x + 10, y, 1, 5)
    f.mark_rect(x, y + 4, 11, 1)
    f.mark_rect(x - 1, y + 5, 13, 1)
    f.mark_rect(x + 1, y + 6, 9, 1)


def hard_hat(f, x, y):
    """A builder's hat over the head: a low dome on a brim."""
    f.mark_rect(x + 5, y, 5, 1)
    f.mark_rect(x + 2, y + 1, 11, 1)
    f.mark_rect(x, y + 2, 15, 1)


# ── The animations ──────────────────────────────────────────────────────────
def idle():
    frames = [new() for _ in range(20)]
    frames += [new(eyes='shut'), new(eyes='shut'), new(), new()]
    return frames, 0


def idle_look():
    seq = ['open'] * 4 + ['left'] * 10 + ['open'] * 3 + ['right'] * 10 + ['open'] * 4
    return [new(eyes=e) for e in seq], 0


def idle_wave():
    seq = ['rest', 'mid', 'up', 'high', 'up', 'high', 'up', 'high', 'up', 'mid', 'rest', 'rest']
    return [new(right=p, eyes='happy' if p in ('up', 'high') else 'open') for p in seq], 0


def idle_laptop():
    """She lifts the laptop, types for a while, and puts it down."""
    frames = []
    for step in range(40):
        if step < 4 or step >= 36:
            frames.append(new())
        elif step < 8:
            f = new(eyes='shut')
            laptop(f, ox(3), oy(12))
            frames.append(f)
        else:
            f = new(left='type', right='type')
            laptop(f, ox(3), oy(12) - step % 2)
            frames.append(f)
    return frames, 0


def thinking():
    """Her eyes go up to a thought bubble that rises dot by dot, then holds
    while its three inner dots fill one by one."""
    frames = []
    bx, by = ox(15), oy(-9)
    for step in range(32):
        f = new(eyes='up')
        if step >= 2:
            f.glyph(ox(15), oy(0), GLYPHS['small'])
        if step >= 5:
            f.glyph(ox(16), oy(-3), GLYPHS['dot'])
        if step >= 8:
            f.glyph(bx, by, GLYPHS['bubble'])
            for i in range((step - 8) // 4 % 4):
                f.glyph(bx + 3 + i * 2, by + 2, GLYPHS['small'])
        frames.append(f)
    return frames, 18


def typing():
    frames = []
    for step in range(6):
        f = new(left='type', right='type')
        laptop(f, ox(3), oy(12) - step % 2)
        frames.append(f)
    return frames, 0


def music():
    frames = []
    for step in range(16):
        bob = 1 if (step // 2) % 2 else 0
        f = new(dy=bob, eyes='shut' if step % 8 < 4 else 'happy',
                left='up' if step % 4 < 2 else 'rest', right='rest' if step % 4 < 2 else 'up')
        for i, (x, y) in enumerate(((ox(17), oy(-2)), (ox(21), oy(-9)))):
            rise = (step + i * 8) % 16 // 2
            f.glyph(x, y - rise, GLYPHS['note'] if i == 0 else GLYPHS['note2'])
        frames.append(f)
    return frames, 0


def conducting():
    frames = []
    seq = [('up', 'mid'), ('high', 'rest'), ('up', 'mid'), ('mid', 'up'), ('rest', 'high'), ('mid', 'up')]
    for step in range(24):
        left, right = seq[step // 4 % len(seq)]
        f = new(eyes='happy' if step % 12 < 6 else 'open', left=left, right=right)
        baton_x = ox(15 if right in ('high', 'up') else 16)
        baton_y = oy(1 if right == 'high' else 4 if right == 'up' else 11)
        f.glyph(baton_x, baton_y, ['#.', '.#', '.#'] if right != 'rest' else ['##'])
        frames.append(f)
    return frames, 0


def building():
    frames = []
    for step in range(6):
        f = new(left='type', right='type', eyes='open' if step % 2 else 'shut')
        hard_hat(f, ox(1), oy(-3))
        laptop(f, ox(3), oy(12) - step % 2)
        frames.append(f)
    return frames, 0


def error():
    frames = []
    for step in range(24):
        shake = [0, -1, 0, 1][step % 4] if step < 16 else 0
        f = new(dx=shake, eyes='x', left='down', right='down')
        if step % 8 < 6:
            f.glyph(ox(9) + shake, oy(-6), GLYPHS['!'])
        frames.append(f)
    return frames, 4


def happy():
    frames = []
    hops = [0, -2, -4, -5, -4, -2, 0, 0, 0, -2, -4, -5, -4, -2, 0, 0]
    for step, lift in enumerate(hops * 2):
        up = lift < 0
        f = new(dy=lift, eyes='happy', left='high' if up else 'up', right='high' if up else 'up',
                legs_kind='dangle' if lift <= -4 else 'stand')
        if step % 4 < 2:
            f.glyph(ox(-4), oy(9) + lift // 2, GLYPHS['spark'])
            f.glyph(ox(19), oy(7) + lift // 2, GLYPHS['spark'])
        else:
            f.glyph(ox(-5), oy(4) + lift // 2, GLYPHS['spark'])
            f.glyph(ox(20), oy(13) + lift // 2, GLYPHS['spark'])
        frames.append(f)
    return frames, 3


def notification():
    frames = []
    for step in range(16):
        bounce = [0, -1, -2, -1][step // 2 % 4]
        f = new(eyes='wide', right='up' if step % 8 < 4 else 'mid')
        f.glyph(ox(9), oy(-6) + bounce, GLYPHS['!'])
        frames.append(f)
    return frames, 0


def compacting():
    frames = []
    seq = [0, 1, 2, 3, 3, 2, 1, 0, 0, 0]
    for step in range(20):
        s = seq[step % len(seq)]
        f = new(squish=s, eyes='shut' if s >= 2 else 'open')
        if s == 3:
            f.glyph(ox(-4), oy(23), GLYPHS['small'])
            f.glyph(ox(19), oy(22), GLYPHS['small'])
            f.glyph(ox(-2), oy(19), GLYPHS['small'])
            f.glyph(ox(18), oy(18), GLYPHS['small'])
        frames.append(f)
    return frames, 3


def sleeping():
    frames = []
    letters = [('z', ox(17), oy(4)), ('z', ox(20), oy(-2)), ('Z', ox(22), oy(-9))]
    for step in range(32):
        breathe = 1 if step % 16 >= 8 else 0
        f = new(dy=1, eyes='shut', legs_kind='tuck', squish=breathe)
        for i, (g, x, y) in enumerate(letters):
            phase = (step - i * 8) % 32
            if 0 <= phase < 24:
                f.glyph(x - 2, y - phase // 8, GLYPHS[g])
        frames.append(f)
    return frames, 0


def waking():
    frames = []
    lifts = [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    for step, lift in enumerate(lifts):
        f = new(dy=lift, eyes='shut' if step < 2 else 'wide',
                left='high' if 2 <= step < 5 else 'rest', right='high' if 2 <= step < 5 else 'rest',
                legs_kind='tuck' if step < 2 else 'stand')
        if 2 <= step < 9:
            f.glyph(ox(9), oy(-6) + lift, GLYPHS['!'])
        frames.append(f)
    return frames, 11


def poke(direction):
    frames = []
    push = [0, 2, 3, 3, 3, 2, 1, 0, 0, 0] if direction == 'left' else [0, -2, -3, -3, -3, -2, -1, 0, 0, 0]
    for step, dx in enumerate(push):
        eyes = 'shut' if 1 <= step <= 4 else 'open'
        f = new(dx=dx, eyes=eyes, left='mid' if dx > 0 else 'rest', right='mid' if dx < 0 else 'rest')
        frames.append(f)
    return frames, 0


def tickle():
    frames = []
    for step in range(16):
        dx = [0, -1, 0, 1][step % 4]
        f = new(dx=dx, eyes='happy', left='up' if step % 2 else 'mid', right='mid' if step % 2 else 'up',
                legs_kind='stepA' if step % 2 else 'stepB')
        frames.append(f)
    return frames, 0


def drag():
    frames = []
    for step in range(8):
        sway = [0, 1, 0, -1][step // 2 % 4]
        f = new(dx=sway, dy=-3, eyes='wide', left='high', right='high', legs_kind='dangle')
        frames.append(f)
    return frames, 0


ANIMATIONS = {
    'idle': idle,
    'idle-look': idle_look,
    'idle-wave': idle_wave,
    'idle-laptop': idle_laptop,
    'thinking': thinking,
    'typing': typing,
    'music': music,
    'conducting': conducting,
    'building': building,
    'error': error,
    'happy': happy,
    'notification': notification,
    'compacting': compacting,
    'sleeping': sleeping,
    'waking': waking,
    'poke-left': lambda: poke('left'),
    'poke-right': lambda: poke('right'),
    'tickle': tickle,
    'drag': drag,
}


def write(key, frames):
    cells = set()
    for f in frames:
        cells |= f.cells() | f.ink
    xs = [x for x, _ in cells]
    ys = [y for _, y in cells]
    box = [min(xs), min(ys), max(xs) - min(xs) + 1, max(ys) - min(ys) + 1]
    rows = (len(frames) + 7) // 8
    size = (box[2] * 8, box[3] * rows)
    body = Image.new('RGBA', size, (0, 0, 0, 0))
    accent = Image.new('RGBA', size, (0, 0, 0, 0))
    ink = Image.new('RGBA', size, (0, 0, 0, 0))
    for i, f in enumerate(frames):
        at_x = (i % 8) * box[2] - box[0]
        at_y = (i // 8) * box[3] - box[1]
        for (x, y), colour in f.body.items():
            body.putpixel((x + at_x, y + at_y), PALETTE[colour])
        for (x, y) in f.accent:
            accent.putpixel((x + at_x, y + at_y), MASK)
        for (x, y) in f.ink:
            ink.putpixel((x + at_x, y + at_y), MASK)
    for image, suffix in ((body, ''), (accent, '-accent'), (ink, '-ink')):
        image.save(os.path.join(OUT, f'{key}{suffix}.png'), optimize=True)
    return box


def main():
    os.makedirs(OUT, exist_ok=True)
    print('export const MASCOT_SHEETS: Record<string, { frames: number, box: number[], still: number }> = {')
    for key, draw in ANIMATIONS.items():
        frames, still = draw()
        box = write(key, frames)
        print(f"  '{key}': {{ frames: {len(frames)}, box: [{box[0]}, {box[1]}, {box[2]}, {box[3]}], still: {still} }},")
    print('}')


if __name__ == '__main__':
    main()
