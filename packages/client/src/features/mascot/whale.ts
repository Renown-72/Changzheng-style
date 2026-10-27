import { DEEPY_EXTRAS, DEEPY_FRAME_MS, DEEPY_GUTTER, DEEPY_SHEETS } from './sheets'
import { createMascotPlayer } from './mascot-player'
import { createMascotImageSheets } from './mascot-image-sheets'
import { DEEPY_SHEET_URLS } from 'virtual:dsh-claude-style/generated'
import { mascotSays } from './copy'
import type { HostContext } from '@dsh-claude-style/engine/host'
import type { FeatureUi } from '../../core/feature'
import type manifest from './mascot.manifest'

/**
 * CSS pixels to a logical pixel of 大肥鱼's sheets: the 412×344 source frame
 * stands 247×206 CSS pixels in the corner (mascot.css scales it down in a
 * narrow window).
 */
const DEEPY_UNIT = 0.6

/**
 * 大肥鱼, the blue-haired whale-tail maid, as a mascot character
 * (packages/client/src/features/mascot/mascot-player.ts plays her;
 * packages/client/src/features/mascot/mascot.ts decides which mascot is out).
 *
 * Her animations are the dsh-pet clips (DEEPY_SHEETS): between jobs she blows
 * bubbles, yawns or stretches now and then. The sheets are too large to ride
 * the bundle, so each is fetched from the host half the first time an
 * animation that plays it is wanted (mascot-image-sheets.ts).
 *
 * @param ui - shared handle table (`ui.composer`).
 * @returns `{ sync, release, onActivity, dispose }`.
 */
export function createMascotWhale(ctx: HostContext, ui: FeatureUi<typeof manifest>) {
  return createMascotPlayer(ctx, ui, {
    name: 'deepy',
    sheets: DEEPY_SHEETS,
    frameMs: DEEPY_FRAME_MS,
    gutter: DEEPY_GUTTER,
    unit: DEEPY_UNIT,
    extras: DEEPY_EXTRAS,
    say: mascotSays,
    createSheets(onReady) {
      return createMascotImageSheets(onReady, DEEPY_SHEETS, DEEPY_SHEET_URLS, '大肥鱼')
    },
  })
}
