import { CUSTOM_EXTRAS, CUSTOM_FRAME_MS, CUSTOM_SHEETS } from './sheets'
import { createMascotPlayer } from './mascot-player'
import { mascotSays } from './copy'
import { readBrandImages } from '../../shared/custom-brand'
import { CHANGZHENG_PORTRAIT_URL } from 'virtual:dsh-claude-style/generated'
import type { HostContext } from '@dsh-claude-style/engine/host'
import type { FeatureUi } from '../../core/feature'
import type manifest from './mascot.manifest'

/**
 * 长征姬 uses the packaged portrait unless the reader uploads a mascot image
 * (shared/custom-brand.ts, D30); both use the same state machine as 大肥鱼.
 *
 * The picture is one still (or an animated GIF / WebP, which plays itself), so
 * every animation is a single frame of it (CUSTOM_SHEETS) and the motion is
 * the stylesheet's: a breath while idle, a sway while working, a hop when a
 * turn finishes, a shake on a failure, keyed on `data-animation`
 * (mascot.css).
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
        ready: () => true,
        failed: () => false,
        paint(style) {
          const picture = readBrandImages().mascot
          style.setProperty('--dsh-claude-mascot-picture', `url("${picture?.url ?? CHANGZHENG_PORTRAIT_URL}")`)
          style.setProperty('--dsh-claude-mascot-ratio', String(picture?.ratio ?? 2 / 3))
        },
        dispose() {},
      }
    },
  })
}
