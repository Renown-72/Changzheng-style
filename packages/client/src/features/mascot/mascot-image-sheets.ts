import { DEEPY_SHEET_URLS } from 'virtual:dsh-claude-style/generated'
import { DEEPY_SHEETS } from './sheets'

/**
 * 大肥鱼's sheets, as the addresses the sprite paints from. Several animations
 * share a clip (DEEPY_SHEETS), and a clip's sheet is loaded once.
 *
 * Each sheet is the vector the build produced (packages/assets/assets.mjs), served
 * by the host half under the assets route and named after its own content, so
 * the browser fetches a sheet once and caches it for good. Nothing is converted
 * here: the first time an animation is wanted its image is decoded ahead of the
 * frame that paints it, and a sheet that does not arrive leaves its animation
 * out and says so once — the host half serves the sheets, so a host that
 * predates the plugin's build answers 404.
 *
 * @param onReady - `onReady(key)`: a sheet became playable; the caller reads the
 *     state again and plays what it asks for.
 * @returns `{ ready, failed, url, dispose }`.
 */
export function createMascotWhaleSheets(onReady: (key: string) => void) {
  /** The clip an animation plays; an animation outside the table is a bug here. */
  const clipOf = (key: string) => {
    const sheet = DEEPY_SHEETS[key]
    if (sheet === undefined) throw new Error(`dsh-claude-style: no animation "${key}"`)
    return sheet.clip
  }
  /** Clip → 'loading' | 'ready' | 'failed'. */
  const sheets = new Map<string, 'loading' | 'ready' | 'failed'>()
  /** False once disposed: a load landing after the whale left is dropped. */
  let alive = true

  /**
   * Whether a sheet is ready to paint, starting its load the first time.
   * @param key - the animation.
   */
  function ready(key: string) {
    const clip = clipOf(key)
    const known = sheets.get(clip)
    if (known !== undefined) return known === 'ready'
    const address = DEEPY_SHEET_URLS[clip]
    // The table and the sheets are one list; a name outside it is a bug here.
    if (address === undefined) throw new Error(`dsh-claude-style: no sheet for "${key}"`)
    sheets.set(clip, 'loading')
    const image = new Image()
    image.src = address
    const settle = (ok: boolean) => {
      if (sheets.get(clip) !== 'loading') return
      sheets.set(clip, ok ? 'ready' : 'failed')
      if (ok && alive) onReady(key)
      if (!ok) console.warn(`[dsh-claude-style] 大肥鱼's "${clip}" sheet did not load from ${address}; the host half serves it, so restart the host after an update.`)
    }
    image.decode().then(() => settle(true), () => settle(false))
    return false
  }

  /** Whether a sheet's load already failed: an animation that will never come. */
  function failed(key: string) {
    return sheets.get(clipOf(key)) === 'failed'
  }

  /** The address a ready sheet plays from. */
  function url(key: string) {
    return DEEPY_SHEET_URLS[clipOf(key)]
  }

  function dispose() {
    alive = false
    sheets.clear()
  }

  return { ready, failed, url, dispose }
}
