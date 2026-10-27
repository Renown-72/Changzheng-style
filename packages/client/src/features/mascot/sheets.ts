/**
 * The mascot animation tables: which frames each animation holds, the box each
 * frame is cropped to and the frame shown under reduced motion. `scripts/build.mjs`
 * reads them to check every sheet the browser plays, so a sheet and its
 * animation cannot drift apart.
 *
 * Both characters share one state machine (mascot-stage.ts), so both tables
 * carry every animation key it names: the work states, the moments, sleep, the
 * reader's pokes, tickle and drag, and each character's own idle extras.
 */

/** One animation: the clip it plays, the clip's frame count and crop box, and its still frame. */
export interface MascotSheetEntry {
  clip: string
  frames: number
  box: number[]
  still: number
}

/**
 * 大肥鱼's clips, one WebP sheet each under packages/assets/src/mascot/deepy/,
 * imported from the MIT-licensed dsh-pet animation set by
 * scripts/import-dafeiyu.py (docs/THIRD_PARTY_NOTICES.md).
 *
 * A logical pixel is one pixel of the 412×344 source frame. A sheet holds its
 * clip's frames eight to a row, each cropped to `box` — `[x, y, width, height]`
 * in logical pixels — with DEEPY_GUTTER logical pixels of transparency around
 * it, scaled by DEEPY_SCALE; every frame lasts DEEPY_FRAME_MS. The browser
 * loads a sheet the first time an animation that plays it is wanted.
 */
export const DEEPY_FRAME_MS = 84
/** Sheet pixels to a logical pixel; a cell (box plus gutters) is a multiple of eight logical pixels, so it is whole in the sheet. */
export const DEEPY_SCALE = 5 / 8
/** The transparent margin, in logical pixels, around every frame of a sheet, so the downscale never samples the neighbouring frame. */
export const DEEPY_GUTTER = 8
/** The source frame, in logical pixels: the stage the boxes are placed on. */
export const DEEPY_GRID = [412, 344]
export const DEEPY_CLIPS: Record<string, { frames: number, box: number[] }> = {
  'idle': { frames: 40, box: [109, 58, 232, 272] },
  'thinking': { frames: 44, box: [82, 44, 256, 288] },
  'working': { frames: 40, box: [83, 3, 256, 328] },
  'waiting': { frames: 40, box: [84, 36, 248, 296] },
  'archive': { frames: 42, box: [110, 58, 224, 272] },
  'eat': { frames: 53, box: [40, 53, 360, 280] },
  'drag': { frames: 24, box: [103, 21, 248, 280] },
  'success': { frames: 71, box: [70, 9, 304, 328] },
  'error': { frames: 59, box: [57, 43, 272, 288] },
  'poke': { frames: 29, box: [108, 36, 224, 296] },
  'tickle': { frames: 31, box: [104, 52, 232, 280] },
  'bubbles': { frames: 36, box: [84, 55, 248, 280] },
  'yawn': { frames: 51, box: [104, 51, 232, 280] },
  'stretch': { frames: 36, box: [111, 51, 224, 280] },
}

/**
 * Which clip each animation plays, and its still frame. Several states share
 * a clip: the stage's words (the status bubble, mascot.copy.json) tell them
 * apart.
 */
const DEEPY_PLAYS: Record<string, [string, number]> = {
  'idle': ['idle', 0],
  'idle-bubbles': ['bubbles', 0],
  'idle-yawn': ['yawn', 0],
  'idle-stretch': ['stretch', 0],
  'thinking': ['thinking', 12],
  'typing': ['working', 0],
  'music': ['archive', 0],
  'building': ['archive', 0],
  'conducting': ['archive', 0],
  'notification': ['waiting', 0],
  'compacting': ['eat', 20],
  'error': ['error', 30],
  'happy': ['success', 30],
  'sleeping': ['idle', 0],
  'waking': ['stretch', 18],
  'poke-left': ['poke', 0],
  'poke-right': ['poke', 0],
  'tickle': ['tickle', 0],
  'drag': ['drag', 0],
}

export const DEEPY_SHEETS: Record<string, MascotSheetEntry> = Object.fromEntries(
  Object.entries(DEEPY_PLAYS).map(([key, [clip, still]]) => [key, { clip, ...DEEPY_CLIPS[clip], still }]),
)

/** 大肥鱼's idle extras: now and then, between jobs. */
export const DEEPY_EXTRAS = ['idle-bubbles', 'idle-yawn', 'idle-stretch']

/**
 * A reader's `mascot` brand image (D30) is one frame, set in motion by the
 * stylesheet per animation (mascot.css keys on `data-animation`).
 */
export const CUSTOM_FRAME_MS = 1000
export const CUSTOM_SHEETS: Record<string, MascotSheetEntry> = Object.fromEntries(
  [...Object.keys(DEEPY_PLAYS), 'idle-hop'].filter(key => !key.startsWith('idle-') || key === 'idle-hop')
    .map(key => [key, { clip: 'custom', frames: 1, box: [0, 0, 1, 1], still: 0 }]),
)

/** 长征姬's idle extra: a little hop now and then. */
export const CUSTOM_EXTRAS = ['idle-hop']

/** The built-in portrait's eight-frame sheets, in four columns and two rows. */
export const CHANGZHENG_CLIPS = ['idle', 'work', 'happy', 'sleep', 'poke', 'error', 'wait', 'wave']
export const CHANGZHENG_EXTRAS = ['idle-hop', 'idle-wave']
export const CHANGZHENG_GRID = [384, 512]
export const CHANGZHENG_COLUMNS = 4
export const CHANGZHENG_FRAME_MS = 250
export const CHANGZHENG_SHEETS: Record<string, MascotSheetEntry> = Object.fromEntries(
  [...Object.keys(CUSTOM_SHEETS), 'idle-wave'].map((key) => {
    const clip = key === 'sleeping' ? 'sleep'
      : key === 'idle-wave' ? 'wave'
      : key === 'happy' || key === 'idle-hop' ? 'happy'
        : key === 'error' ? 'error'
          : key === 'notification' ? 'wait'
            : key === 'poke-left' || key === 'poke-right' || key === 'tickle' ? 'poke'
        : ['thinking', 'typing', 'music', 'building', 'conducting', 'compacting'].includes(key) ? 'work' : 'idle'
    return [key, { clip, frames: 8, box: [0, 0, ...CHANGZHENG_GRID], still: clip === 'sleep' ? 7 : 0 }]
  }),
)
