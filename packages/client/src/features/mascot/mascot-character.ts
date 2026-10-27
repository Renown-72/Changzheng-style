import { CHANGZHENG_COLUMNS, CHANGZHENG_EXTRAS, CHANGZHENG_FRAME_MS, CHANGZHENG_SHEETS, CUSTOM_EXTRAS, CUSTOM_FRAME_MS, CUSTOM_SHEETS } from './sheets'
import { createMascotImageSheets } from './mascot-image-sheets'
import { createMascotPlayer } from './mascot-player'
import { mascotSays } from './copy'
import { readBrandImages } from '../../shared/custom-brand'
import { CHANGZHENG_PORTRAIT_URL, CHANGZHENG_SHEET_URLS } from 'virtual:dsh-claude-style/generated'
import type { HostContext } from '@dsh-claude-style/engine/host'
import type { FeatureUi } from '../../core/feature'
import type manifest from './mascot.manifest'

/**
 * 长征姬 uses the packaged portrait unless the reader uploads a mascot image
 * (shared/custom-brand.ts, D30); both use the same state machine as 大肥鱼.
 *
 * The built-in character plays sheets; a reader's picture keeps its own
 * single-frame player and stylesheet motion.
 *
 * @param ui - shared handle table (`ui.composer`).
 * @returns `{ sync, release, onActivity, dispose }`.
 */
export function createMascotCharacter(ctx: HostContext, ui: FeatureUi<typeof manifest>) {
  const custom = createMascotPlayer(ctx, ui, {
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
  const animated = createMascotPlayer(ctx, ui, {
    name: 'changzheng',
    sheets: CHANGZHENG_SHEETS,
    frameMs: CHANGZHENG_FRAME_MS,
    columns: CHANGZHENG_COLUMNS,
    sheetArt: true,
    unit: 0.49,
    extras: CHANGZHENG_EXTRAS,
    say: mascotSays,
    createSheets(onReady) {
      return createMascotImageSheets(onReady, CHANGZHENG_SHEETS, CHANGZHENG_SHEET_URLS, '长征姬')
    },
  })
  const selected = () => readBrandImages().mascot === null ? animated : custom
  return {
    sync(conversation: boolean) {
      const active = selected()
      ;(active === animated ? custom : animated).release()
      active.sync(conversation)
    },
    release() { custom.release(); animated.release() },
    onActivity() { selected().onActivity() },
    dispose() { custom.dispose(); animated.dispose() },
  }
}
