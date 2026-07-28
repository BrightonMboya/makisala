export interface ParsedUserAgent {
  device: 'mobile' | 'tablet' | 'desktop' | null;
  browser: string | null;
}

export function parseUserAgent(ua: string | null): ParsedUserAgent {
  if (!ua) return { device: null, browser: null };

  let device: ParsedUserAgent['device'] = 'desktop';
  if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    device = 'tablet';
  } else if (/Mobi|iPhone|Android/i.test(ua)) {
    device = 'mobile';
  }

  let browser: string | null = null;
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/CriOS/i.test(ua)) browser = 'Chrome';
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome';
  else if (/FxiOS/i.test(ua)) browser = 'Firefox';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && /Version\//i.test(ua)) browser = 'Safari';
  else if (/MSIE|Trident/i.test(ua)) browser = 'Internet Explorer';

  return { device, browser };
}

/**
 * Link-preview crawlers (WhatsApp/Slack/iMessage unfurling, uptime checks,
 * scripts) hit these URLs too, and would otherwise inflate "view" counts.
 * Absence of a UA is treated as a bot: real browsers always send one.
 */
export function isLikelyBot(ua: string | null): boolean {
  if (!ua) return true;
  return /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|preview|headless|curl|wget|python-requests|axios|go-http-client/i.test(
    ua,
  );
}
