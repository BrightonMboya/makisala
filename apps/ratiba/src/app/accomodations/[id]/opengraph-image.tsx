import { ImageResponse } from 'next/og';
import { createServerCaller } from '@/server/trpc/caller';
import { getPublicUrl } from '@/lib/storage';

export const size = { width: 1200, height: 630 };

const cormorantBold = fetch(
  'https://fonts.gstatic.com/s/cormorantgaramond/v21/co3umX5slCNuHLi8bLeY9MK7whWMhyjypVO7abI26QOD_hg9GnM.ttf',
).then((res) => res.arrayBuffer());

// Proxy through wsrv.nl to convert any image (AVIF, WebP, etc.) to JPEG for next/og
function toOgSafeUrl(url: string, w = 1200, h = 630): string {
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=jpg&q=60&w=${w}&h=${h}&fit=cover`;
}

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trpc = await createServerCaller();
  const acc = await trpc.accommodations.getById({ id });

  if (!acc) {
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
        Accommodation not found
      </div>,
      { ...size },
    );
  }

  const firstImage = acc.images[0];
  const heroImage = firstImage
    ? toOgSafeUrl(getPublicUrl(firstImage.bucket, firstImage.key))
    : null;

  const details: string[] = [];
  if (acc.country) details.push(acc.country);

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
            ? 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.15) 100%)'
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
          justifyContent: 'flex-end',
          padding: '48px 56px',
        }}
      >
        {/* Name */}
        <div
          style={{
            color: '#ffffff',
            fontSize: 56,
            fontFamily: 'Cormorant Garamond',
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: '85%',
            display: 'flex',
            flexWrap: 'wrap',
          }}
        >
          {acc.name}
        </div>

        {/* Details row */}
        {details.length > 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
            }}
          >
            {details.map((detail, i) => (
              <span
                key={i}
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 24,
                  fontWeight: 400,
                }}
              >
                {detail}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: 'Cormorant Garamond',
          data: await cormorantBold,
          style: 'normal',
          weight: 700,
        },
      ],
    },
  );
}
