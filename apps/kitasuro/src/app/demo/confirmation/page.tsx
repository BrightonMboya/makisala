'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function ConfirmationPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth * 2;
      canvas.height = window.innerHeight * 2;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    };

    resize();
    window.addEventListener('resize', resize);

    const blobs = [
      { x: 0.3, y: 0.3, r: 0.35, color: [180, 140, 80], speed: 0.0003, phase: 0 },
      { x: 0.7, y: 0.6, r: 0.3, color: [210, 180, 130], speed: 0.0004, phase: 1.5 },
      { x: 0.5, y: 0.2, r: 0.25, color: [160, 115, 55], speed: 0.00035, phase: 3 },
      { x: 0.2, y: 0.7, r: 0.3, color: [230, 210, 175], speed: 0.00025, phase: 4.5 },
      { x: 0.8, y: 0.3, r: 0.28, color: [200, 165, 100], speed: 0.00045, phase: 2 },
      { x: 0.5, y: 0.8, r: 0.32, color: [245, 235, 215], speed: 0.0002, phase: 5.5 },
    ];

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Base fill
      ctx.fillStyle = '#F8F7F5';
      ctx.fillRect(0, 0, w, h);

      for (const blob of blobs) {
        const bx = (blob.x + Math.sin(time * blob.speed * 6 + blob.phase) * 0.12) * w;
        const by = (blob.y + Math.cos(time * blob.speed * 5 + blob.phase * 0.7) * 0.1) * h;
        const br = blob.r * Math.min(w, h);

        const gradient = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        const [r, g, b] = blob.color;
        gradient.addColorStop(0, `rgba(${r},${g},${b},0.6)`);
        gradient.addColorStop(0.5, `rgba(${r},${g},${b},0.2)`);
        gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      }

      time++;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div
      className="relative flex min-h-screen flex-col"
      style={{ backgroundColor: '#F8F7F5', color: '#261B07' }}
    >
      {/* Navbar */}
      <nav
        className="relative z-10 flex items-center justify-between border-b px-6 backdrop-blur-md lg:px-12"
        style={{
          paddingBlock: '12px',
          borderColor: 'rgba(38,27,7,0.06)',
          backgroundColor: 'rgba(248,247,245,0.85)',
        }}
      >
        <Link href="/" className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ backgroundColor: '#261B07' }}
          >
            <span
              className="text-sm font-bold leading-none"
              style={{ color: '#F8F7F5' }}
            >
              R
            </span>
          </div>
          <span
            style={{
              fontWeight: 600,
              letterSpacing: '-0.3px',
              color: '#261B07',
              fontSize: '16px',
            }}
          >
            Ratiba
          </span>
        </Link>

        <div className="flex items-center" style={{ gap: '24px' }}>
          <Link
            href="/#features"
            className="hidden text-sm transition-opacity hover:opacity-70 sm:inline"
            style={{ color: '#261B07', fontWeight: 580 }}
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="hidden text-sm transition-opacity hover:opacity-70 sm:inline"
            style={{ color: '#261B07', fontWeight: 580 }}
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="hidden text-sm transition-opacity hover:opacity-70 sm:inline"
            style={{ color: '#261B07', fontWeight: 580 }}
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Shader background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ filter: 'blur(80px) saturate(1.2)' }}
      />

      {/* Grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          opacity: 0.3,
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Centered content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div
          className="flex flex-col items-center"
          style={{ maxWidth: '700px', gap: '24px' }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: 492,
              lineHeight: '13.5px',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              color: '#261B07',
            }}
          >
            Thank you for signing up
          </span>

          <h1
            style={{
              fontSize: 'clamp(40px, 6vw, 72px)',
              fontWeight: 584,
              lineHeight: '1',
              letterSpacing: '-1.44px',
              color: '#261B07',
            }}
          >
            Check your inbox for next steps
          </h1>

          <Link
            href="/proposal/tjksu"
            className="transition-opacity hover:opacity-90"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 24px',
              backgroundColor: '#261B07',
              color: '#F8F7F5',
              fontSize: '14px',
              fontWeight: 584,
              lineHeight: '14px',
              letterSpacing: '-0.14px',
              borderRadius: '8px',
              marginTop: '8px',
            }}
          >
            See a sample proposal
          </Link>
        </div>
      </div>
    </div>
  );
}
