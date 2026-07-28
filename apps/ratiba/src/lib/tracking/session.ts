// Anonymous per-visitor cookie so repeat views of a shared proposal/invoice
// link can be grouped. Never tied to an account - purely a random id.
export const VIEW_SESSION_COOKIE = 'rtba_vid';
const VIEW_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function viewSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: VIEW_SESSION_MAX_AGE_SECONDS,
  };
}
