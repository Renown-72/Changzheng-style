import { CUSTOM_EXTRAS, CUSTOM_FRAME_MS, CUSTOM_SHEETS } from './sheets'
import { createMascotPlayer } from './mascot-player'
import { mascotSays } from './copy'
import { readBrandImages } from '../../shared/custom-brand'
import type { HostContext } from '@dsh-claude-style/engine/host'
import type { FeatureUi } from '../../core/feature'
import type manifest from './mascot.manifest'

/**
 * 长征姬 as the reader's own picture: the `mascot` brand image the settings
 * page uploads (shared/custom-brand.ts, D30), stood in the window's corner and
 * played by the same state machine as 大肥鱼
 * (packages/client/src/features/mascot/mascot-player.ts).
 *
 * The picture is one still (or an animated GIF / WebP, which plays itself), so
 * every animation is a single frame of it (CUSTOM_SHEETS) and the motion is
 * the stylesheet's: a breath while idle, a sway while working, a hop when a
 * turn finishes, a shake on a failure, keyed on `data-animation`
 * (mascot.css). packages/client/src/features/mascot/mascot.ts puts her out only
 * while a picture is in place.
 *
 * @param ui - shared handle table (`ui.composer`).
 * @returns `{ sync, release, onActivity, dispose }`.
 */
export function createMascotCharacter(ctx: HostContext, ui: FeatureUi<typeof manifest>) {
  return createMascotPlayer(ctx, ui, {
    name: 'changzheng',
    sheets: CUSTOM_SHEETS,
    frameMs: CUSTOM_FRAME_MS,
    unit: 1,
    extras: CUSTOM_EXTRAS,
    say: mascotSays,
    createSheets() {
      return {
        ready: () => readBrandImages().mascot !== null,
        failed: () => false,
        paint(style) {
          const picture = readBrandImages().mascot
          style.setProperty('--dsh-claude-mascot-picture', picture === null ? 'none' : `url("${picture.url}")`)
          style.setProperty('--dsh-claude-mascot-ratio', String(picture === null ? 1 : picture.ratio))
        },
        dispose() {},
      }
    },
  })
}
