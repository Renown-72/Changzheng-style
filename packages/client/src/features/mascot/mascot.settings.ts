import * as React from 'react'
import { BRAND_IMAGE_TYPES } from '@dsh-claude-style/contracts/brand'
import { MASCOT_BRAND, MASCOT_CHANGZHENG, MASCOT_DEEPY, MASCOT_OFF } from '../../constants'
import { useBrandImageSeat } from '../../shared/brand-image-seat'
import { PreviewCards } from '../../shared/preview-cards'
import { CHANGZHENG_PORTRAIT_URL, DEEPY_SHEET_URLS } from 'virtual:dsh-claude-style/generated'
import { DEEPY_CLIPS, DEEPY_GUTTER } from './sheets'
import { MASCOT_PLACE_KEY } from './mascot-place'
import { copy } from './copy'
import type { PreviewOption } from '../../shared/preview-cards'
import type { Prefs } from '../../constants'
import type { SettingsControlsOf, SettingsRowView } from '../../core/feature'
import type manifest from './mascot.manifest'

/**
 * The mascot row this feature draws itself (D72): the four choices as cards —
 * each character's card shows the character — and under them 长征姬's picture
 * seat, where the reader uploads, replaces or removes the picture she stands
 * as (the `mascot` brand image, D30).
 */
export const controls: SettingsControlsOf<typeof manifest> = {
  'mascot-picker': MascotPicker,
}

/** How tall a character stands on its card, in CSS pixels. */
const THUMB_HEIGHT = 76

/** 大肥鱼's resting frame: the first cell of her idle sheet, scaled to the card. */
function DeepyThumb() {
  const clip = DEEPY_CLIPS.idle
  const cellWidth = clip.box[2] + DEEPY_GUTTER * 2
  const cellHeight = clip.box[3] + DEEPY_GUTTER * 2
  const scale = THUMB_HEIGHT / cellHeight
  return React.createElement('span', {
    className: 'dsh-claude-mascot-thumb',
    'aria-hidden': 'true',
    style: {
      width: `${Math.round(cellWidth * scale)}px`,
      height: `${THUMB_HEIGHT}px`,
      backgroundImage: `url("${DEEPY_SHEET_URLS.idle}")`,
      backgroundSize: `${Math.round(cellWidth * scale * 8)}px auto`,
    },
  })
}

/** 长征姬's card shows the uploaded picture or the packaged portrait. */
function ChangzhengThumb(props: { url: string }) {
  return React.createElement('span', {
    className: 'dsh-claude-mascot-thumb',
    'aria-hidden': 'true',
    style: { backgroundImage: `url("${props.url}")`, backgroundSize: 'contain' },
  })
}

function Label(props: { text: string }) {
  return React.createElement('span', { className: 'dsh-claude-mascot-card-label' }, props.text)
}

function MascotPicker(props: SettingsRowView) {
  const seat = useBrandImageSeat('mascot', { type: copy('mascotPictureType'), size: copy('mascotPictureSize'), failed: (detail) => copy('mascotPictureFailed', { detail }) })
  const picture = seat.image
  const resetPlace = () => {
    try {
      localStorage.removeItem(MASCOT_PLACE_KEY)
    } catch {
      // Storage refused: nothing was kept.
    }
    for (const element of document.querySelectorAll<HTMLElement>('.dsh-claude-mascot')) {
      element.style.right = ''
      element.style.bottom = ''
    }
  }

  const options: PreviewOption<Prefs['mascot']>[] = [
    {
      value: MASCOT_BRAND,
      label: copy('mascotBrand'),
      content: [
        React.createElement('span', { key: 'art', className: 'dsh-claude-mascot-thumb', 'data-auto': '', 'aria-hidden': 'true' }),
        React.createElement(Label, { key: 'label', text: copy('mascotBrand') }),
      ],
    },
    {
      value: MASCOT_CHANGZHENG,
      label: copy('mascotChangzheng'),
      content: [
        React.createElement(ChangzhengThumb, { key: 'art', url: picture?.url ?? CHANGZHENG_PORTRAIT_URL }),
        React.createElement(Label, { key: 'label', text: copy('mascotChangzheng') }),
      ],
    },
    {
      value: MASCOT_DEEPY,
      label: copy('mascotDeepy'),
      content: [
        React.createElement(DeepyThumb, { key: 'art' }),
        React.createElement(Label, { key: 'label', text: copy('mascotDeepy') }),
      ],
    },
    {
      value: MASCOT_OFF,
      label: copy('mascotOff'),
      content: [
        React.createElement('span', { key: 'art', className: 'dsh-claude-mascot-thumb', 'data-off': '', 'aria-hidden': 'true' }),
        React.createElement(Label, { key: 'label', text: copy('mascotOff') }),
      ],
    },
  ]

  const button = (text: string, onClick: () => void, quiet?: boolean) => React.createElement('button', {
    type: 'button',
    className: 'dsh-claude-mascot-seat-button',
    'data-quiet': quiet === true ? '' : undefined,
    disabled: seat.busy || props.disabled,
    onClick,
  }, text)

  return React.createElement(
    'div',
    { className: 'dsh-claude-mascot-picker' },
    React.createElement(PreviewCards<Prefs['mascot']>, {
      cardClass: 'dsh-claude-mascot-card',
      options,
      value: props.prefs.mascot,
      write: (value: Prefs['mascot']) => props.write({ mascot: value }),
      disabled: props.disabled,
      label: copy('mascotTitle'),
    }),
    React.createElement(
      'div',
      { className: 'dsh-claude-mascot-seat' },
      React.createElement('div', { className: 'dsh-claude-mascot-seat-text' },
        React.createElement('div', { className: 'dsh-claude-mascot-seat-title' }, copy('mascotPictureTitle')),
        React.createElement('div', { className: 'dsh-claude-mascot-seat-desc' }, copy('mascotPictureDesc')),
        seat.error === null ? null : React.createElement('div', { className: 'dsh-claude-mascot-seat-error', role: 'alert' }, seat.error),
      ),
      React.createElement('div', { className: 'dsh-claude-mascot-seat-actions' },
        button(copy(picture === null ? 'mascotPictureUpload' : 'mascotPictureReplace'), seat.open),
        picture === null ? null : button(copy('mascotPictureRemove'), seat.remove, true),
        button(copy('mascotResetPlace'), resetPlace, true),
      ),
      React.createElement('input', {
        ref: seat.picker,
        type: 'file',
        accept: Object.keys(BRAND_IMAGE_TYPES).join(','),
        hidden: true,
        onChange: seat.pick,
      }),
    ),
  )
}
