import { env } from './env';

// Platform-level sender for system mail (verification, invites, internal
// notifications). RESEND_FROM_EMAIL is required per app, so there is no
// cross-brand fallback: a misconfigured deployment fails at boot rather than
// silently sending from the wrong domain.
export function platformFromAddress(): string {
  return env.RESEND_FROM_EMAIL;
}

// Org sender addresses ride the same verified domain as the platform sender,
// e.g. notifications@ratiba.io -> ratiba.io.
function mailDomain(): string {
  const from = env.RESEND_FROM_EMAIL;
  return from.slice(from.indexOf('@') + 1);
}

function sanitizeLocalPart(slug?: string | null): string {
  if (!slug) return '';
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '')
    .slice(0, 64);
}

export interface OrgSender {
  name?: string | null;
  slug?: string | null;
}

export function orgFromAddress(org: OrgSender): string {
  const localPart = sanitizeLocalPart(org.slug);
  if (!localPart) return platformFromAddress();

  const address = `${localPart}@${mailDomain()}`;
  const name = org.name?.trim();
  return name ? `${name} <${address}>` : address;
}
