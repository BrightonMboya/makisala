import { NextResponse, type NextRequest } from 'next/server';

const MARKDOWN_ENABLED_PREFIXES = ['/features', '/compare/', '/for/', '/glossary/'];
const AUTH_PROTECTED_PREFIXES = ['/onboarding', '/dashboard', '/itineraries'];

function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const parts = accept.split(',').map(p => p.trim().toLowerCase());
  let markdownQ = 0;
  let htmlQ = 0;
  for (const part of parts) {
    const [type, ...params] = part.split(';').map(s => s.trim());
    const q = Number(params.find(p => p.startsWith('q='))?.slice(2) ?? '1');
    if (type === 'text/markdown') markdownQ = Math.max(markdownQ, q);
    else if (type === 'text/html' || type === 'application/xhtml+xml')
      htmlQ = Math.max(htmlQ, q);
  }
  return markdownQ > 0 && markdownQ >= htmlQ;
}

function hasMarkdownVariant(pathname: string): boolean {
  if (pathname.endsWith('.md') || pathname.endsWith('/md')) return false;
  return MARKDOWN_ENABLED_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(prefix)
  );
}

function isAuthProtected(pathname: string): boolean {
  return AUTH_PROTECTED_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAuthProtected(pathname)) {
    // Lightweight cookie check — no DB/network call.
    // Full session validation happens client-side via useSession() in the layout.
    // In production (HTTPS), Better Auth prefixes cookies with __Secure-
    const hasSession =
      request.cookies.has('better-auth.session_token') ||
      request.cookies.has('__Secure-better-auth.session_token');

    if (!hasSession) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  if (prefersMarkdown(request.headers.get('accept')) && hasMarkdownVariant(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/\/?$/, '/md');
    const response = NextResponse.rewrite(url);
    response.headers.set('Vary', 'Accept');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/onboarding/:path*',
    '/dashboard/:path*',
    '/itineraries/:path*',
    '/features',
    '/compare/:slug',
    '/for/:slug',
    '/glossary/:term',
  ],
};
