import { MASCOT_CHANGZHENG, MASCOT_DEEPY, MASCOT_SCOPE_ALL } from '../../constants'
import { readPrefs, resolveMascot } from '../../core/prefs'
import { loadBrandImages, subscribeBrandImages } from '../../shared/custom-brand'
import { createMascotCharacter } from './mascot-character'
import { createMascotWhale } from './whale'
import type { HostContext } from '@dsh-claude-style/engine/host'
import type { FeatureUi } from '../../core/feature'
import type manifest from './mascot.manifest'

/**
 * The mascot in the window's bottom-right corner: 长征姬, using the packaged
 * portrait or the reader's picture (features/mascot/mascot-character.ts), or
 * 大肥鱼, the whale-tail maid (packages/client/src/features/mascot/whale.ts),
 * both played by the agent's state (packages/client/src/features/mascot/mascot-player.ts).
 *
 * Which one is out is the mascot preference, resolved onto <body> as
 * MASCOT_ATTR: "follow the brand" puts 长征姬 under the crimson card and
 * 大肥鱼 under the cyan one, and the reader may pick either, or none. When it
 * is out is the "where it appears" preference: the home page alone, or the
 * home page and the conversation. The other character is released, so only
 * one mascot is ever on the page.
 */
export function install(ctx: HostContext, ui: FeatureUi<typeof manifest>) {
  const character = createMascotCharacter(ctx, ui)
  const whale = createMascotWhale(ctx, ui)
  loadBrandImages()

  function sync() {
    const prefs = readPrefs()
    const mascot = resolveMascot(prefs)
    const conversation = prefs.mascotScope === MASCOT_SCOPE_ALL
    if (mascot === MASCOT_CHANGZHENG) character.sync(conversation)
    else character.release()
    if (mascot === MASCOT_DEEPY) whale.sync(conversation)
    else whale.release()
  }

  function onActivity() {
    character.onActivity()
    whale.onActivity()
  }

  // A picture uploaded, replaced or removed: the character changes at once,
  // and a replaced picture is painted again.
  const off = subscribeBrandImages(() => {
    character.release()
    sync()
  })

  ui.mascot = { sync, onActivity }

  return () => {
    off()
    character.dispose()
    whale.dispose()
    delete ui.mascot
  }
}
