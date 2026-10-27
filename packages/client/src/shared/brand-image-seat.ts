import * as React from 'react'
import { BRAND_IMAGE_MAX_BYTES, BRAND_IMAGE_TYPES } from '@dsh-claude-style/contracts/brand'
import type { BrandImageKind } from '@dsh-claude-style/contracts/brand'
import { loadBrandImages, readBrandImages, removeBrandImage, subscribeBrandImages, uploadBrandImage } from './custom-brand'

/** The settings controls share the same image state and upload validation. */
export function useBrandImageSeat(kind: BrandImageKind, messages: { type: string, size: string, failed: (detail: string) => string }) {
  const [images, setImages] = React.useState(readBrandImages())
  React.useEffect(() => {
    const off = subscribeBrandImages(setImages)
    loadBrandImages()
    setImages(readBrandImages())
    return off
  }, [])
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const picker = React.useRef<HTMLInputElement>(null)
  const run = (pending: Promise<void>) => {
    setBusy(true)
    setError(null)
    // The settings row reports a refused upload or removal; the stored image remains (D12).
    pending.then(() => setBusy(false), (reason: { message?: string }) => {
      setBusy(false)
      setError(messages.failed(reason?.message ?? String(reason)))
    })
  }
  const pick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file === undefined) return
    if (BRAND_IMAGE_TYPES[file.type] === undefined) {
      setError(messages.type)
      return
    }
    if (file.size > BRAND_IMAGE_MAX_BYTES) {
      setError(messages.size)
      return
    }
    run(uploadBrandImage(kind, file))
  }
  return {
    image: images[kind],
    busy,
    error,
    picker,
    pick,
    open: () => picker.current?.click(),
    remove: () => run(removeBrandImage(kind)),
  }
}
