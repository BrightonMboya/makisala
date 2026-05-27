import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Ratiba Docs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background: '#F8F7F5',
          fontFamily: 'system-ui',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '14px',
              background: '#261B07',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F8F7F5',
              fontSize: '40px',
              fontWeight: 700,
            }}
          >
            R
          </div>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 600,
              color: '#261B07',
              letterSpacing: '-0.5px',
            }}
          >
            Ratiba Docs
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div
            style={{
              fontSize: '72px',
              fontWeight: 600,
              color: '#261B07',
              letterSpacing: '-1.5px',
              lineHeight: 1.05,
              maxWidth: '900px',
            }}
          >
            Build itineraries, price safaris, send proposals.
          </div>
          <div
            style={{
              fontSize: '28px',
              color: 'rgba(38, 27, 7, 0.6)',
              maxWidth: '900px',
            }}
          >
            Documentation for the safari operator OS.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '22px',
            color: 'rgba(38, 27, 7, 0.5)',
          }}
        >
          <div>docs.ratiba.io</div>
          <div>ratiba.io</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
