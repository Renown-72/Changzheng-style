import { MASCOT_BRAND, MASCOT_CHANGZHENG, MASCOT_DEEPY } from '../../constants'
import type { FeatureManifest } from '../../core/feature'

export default {
  id: 'mascot',
  order: 40,
  load: 'deferred',
  reads: ['composer'],
  contracts: ['chat.think-running', 'composer.fallback-panel', 'composer.seat', 'composer.stack', 'conversation.session', 'conversation.session-attribute'],
  pref: 'mascot',
  prefValues: [MASCOT_BRAND, MASCOT_CHANGZHENG, MASCOT_DEEPY],
  stylesheets: [
    { file: 'mascot.css', rank: 350 },
  ],
  settingsRows: [{
    // The choice as cards, with 长征姬's own picture seat under them
    // (mascot.settings.ts).
    tab: 'appearance',
    rank: 30,
    pref: 'mascot',
    title: 'mascotTitle',
    desc: 'mascotDesc',
    control: 'mascot-picker',
    choiceLabels: {
      [MASCOT_BRAND]: 'mascotBrand',
      [MASCOT_CHANGZHENG]: 'mascotChangzheng',
      [MASCOT_DEEPY]: 'mascotDeepy',
      off: 'mascotOff',
    },
  }, {
    // It belongs to the mascot switch above it.
    tab: 'appearance',
    rank: 40,
    pref: 'mascotScope',
    parent: 'mascot',
    title: 'mascotScopeTitle',
    choiceLabels: { home: 'mascotScopeHome', all: 'mascotScopeAll' },
  }],
  cases: ['crab-states', 'deepy', 'hero', 'studio']
} satisfies FeatureManifest
