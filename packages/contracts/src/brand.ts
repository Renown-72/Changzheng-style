/**
 * The custom brand images both halves handle (D30): which images there are,
 * the formats and the size the host half takes, and the answer its status
 * route sends.
 */

/**
 * The images a reader can put in place of the skin's own art: the brand's mark
 * and wordmark, and the picture 长征姬 the mascot stands as in the window's corner.
 */
export type BrandImageKind = 'mark' | 'wordmark' | 'mascot'

export const BRAND_IMAGE_KINDS: readonly BrandImageKind[] = ['mark', 'wordmark', 'mascot']

/** Accepted content types, each with the extension the stored file carries. */
export const BRAND_IMAGE_TYPES: Readonly<Record<string, string>> = {
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
}

/** Largest image the host half stores: a brand mark is a few kilobytes, a mascot picture can be a large illustration. */
export const BRAND_IMAGE_MAX_BYTES = 8 * 1024 * 1024

/** One stored image: its content type, and a version that changes whenever its bytes do. */
export interface BrandImageState {
  type: string
  version: string
}

/** The status route's answer: each image, or null while the reader has none in place. */
export interface BrandAnswer {
  ok: true
  mark: BrandImageState | null
  wordmark: BrandImageState | null
  mascot: BrandImageState | null
}
