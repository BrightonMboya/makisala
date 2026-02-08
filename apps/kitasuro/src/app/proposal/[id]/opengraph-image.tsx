import { ImageResponse } from 'next/og';
import { getProposal } from '@/app/itineraries/actions';
import { format } from 'date-fns';

export const size = { width: 1200, height: 630 };

// Convert image URL to PNG via wsrv.nl proxy (next/og doesn't support WebP)
function toOgSafeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Use wsrv.nl to convert to PNG format
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=png`;
}

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proposal = await getProposal(id);

  if (!proposal) {
    return new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          color: '#ffffff',
          fontSize: 48,
        }}
      >
        Proposal not found
      </div>,
      { ...size },
    );
  }

  const title = proposal.tourTitle || proposal.name;
  const orgName = proposal.organization?.name;
  const logoUrl = toOgSafeUrl(proposal.organization?.logoUrl);
  const dayCount = proposal.days.length;
  const heroImage = toOgSafeUrl(proposal.heroImage);

  const details: string[] = [];
  if (dayCount > 0) details.push(`${dayCount} days`);
  if (proposal.tourType) details.push(proposal.tourType);
  if (proposal.countries?.length) details.push(proposal.countries.join(', '));

  const route =
    proposal.startCity && proposal.endCity && proposal.startCity !== proposal.endCity
      ? `${proposal.startCity} → ${proposal.endCity}`
      : proposal.startCity || proposal.endCity || null;

  const dateStr = proposal.startDate ? format(new Date(proposal.startDate), 'MMM d, yyyy') : null;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Background image or gradient */}
      {heroImage ? (
        <img
          src={heroImage}
          alt=""
          width={1200}
          height={630}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : null}

      {/* Dark overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          background: heroImage
            ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.3) 100%)'
            : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
        }}
      >
        {/* Top: Organization branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              width={48}
              height={48}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.3)',
              }}
            />
          ) : null}
          {orgName ? (
            <span
              style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}
            >
              {orgName}
            </span>
          ) : null}
        </div>

        {/* Bottom: Tour details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div
            style={{
              color: '#ffffff',
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.15,
              maxWidth: '85%',
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            {title}
          </div>

          {/* Details row */}
          {details.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {details.map((detail, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {i > 0 ? (
                    <span
                      style={{
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: 20,
                      }}
                    >
                      •
                    </span>
                  ) : null}
                  <span
                    style={{
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: 22,
                      fontWeight: 400,
                    }}
                  >
                    {detail}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {/* Route and date */}
          {route || dateStr ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {route ? (
                <span
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 20,
                  }}
                >
                  {route}
                </span>
              ) : null}
              {dateStr ? (
                <span
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 20,
                  }}
                >
                  {dateStr}
                </span>
              ) : null}
            </div>
          ) : null}

          {/* Client name badge */}
          {proposal.client?.name ? (
            <div style={{ display: 'flex', marginTop: '4px' }}>
              <span
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 18,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  backdropFilter: 'blur(4px)',
                }}
              >
                Prepared for {proposal.client.name}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
