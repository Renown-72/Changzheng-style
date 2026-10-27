import COPY from './mascot.copy.json'
import { createCopy } from '../../core/i18n'

export type CopyKey = keyof typeof COPY

/**
 * One line of this feature's own interface copy, in the shell's language
 * (packages/client/src/features/mascot/mascot.copy.json): the copy ships with
 * the bundle, so the first paint carries it.
 */
export const copy = createCopy(COPY)

/** The status bubble's line for each animation that says something; the rest stay quiet. */
const SAYS: Readonly<Record<string, CopyKey>> = {
  'thinking': 'sayThinking',
  'typing': 'sayTyping',
  'music': 'sayBusy',
  'building': 'sayBusy',
  'conducting': 'sayConducting',
  'notification': 'sayNotification',
  'compacting': 'sayCompacting',
  'error': 'sayError',
  'happy': 'sayHappy',
  'sleeping': 'saySleeping',
}

/**
 * What the mascot says over an animation, or null for an animation that says
 * nothing (idle, its extras, the reader's pokes).
 * @param key - the animation.
 */
export function mascotSays(key: string) {
  const line = SAYS[key]
  return line === undefined ? null : copy(line)
}
