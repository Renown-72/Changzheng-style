import COPY from './ban-screen.copy.json'
import { copyIn } from '../../core/i18n'
import { readPrefs } from '../../core/prefs'
import type { CopyParams } from '../../core/i18n'

/** One key of the hold screen's own copy. */
export type CopyKey = keyof typeof COPY

/**
 * One line of the hold screen's copy, in the language the `banLocale`
 * preference names, independently of the shell's language.
 */
export function copy(key: CopyKey, params?: CopyParams) {
  return copyIn(COPY, key, readPrefs().banLocale, params)
}
