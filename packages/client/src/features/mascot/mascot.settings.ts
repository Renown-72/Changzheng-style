import * as React from 'react'
import { BRAND_IMAGE_MAX_BYTES, BRAND_IMAGE_TYPES } from '@dsh-claude-style/contracts/brand'
import { MASCOT_BRAND, MASCOT_CHANGZHENG, MASCOT_DEEPY, MASCOT_OFF } from '../../constants'
import { loadBrandImages, readBrandImages, removeBrandImage, subscribeBrandImages, uploadBrandImage } from '../../shared/custom-brand'
import { PreviewCards } from '../../shared/preview-cards'
import { DEEPY_SHEET_URLS } from 'virtual:dsh-claude-style/generated'
import { DEEPY_CLIPS, DEEPY_GUTTER } from './sheets'
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

/** The localStorage key mascot-player.ts keeps the dragged place under. */
const PLACE_KEY = 'dsh-claude-style:mascot-place'

/** The picture in hand, following the shared state. */
function usePicture() {
  const [images, setImages] = React.useState(readBrandImages())
  React.useEffect(() => {
    const off = subscribeBrandImages(setImages)
    loadBrandImages()
    setImages(readBrandImages())
    return off
  }, [])
  return images.mascot
}

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

/** 长征姬's card: her picture, or the crimson mark while she has none. */
function ChangzhengThumb(props: { url: string | null }) {
  return React.createElement('span', {
    className: 'dsh-claude-mascot-thumb',
    'data-empty': props.url === null ? '' : undefined,
    'aria-hidden': 'true',
    style: props.url === null ? undefined : { backgroundImage: `url("${props.url}")`, backgroundSize: 'contain' },
  })
}

function Label(props: { text: string }) {
  return React.createElement('span', { className: 'dsh-claude-mascot-card-label' }, props.text)
}

function MascotPicker(props: SettingsRowView) {
  const picture = usePicture()
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const picker = React.useRef<HTMLInputElement>(null)

  const run = (pending: Promise<void>) => {
    setBusy(true)
    setError(null)
    // A refusal from the host half is said under the seat; the stored picture stays (D12).
    pending.then(() => setBusy(false), (reason: { message?: string }) => {
      setBusy(false)
      setError(copy('mascotPictureFailed', { detail: reason?.message ?? String(reason) }))
    })
  }
  const pick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file === undefined) return
    if (BRAND_IMAGE_TYPES[file.type] === undefined) {
      setError(copy('mascotPictureType'))
      return
    }
    if (file.size > BRAND_IMAGE_MAX_BYTES) {
      setError(copy('mascotPictureSize'))
      return
    }
    run(uploadBrandImage('mascot', file))
  }
  const resetPlace = () => {
    try {
      localStorage.removeItem(PLACE_KEY)
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
        React.createElement(ChangzhengThumb, { key: 'art', url: picture?.url ?? null }),
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
    disabled: busy || props.disabled,
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
        error === null ? null : React.createElement('div', { className: 'dsh-claude-mascot-seat-error', role: 'alert' }, error),
      ),
      React.createElement('div', { className: 'dsh-claude-mascot-seat-actions' },
        button(copy(picture === null ? 'mascotPictureUpload' : 'mascotPictureReplace'), () => picker.current?.click()),
        picture === null ? null : button(copy('mascotPictureRemove'), () => run(removeBrandImage('mascot')), true),
        button(copy('mascotResetPlace'), resetPlace, true),
      ),
      React.createElement('input', {
        ref: picker,
        type: 'file',
        accept: Object.keys(BRAND_IMAGE_TYPES).join(','),
        hidden: true,
        onChange: pick,
      }),
    ),
  )
}
