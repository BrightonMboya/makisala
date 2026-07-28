// x-vercel-ip-city can arrive as a malformed % sequence (or be spoofed on a
// request that never touched Vercel's edge); decodeURIComponent throws on
// that, which would otherwise take down the whole request. Fall back to the
// raw value instead of failing.
export function decodeCityHeader(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
