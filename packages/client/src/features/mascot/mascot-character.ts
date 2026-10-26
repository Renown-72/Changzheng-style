import { MASCOT_FRAME_MS, MASCOT_GUTTER, MASCOT_SHEETS } from './sheets'
import { createMascotPlayer } from './mascot-player'
import { MASCOT_SHEET_URLS } from 'virtual:dsh-claude-style/generated'
import type { HostContext } from '@dsh-claude-style/engine/host'
import type { FeatureUi } from '../../core/feature'
import type manifest from './mascot.manifest'

/**
 * The pixel Long March girl as the composer's mascot character
 * (packages/client/src/features/mascot/mascot-player.ts plays her;
 * packages/client/src/features/mascot/mascot.ts decides whether she is out).
 *
 * Between jobs she looks around, waves, or now and then pulls out a laptop and
 * types for a while (MASCOT_SHEETS, drawn by scripts/draw-changzheng.py).
 *
 * Each animation is three sheets, inlined by the build as data URIs
 * (MASCOT_SHEET_URLS), so every one is ready the moment it is wanted: the
 * colour sheet holds what she is made of, the accent mask holds the scarf and
 * the skirt — painted with the palette's accent, so both colour cards share one
 * drawing — and the ink mask holds what takes the quiet text ink (the laptop,
 * the thought bubble, letters, notes, the hat).
 *
 * @param ui - shared handle table (`ui.composer`).
 * @returns `{ sync, release, onActivity, dispose }`.
 */
export function createMascotCharacter(ctx: HostContext, ui: FeatureUi<typeof manifest>) {
  return createMascotPlayer(ctx, ui, {
    name: 'changzheng',
    sheets: MASCOT_SHEETS,
    frameMs: MASCOT_FRAME_MS,
    gutter: MASCOT_GUTTER,
    extras: ['idle-look', 'idle-wave', 'idle-laptop'],
    createSheets() {
      return {
        ready: key => Object.prototype.hasOwnProperty.call(MASCOT_SHEET_URLS, key),
        failed: () => false,
        paint(style, key) {
          style.setProperty('--dsh-claude-mascot-sheet', `url("${MASCOT_SHEET_URLS[key].body}")`)
          style.setProperty('--dsh-claude-mascot-accent', `url("${MASCOT_SHEET_URLS[key].accent}")`)
          style.setProperty('--dsh-claude-mascot-ink', `url("${MASCOT_SHEET_URLS[key].ink}")`)
        },
        dispose() {},
      }
    },
  })
}
