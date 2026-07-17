import { type ReactNode } from 'react';
import {
  Defs,
  Image,
  LinearGradient,
  Page,
  Rect,
  Stop,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import { CONTENT_WIDTH, FONT, LEADING, PAGE, SPACE, TYPE } from './theme';
import { usePalette, usePdfDoc } from './scope';

/**
 * Every page archetype composes these; none should reach for a raw hex or font
 * name. Palette and images come from the render scope (scope.ts), not props.
 */

export { usePalette, usePdfDoc };

// ---------- photo ----------

const photoStyles = StyleSheet.create({
  wrap: { position: 'relative', overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  placeholder: { width: '100%', height: '100%' },
  tag: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingVertical: 2.5,
    paddingHorizontal: 5,
    borderRadius: 2,
  },
  tagText: { fontFamily: FONT.body, fontSize: TYPE.micro, fontWeight: 500 },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 3.5,
    paddingHorizontal: 6,
  },
  captionText: { fontFamily: FONT.body, fontSize: TYPE.micro },
});

export interface PhotoProps {
  /** Original image URL. Resolved through the document's ImageBook. */
  src?: string;
  style?: Style | Style[];
  /**
   * Defaults to 'cover' — photography fills its frame. Use 'contain' for logos,
   * which must not be cropped.
   */
  fit?: 'cover' | 'contain';
  /** Pill in the top-left corner, for a room or lodge name. */
  tag?: string;
  /** Bar across the bottom, for a location or scene caption. */
  caption?: string;
}

/**
 * Renders a flat tint when the image is missing from the book, so layout never
 * collapses around a failed fetch.
 */
export function Photo({ src, style, fit = 'cover', tag, caption }: PhotoProps) {
  const { images, palette } = usePdfDoc();
  const image = src ? images.get(src) : undefined;

  return (
    <View style={[photoStyles.wrap, ...(Array.isArray(style) ? style : [style ?? {}])]}>
      {image ? (
        <Image src={image} style={[photoStyles.img, { objectFit: fit }]} />
      ) : (
        <View style={[photoStyles.placeholder, { backgroundColor: palette.brandTint }]} />
      )}
      {tag ? (
        <View style={[photoStyles.tag, { backgroundColor: palette.paper }]}>
          <Text style={[photoStyles.tagText, { color: palette.ink }]}>{tag}</Text>
        </View>
      ) : null}
      {caption ? (
        <View style={[photoStyles.caption, { backgroundColor: palette.brandDeep }]}>
          <Text style={[photoStyles.captionText, { color: palette.onBrand }]}>{caption}</Text>
        </View>
      ) : null}
    </View>
  );
}

const logoStyles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    padding: 5,
    borderRadius: 2,
  },
});

/**
 * An operator's logo on a white chip. Plenty of uploaded logos are JPEGs with a
 * white background baked in rather than transparent PNGs, which read as a bug on a
 * tinted panel; a deliberate chip makes both kinds look intentional.
 */
export function LogoChip({
  src,
  width = 62,
  height = 30,
}: {
  src?: string;
  width?: number;
  height?: number;
}) {
  const palette = usePalette();
  if (!src) return null;
  return (
    <View style={[logoStyles.chip, { backgroundColor: palette.paper }]}>
      <Photo src={src} style={{ width, height }} fit="contain" />
    </View>
  );
}

/**
 * Bottom-up gradient scrim for display type on photography. A flat block reads as
 * a grey band; gradients aren't a style property in react-pdf, so this is a
 * stretched SVG rect.
 */
export function Scrim({
  height = '60%',
  color,
  opacity = 0.85,
}: {
  height?: string | number;
  color?: string;
  opacity?: number;
}) {
  const palette = usePalette();
  return (
    <Svg
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height }}
      viewBox="0 0 10 10"
      preserveAspectRatio="none"
    >
      <Defs>
        <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color ?? palette.brandDeep} stopOpacity={0} />
          <Stop offset="1" stopColor={color ?? palette.brandDeep} stopOpacity={opacity} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={10} height={10} fill="url(#scrim)" />
    </Svg>
  );
}

// ---------- page shell ----------

const pageStyles = StyleSheet.create({
  page: { fontFamily: FONT.body, position: 'relative' },
  body: { flexGrow: 1 },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: PAGE.marginX,
    right: PAGE.marginX,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: { fontFamily: FONT.body, fontSize: TYPE.micro },
  footerBrand: { fontFamily: FONT.body, fontSize: TYPE.micro, fontWeight: 600 },
});

export interface PdfPageProps {
  children: ReactNode;
  /** Set false for full-bleed pages that manage their own insets (cover, day intro). */
  padded?: boolean;
  /** Page background. Defaults to `paper`. */
  background?: string;
  footer?: boolean;
  style?: Style;
}

/**
 * The page shell. The footer uses react-pdf's `fixed` + `render` so page numbers
 * resolve at layout time, the only way to number pages when content decides how
 * many there are.
 */
