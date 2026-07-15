import { Star, Instagram, Facebook } from 'lucide-react';
import type { ReviewLinkInfo, SocialLinksInfo } from '@/types/itinerary-types';
import { SAFARIBOOKINGS_LOGO } from './safaribookings-logo';

/**
 * Trust & social block shown at the end of a proposal, alongside the
 * "About agency" copy. Renders the agency's review-platform badges (Google,
 * SafariBookings, Tripadvisor) and links to their social profiles.
 *
 * Themes vary between light and dark surfaces, so colours are driven by the
 * `variant` prop rather than hard-coded. The component renders nothing when the
 * agency has connected neither reviews nor socials, so themes can drop it in
 * unconditionally.
 */

const PLATFORM_LABELS: Record<ReviewLinkInfo['platform'], string> = {
  google: 'Google',
  safaribookings: 'SafariBookings',
  tripadvisor: 'Tripadvisor',
};

// Brand marks are inlined as SVG so they render identically on the web and in the
// generated PDF (no external requests). Google and Tripadvisor use their official
// marks; SafariBookings has no public SVG, so we use a green "SB" monogram chip.

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function TripAdvisorLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#34E0A1" aria-hidden="true">
      <path d="M12.006 4.295c-2.67 0-5.338.784-7.645 2.353H0l1.963 2.135a5.997 5.997 0 0 0 4.04 10.43 5.976 5.976 0 0 0 4.075-1.6L12 19.705l1.922-2.09a5.972 5.972 0 0 0 4.072 1.598 6 6 0 0 0 6-5.998 5.982 5.982 0 0 0-1.957-4.432L24 6.648h-4.35a13.573 13.573 0 0 0-7.644-2.353zM12 6.255c1.531 0 3.063.303 4.504.902A6.008 6.008 0 0 0 11.998 12a6.008 6.008 0 0 0-4.502-4.843A11.6 11.6 0 0 1 12 6.255zM6.002 9.157a3.997 3.997 0 0 1 3.996 3.998A3.995 3.995 0 0 1 6.005 17.15a3.998 3.998 0 0 1-.003-7.994zm11.996 0a3.997 3.997 0 0 1 3.997 3.998 3.995 3.995 0 0 1-3.994 3.995 3.998 3.998 0 0 1-.003-7.994zm-11.995 1.9a2.096 2.096 0 1 0 .001 4.193 2.096 2.096 0 0 0 0-4.193zm11.994 0a2.096 2.096 0 1 0 .002 4.192 2.096 2.096 0 0 0-.002-4.192z" />
    </svg>
  );
}

function SafariBookingsLogo({ className }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- data URI, no next/image needed
  return <img src={SAFARIBOOKINGS_LOGO} alt="" className={`object-contain ${className ?? ''}`} />;
}

function PlatformLogo({ platform, className }: { platform: ReviewLinkInfo['platform']; className?: string }) {
  if (platform === 'google') return <GoogleLogo className={className} />;
  if (platform === 'tripadvisor') return <TripAdvisorLogo className={className} />;
  return <SafariBookingsLogo className={className} />;
}

// Order the social links render in, so the row is stable regardless of the
// order the agency saved them in.
const SOCIAL_ORDER: Array<keyof SocialLinksInfo> = ['instagram', 'tiktok', 'facebook'];

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1-2.59-2.59 2.59 2.59 0 0 1 3.44-2.44V9.7a5.66 5.66 0 0 0-.85-.06A5.68 5.68 0 0 0 4.2 15.3 5.68 5.68 0 0 0 9.85 21a5.68 5.68 0 0 0 5.68-5.68V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.23-1.48z" />
    </svg>
  );
}

function StarRating({ rating, filledClass, emptyClass }: { rating: number; filledClass: string; emptyClass: string }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= rounded ? filledClass : emptyClass}`}
          fill={i <= rounded ? 'currentColor' : 'none'}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

/** Whether the agency has any review or social content worth rendering a section for. */
export function hasAgencyTrust(org?: {
  reviewLinks?: ReviewLinkInfo[] | null;
  socialLinks?: SocialLinksInfo | null;
} | null): boolean {
  const hasReviews = (org?.reviewLinks ?? []).some((r) => r?.url);
  const hasSocials = SOCIAL_ORDER.some((key) => Boolean(org?.socialLinks?.[key]?.trim()));
  return hasReviews || hasSocials;
}

interface AgencyTrustProps {
  reviewLinks?: ReviewLinkInfo[] | null;
  socialLinks?: SocialLinksInfo | null;
  variant?: 'light' | 'dark';
  className?: string;
}

export function AgencyTrust({ reviewLinks, socialLinks, variant = 'light', className }: AgencyTrustProps) {
  const reviews = (reviewLinks ?? []).filter((r) => r?.url);
  const socials = SOCIAL_ORDER.map((key) => ({ key, url: socialLinks?.[key]?.trim() })).filter(
    (s): s is { key: keyof SocialLinksInfo; url: string } => Boolean(s.url),
  );

  if (reviews.length === 0 && socials.length === 0) return null;

  const dark = variant === 'dark';
  const heading = dark ? 'text-white/50' : 'text-stone-400';
  const label = dark ? 'text-white/90' : 'text-stone-800';
  const muted = dark ? 'text-white/50' : 'text-stone-500';
  const rowBorder = dark ? 'border-white/10' : 'border-stone-200';
  const socialColor = dark
    ? 'text-white/60 hover:text-white'
    : 'text-stone-400 hover:text-stone-900';
  const starFilled = 'text-amber-400';
  const starEmpty = dark ? 'text-white/20' : 'text-stone-300';

  return (
    <div className={className}>
      {reviews.length > 0 && (
        <div>
          <p className={`mb-4 text-[10px] font-bold tracking-[0.3em] uppercase ${heading}`}>
            Reviewed on
          </p>
          <ul className="space-y-3">
            {reviews.map((review, i) => (
              <li key={`${review.platform}-${i}`}>
                <a
                  href={review.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${rowBorder} ${
                    dark ? 'hover:bg-white/5' : 'hover:bg-stone-50'
                  }`}
                >
                  <PlatformLogo platform={review.platform} className="h-5 w-5 shrink-0" />
                  <span className={`text-sm font-medium ${label}`}>
                    {PLATFORM_LABELS[review.platform]}
                  </span>
                  {(review.rating != null || review.reviewCount != null) && (
                    <span className="ml-auto flex items-center gap-2">
                      {review.rating != null && (
                        <StarRating
                          rating={review.rating}
                          filledClass={starFilled}
                          emptyClass={starEmpty}
                        />
                      )}
                      <span className={`text-xs ${muted}`}>
                        {review.rating != null && (
                          <span className="font-semibold">{review.rating.toFixed(1)}</span>
                        )}
                        {review.rating != null && review.reviewCount != null && ' · '}
                        {review.reviewCount != null && `${review.reviewCount} reviews`}
                      </span>
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {socials.length > 0 && (
        <div className={reviews.length > 0 ? 'mt-8' : ''}>
          <p className={`mb-3 text-[10px] font-bold tracking-[0.3em] uppercase ${heading}`}>
            Follow along
          </p>
          <div className="flex items-center gap-4">
            {socials.map(({ key, url }) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={key}
                className={`transition-colors ${socialColor}`}
              >
                {key === 'instagram' && <Instagram className="h-5 w-5" strokeWidth={1.5} />}
                {key === 'facebook' && <Facebook className="h-5 w-5" strokeWidth={1.5} />}
                {key === 'tiktok' && <TikTokIcon className="h-5 w-5" />}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
