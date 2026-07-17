import path from 'node:path';
import { Font } from '@react-pdf/renderer';

/**
 * @react-pdf/renderer needs real font files and can't use `next/font`, which only
 * emits CSS + woff2. The app's two families are vendored here as static TTFs, one
 * file per weight, since react-pdf can't instance a variable font.
 *
 * They're read off disk at render time, so they must survive Next's output trace:
 * `outputFileTracingIncludes` in next.config.ts pins this directory. Without it
 * react-pdf throws ENOENT on the first glyph it lays out rather than falling back
 * to Helvetica, so a dropped font file fails the render outright: a 500 on the
 * download, and an email that sends with no attachment.
 */
const FONT_DIR = path.join(process.cwd(), 'src/lib/pdf/proposal/fonts');

const file = (name: string) => path.join(FONT_DIR, name);

let registered = false;

/**
 * Idempotent: Font.register mutates a module-level store in react-pdf, and
 * re-registering the same family on a warm lambda throws.
 */
export function registerProposalFonts(): void {
  if (registered) return;
  registered = true;

  Font.register({
    family: 'Outfit',
    fonts: [
      { src: file('Outfit-Regular.ttf'), fontWeight: 400 },
      { src: file('Outfit-Medium.ttf'), fontWeight: 500 },
      { src: file('Outfit-SemiBold.ttf'), fontWeight: 600 },
      { src: file('Outfit-Bold.ttf'), fontWeight: 700 },
    ],
  });

  Font.register({
    family: 'Inter',
    fonts: [
      { src: file('Inter-Regular.ttf'), fontWeight: 400 },
      { src: file('Inter-Medium.ttf'), fontWeight: 500 },
      { src: file('Inter-SemiBold.ttf'), fontWeight: 600 },
      { src: file('Inter-Bold.ttf'), fontWeight: 700 },
    ],
  });

  // Proposal copy is full of place names, and react-pdf's default hyphenation
  // splits them mid-word. A ragged right edge beats "Ngoron-goro".
  Font.registerHyphenationCallback((word) => [word]);
}
