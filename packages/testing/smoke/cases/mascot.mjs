import { MARKUP, SKIN_FACE, SKIN_HAT, same, check, contrast, basicChecks, commonChecks } from './_shared.mjs'

export default {
  'crab-states'(r) {
    basicChecks(r)
    const crab = r.states || {}
    const is = (state, animation, place) => !!state && state.animation === animation && state.place === place && state.ready === true
    check('the Long March girl stands on the home card idling, from her inlined sheet',
      is(crab.home, 'idle', 'card') && /^url\("data:image\/png/.test(crab.home.sheet), JSON.stringify(crab.home))
    check('its frames change on its own node without waking a pass',
      !!crab.idle && crab.idle.before !== crab.idle.after && crab.idle.passes === 0, JSON.stringify(crab.idle))
    check('a click on its left half pokes it', is(crab.poke, 'poke-left', 'card'), JSON.stringify(crab.poke))
    check('on the conversation page it stands on the input area: thinking, typing, the hard hat with three sessions at work',
      is(crab.thinking, 'thinking', 'stack') && is(crab.typing, 'typing', 'stack') && is(crab.building, 'building', 'stack'),
      JSON.stringify({ thinking: crab.thinking, typing: crab.typing, building: crab.building }))
    check('an approval puts it on the approval panel with the notification',
      is(crab.notification, 'notification', 'panel'), JSON.stringify(crab.notification))
    check('compaction, the celebration when it ends, and the error shake over it',
      is(crab.compacting, 'compacting', 'stack') && is(crab.celebrating, 'happy', 'stack') && is(crab.failed, 'error', 'stack'),
      JSON.stringify({ compacting: crab.compacting, celebrating: crab.celebrating, failed: crab.failed }))
    // The error sheet's still frame is its fifth: column 4 of 19-cell-wide frames,
    // each with a one-cell margin around it, at 2px a cell.
    check('reduced motion holds the error sheet\'s still frame',
      crab.stillAttr === 'reduced' && !!crab.still && crab.still.before === '-170px -2px' && crab.still.after === '-170px -2px',
      JSON.stringify(crab.still))
    check('it idles after work, sleeps after a quiet minute, and a pointer move wakes it',
      is(crab.afterWork, 'idle', 'stack') && is(crab.asleep, 'sleeping', 'stack') && is(crab.woken, 'waking', 'stack'),
      JSON.stringify({ afterWork: crab.afterWork, asleep: crab.asleep, woken: crab.woken }))
    // The walk this case drives is the only one that reaches these two: the
    // whale's case reads two sheets and leaves.
    check('it subscribes to the session\'s chat target, which the host builds only for a subscriber',
      crab.chatFollowed === true, JSON.stringify(crab.chatFollowed))
    check('a compaction whose end comes back with the whole feed after a reconnect stops playing, uncelebrated',
      is(crab.resendBefore, 'compacting', 'stack') && is(crab.resent, 'idle', 'stack'),
      JSON.stringify({ before: crab.resendBefore, after: crab.resent }))
    check('it leaves with the conversation, and takes its anchor mark along', crab.gone === true, JSON.stringify(crab.gone))
    check('kept to the home page it stays off the conversation and stands on the home card',
      crab.backInConversation === true && crab.homeOnly === null && is(crab.homeOnlyHero, 'idle', 'card'),
      JSON.stringify({ back: crab.backInConversation, homeOnly: crab.homeOnly, hero: crab.homeOnlyHero }))
    check('with the mascot off it leaves; picking Deepy puts the whale out instead',
      crab.off === null && crab.deepyPicked === true, JSON.stringify({ off: crab.off, deepy: crab.deepyPicked }))
    commonChecks(r)
  },
  // The cyan card's whale: its palette, its sheets and its reduced-motion frame.
  deepy(r) {
    basicChecks(r)
    const deepy = r.states || {}
    const is = (state, animation, place) => !!state && state.animation === animation && state.place === place && state.ready === true
    check('the brand stored as "off" reads as Ember, with the cyan card\'s light canvas',
      deepy.brand === 'ember' && deepy.canvas === 'rgb(244, 251, 251)', JSON.stringify({ brand: deepy.brand, canvas: deepy.canvas }))
    check('the cyan card paints its accent, link and dark canvas',
      deepy.accent === '#4cf0e8' && deepy.link === '#1fbcb6' && !!deepy.dark && deepy.dark.canvas === 'rgb(8, 17, 26)' &&
        deepy.dark.accent === '#4cf0e8' && deepy.dark.card === '#111b24',
      JSON.stringify({ accent: deepy.accent, link: deepy.link, dark: deepy.dark }))
    check('the conversation bubble takes the cyan card\'s light and dark fills',
      deepy.bubble === '#d6f7f4' && deepy.dark.bubble === 'rgba(76, 240, 232, .12)',
      JSON.stringify({ light: deepy.bubble, dark: deepy.dark.bubble }))
    // The sheet is the vector the build produced, served from the assets route
    // under the name its own content gives it
    const served = (value) => /^url\("https?:\/\/[^"]*\/dsh-claude-style\/assets\/[0-9a-f]{12}\.svg"\)$/.test(value || '')
    check('the whale stands on the home card idling, playing the vector the build rebuilt from its sheet',
      is(deepy.home, 'idle', 'card') && deepy.crab === false && served(deepy.home.sheet),
      JSON.stringify({ home: deepy.home, crab: deepy.crab }))
    const clip = deepy.home?.clip
    check('the whale shows one frame inside its window',
      clip?.overflow === 'hidden' && clip.width > 0 && clip.height > 0 && clip.sheetWidth > clip.width,
      JSON.stringify(clip))
    check('its frames change on its own node without waking a pass',
      !!deepy.idle && deepy.idle.before !== deepy.idle.after && deepy.idle.passes === 0, JSON.stringify(deepy.idle))
    check('a click on its face pokes it', is(deepy.poke, 'poke-left', 'card'), JSON.stringify(deepy.poke))
    check('the state change switches the node to another served sheet',
      !!deepy.home && !!deepy.poke && deepy.poke.sheet !== deepy.home.sheet && served(deepy.poke.sheet),
      JSON.stringify({ home: deepy.home.sheet, poke: deepy.poke.sheet }))
    check('the animation choice resolves onto the document: reduced holds the still frame, always plays',
      deepy.stillAttr === 'reduced' && deepy.alwaysAttr === 'full' &&
        !!deepy.still && deepy.still.before === deepy.still.after,
      JSON.stringify({ stillAttr: deepy.stillAttr, alwaysAttr: deepy.alwaysAttr, frames: deepy.still }))
    check('it leaves with the page, and takes its anchor mark along', deepy.gone === true, JSON.stringify(deepy.gone))
    commonChecks(r)
  },
}