export function PdfPage({
  children,
  padded = true,
  background,
  footer = true,
  style,
}: PdfPageProps) {
  const { palette, brandName } = usePdfDoc();

  return (
    <Page
      size="A4"
      style={[
        pageStyles.page,
        { backgroundColor: background ?? palette.paper },
        padded
          ? {
              paddingTop: PAGE.marginTop,
              paddingBottom: PAGE.marginBottom,
              paddingHorizontal: PAGE.marginX,
            }
          : { paddingBottom: PAGE.marginBottom },
        style ?? {},
      ]}
    >
      <View style={pageStyles.body}>{children}</View>

      {footer ? (
        <View style={pageStyles.footer} fixed>
          <Text
            style={[pageStyles.footerText, { color: palette.muted }]}
            render={({ pageNumber }) => `Page ${pageNumber}`}
          />
          <Text style={[pageStyles.footerBrand, { color: palette.brand }]}>{brandName}</Text>
        </View>
      ) : null}
    </Page>
  );
}

// ---------- type ----------

const textStyles = StyleSheet.create({
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  sectionRule: { width: 22, height: 1 },
  sectionText: {
    fontFamily: FONT.display,
    fontSize: TYPE.h2,
    fontWeight: 400,
    letterSpacing: 0.2,
  },
  display: { fontFamily: FONT.display, fontWeight: 700, lineHeight: LEADING.tight },
  h1: {
    fontFamily: FONT.display,
    fontSize: TYPE.h1,
    fontWeight: 600,
    lineHeight: LEADING.tight,
  },
  h3: { fontFamily: FONT.display, fontSize: TYPE.h3, fontWeight: 600 },
  label: {
    fontFamily: FONT.body,
    fontSize: TYPE.label,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: { fontFamily: FONT.body, fontSize: TYPE.body, lineHeight: LEADING.body },
  small: { fontFamily: FONT.body, fontSize: TYPE.small, lineHeight: LEADING.snug },
});

/** A short rule, then the section name. Anchors each page type to the same grid. */
export function SectionLabel({ children, onDark }: { children: ReactNode; onDark?: boolean }) {
  const palette = usePalette();
  const color = onDark ? palette.onBrand : palette.brand;
  return (
    <View style={textStyles.sectionLabel}>
      <View style={[textStyles.sectionRule, { backgroundColor: color }]} />
      <Text style={[textStyles.sectionText, { color }]}>{children}</Text>
    </View>
  );
}

export function DisplayTitle({
  children,
  size = TYPE.display,
  color,
  style,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  style?: Style;
}) {
  const palette = usePalette();
  return (
    <Text
      style={[textStyles.display, { fontSize: size, color: color ?? palette.ink }, style ?? {}]}
    >
      {children}
    </Text>
  );
}

export function Heading({ children, color }: { children: ReactNode; color?: string }) {
  const palette = usePalette();
  return <Text style={[textStyles.h1, { color: color ?? palette.ink }]}>{children}</Text>;
}

export function Subheading({ children, color }: { children: ReactNode; color?: string }) {
  const palette = usePalette();
  return <Text style={[textStyles.h3, { color: color ?? palette.ink }]}>{children}</Text>;
}

export function Label({ children, color }: { children: ReactNode; color?: string }) {
  const palette = usePalette();
  return <Text style={[textStyles.label, { color: color ?? palette.muted }]}>{children}</Text>;
}

export function Body({
  children,
  color,
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: Style;
}) {
  const palette = usePalette();
  return (
    <Text style={[textStyles.body, { color: color ?? palette.body }, style ?? {}]}>{children}</Text>
  );
}

export function Small({
  children,
  color,
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: Style;
}) {
  const palette = usePalette();
  return (
    <Text style={[textStyles.small, { color: color ?? palette.muted }, style ?? {}]}>
      {children}
    </Text>
  );
}

// ---------- small parts ----------

const partStyles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 2,
    borderWidth: 0.75,
  },
  badgeText: { fontFamily: FONT.body, fontSize: TYPE.micro, fontWeight: 500 },
  rule: { height: 0.75, width: '100%' },
  metaItem: { gap: 2 },
  bullet: { flexDirection: 'row', gap: SPACE.sm, alignItems: 'flex-start' },
  dot: { width: 2.5, height: 2.5, borderRadius: 1.25, marginTop: 4.5 },
  bulletBody: { flex: 1 },
});

/** Outlined pill for a category, e.g. "Lodge", "Tented camp". */
export function Badge({ children }: { children: ReactNode }) {
  const palette = usePalette();
  return (
    <View style={[partStyles.badge, { borderColor: palette.hairline }]}>
      <Text style={[partStyles.badgeText, { color: palette.body }]}>{children}</Text>
    </View>
  );
}

export function Rule({ color, style }: { color?: string; style?: Style }) {
  const palette = usePalette();
  return (
    <View style={[partStyles.rule, { backgroundColor: color ?? palette.hairline }, style ?? {}]} />
  );
}

/** A label stacked over its value — the cover and pricing meta strips. */
export function MetaItem({
  label,
  value,
  onDark,
}: {
  label: string;
  value: ReactNode;
  onDark?: boolean;
}) {
  const palette = usePalette();
  return (
    <View style={partStyles.metaItem}>
      <Label color={onDark ? palette.onBrand : palette.muted}>{label}</Label>
      <Text
        style={[
          textStyles.small,
          { color: onDark ? palette.onBrand : palette.ink, fontWeight: 500 },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function Bullet({ children, color }: { children: ReactNode; color?: string }) {
  const palette = usePalette();
  return (
    <View style={partStyles.bullet}>
      <View style={[partStyles.dot, { backgroundColor: color ?? palette.brand }]} />
      <View style={partStyles.bulletBody}>
        <Body>{children}</Body>
      </View>
    </View>
  );
}

export { CONTENT_WIDTH, PAGE, SPACE, TYPE, FONT, LEADING };
