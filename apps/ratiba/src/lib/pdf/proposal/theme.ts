/**
 * Design tokens for the proposal PDF. Everything visual resolves through here so
 * the document can be re-skinned per operator later: `organizations` has no brand
 * colour column today, so every proposal gets `defaultPalette`. When that column
 * lands, build a palette with `paletteFromAccent` and pass it to renderProposalPdf.
 * No page component should hardcode a hex.
 */

export interface PdfPalette {
  /** Dominant brand colour: header bars, day labels, footers, rules. */
  brand: string;
  /** Darker brand, for text on brand tints and for the deep cover bar. */
  brandDeep: string;
  /** Washed brand, for sidebar panels and table zebra. */
  brandTint: string;
  /** Page background. */
  paper: string;
  /** Warm off-white for panels that need to separate from `paper`. */
  paperWarm: string;
  /** Primary text. */
  ink: string;
  /** Body copy: softer than `ink` so long paragraphs don't vibrate. */
  body: string;
  /** Labels, captions, metadata. */
  muted: string;
  /** Rules and borders. */
  hairline: string;
  /** Text placed on `brand`/`brandDeep` fills. */
  onBrand: string;
}

/**
 * Warm stone neutrals with a single clay accent. The neutrals are deliberately
 * low-chroma: proposal pages are dominated by wildlife photography, and a tinted
 * page fights the images.
 */
export const defaultPalette: PdfPalette = {
  brand: '#7A5540',
  brandDeep: '#4E3527',
  brandTint: '#EFE7DF',
  paper: '#FFFFFF',
  paperWarm: '#FAF7F3',
  ink: '#1C1A17',
  body: '#4A453E',
  muted: '#8A8279',
  hairline: '#E4DDD4',
  onBrand: '#FFFFFF',
};

/** A4 in PostScript points — react-pdf's unit for every numeric style value. */
export const PAGE = {
  width: 595.28,
  height: 841.89,
  /** Side gutter. Full-bleed blocks opt out by using negative margins. */
  marginX: 46,
  marginTop: 44,
  /** Leaves room for the fixed footer without content colliding with it. */
  marginBottom: 46,
  footerHeight: 30,
} as const;

/** Usable width between the gutters. Every column math starts from this. */
export const CONTENT_WIDTH = PAGE.width - PAGE.marginX * 2;

/**
 * Lodge photo tiles: two per row, this tall. Shared by the day gallery and the
 * alternatives strip so a lodge's photos are the same size wherever they appear;
 * a client comparing a swap against the booked lodge is comparing the pictures.
 */
export const PHOTO_TILE = { columns: 2, height: 130 } as const;

/** Type scale in points. */
export const TYPE = {
  cover: 30,
  display: 23,
  h1: 16,
  h2: 11,
  h3: 9.5,
  body: 8.6,
  small: 7.6,
  label: 7.2,
  micro: 6.4,
} as const;

export const LEADING = {
  tight: 1.15,
  snug: 1.35,
  body: 1.55,
} as const;

export const FONT = {
  display: 'Outfit',
  body: 'Inter',
} as const;

export const SPACE = {
  xs: 3,
  sm: 6,
  md: 12,
  lg: 20,
  xl: 32,
} as const;
