import { env } from '@/lib/env';
import { log } from '@/lib/logger';

// Google Cloud Translation v2 (plain NMT model, API-key auth). Used for proposal
// translation: we send flat arrays of strings and map the results back by index.
const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';
// v2 allows up to 128 segments per request; cap segments and per-request chars well
// under the limits so a big proposal is split into a handful of small requests.
const MAX_SEGMENTS_PER_BATCH = 100;
const MAX_CHARS_PER_BATCH = 9000;

// Groq is still used for day-copy generation (generateDayCopy), not translation.
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'qwen/qwen3.6-27b';

export interface TranslatableContent {
  tourTitle?: string | null;
  tourType?: string | null;
  pickupPoint?: string | null;
  inclusions?: string[];
  exclusions?: string[];
  extras?: Array<{ id: string; name: string }>;
  days: Array<{
    dayNumber: number;
    title?: string | null;
    description?: string | null;
    activities: Array<{
      name: string;
      description?: string | null;
      location?: string | null;
    }>;
    transportation?: Array<{
      id: string;
      notes?: string | null;
    }>;
  }>;
  accommodations: Array<{
    id: string;
    name: string;
    overview?: string | null;
    description?: string | null;
  }>;
}

export interface TranslatedContent {
  tourTitle?: string;
  tourType?: string;
  pickupPoint?: string;
  inclusions?: string[];
  exclusions?: string[];
  extras?: Array<{ id: string; name: string }>;
  days: Array<{
    dayNumber: number;
    title?: string;
    description?: string;
    activities: Array<{
      name: string;
      description?: string;
      location?: string;
    }>;
    transportation?: Array<{
      id: string;
      notes?: string;
    }>;
  }>;
  accommodations: Array<{
    id: string;
    name: string;
    overview?: string;
    description?: string;
  }>;
}

/** A single string to translate, paired with a setter that writes the result back. */
interface TranslationJob {
  text: string;
  set: (translated: string) => void;
}

/**
 * Translate every prose field of a proposal into `targetLanguage`.
 *
 * Rather than asking an LLM to round-trip the whole JSON (which blew past request
 * limits and truncated on long safaris), we flatten the proposal into a flat list
 * of strings, translate them with Google Cloud Translation in batches, and write
 * each result back into the same structure by index. Proper nouns that read wrong
 * when translated (accommodation names) are left in the source language.
 */
export async function translateProposalContent(
  content: TranslatableContent,
  targetLanguage: string,
): Promise<TranslatedContent> {
  // Build the output shape up front (null -> undefined), then register a job for
  // every field we want translated. Setters mutate `out` in place.
  const out: TranslatedContent = {
    tourTitle: content.tourTitle ?? undefined,
    tourType: content.tourType ?? undefined,
    pickupPoint: content.pickupPoint ?? undefined,
    inclusions: [...(content.inclusions ?? [])],
    exclusions: [...(content.exclusions ?? [])],
    extras: (content.extras ?? []).map((e) => ({ id: e.id, name: e.name })),
    days: content.days.map((d) => ({
      dayNumber: d.dayNumber,
      title: d.title ?? undefined,
      description: d.description ?? undefined,
      activities: d.activities.map((a) => ({
        name: a.name,
        description: a.description ?? undefined,
        location: a.location ?? undefined,
      })),
      transportation: (d.transportation ?? []).map((t) => ({
        id: t.id,
        notes: t.notes ?? undefined,
      })),
    })),
    accommodations: content.accommodations.map((ac) => ({
      id: ac.id,
      name: ac.name, // proper noun: kept in the source language
      overview: ac.overview ?? undefined,
      description: ac.description ?? undefined,
    })),
  };

  const jobs: TranslationJob[] = [];
  const collect = (text: string | undefined, set: (v: string) => void) => {
    if (text && text.trim()) jobs.push({ text, set });
  };

  collect(out.tourTitle, (v) => (out.tourTitle = v));
  collect(out.tourType, (v) => (out.tourType = v));
  collect(out.pickupPoint, (v) => (out.pickupPoint = v));
  out.inclusions?.forEach((s, i) => collect(s, (v) => (out.inclusions![i] = v)));
  out.exclusions?.forEach((s, i) => collect(s, (v) => (out.exclusions![i] = v)));
  out.extras?.forEach((e) => collect(e.name, (v) => (e.name = v)));
  out.days.forEach((d) => {
    collect(d.title, (v) => (d.title = v));
    collect(d.description, (v) => (d.description = v));
    d.activities.forEach((a) => {
      collect(a.name, (v) => (a.name = v));
      collect(a.description, (v) => (a.description = v));
      collect(a.location, (v) => (a.location = v));
    });
    d.transportation?.forEach((t) => collect(t.notes, (v) => (t.notes = v)));
  });
  out.accommodations.forEach((ac) => {
    collect(ac.overview, (v) => (ac.overview = v));
    collect(ac.description, (v) => (ac.description = v));
  });

  if (jobs.length === 0) return out;

  const target = targetLanguage.trim().toLowerCase();

  // Split into batches bounded by both segment count and total characters.
  const batches: TranslationJob[][] = [];
  let current: TranslationJob[] = [];
  let currentChars = 0;
  for (const job of jobs) {
    const wouldOverflow =
      current.length >= MAX_SEGMENTS_PER_BATCH ||
      currentChars + job.text.length > MAX_CHARS_PER_BATCH;
    if (wouldOverflow && current.length > 0) {
      batches.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(job);
    currentChars += job.text.length;
  }
  if (current.length > 0) batches.push(current);

  for (const batch of batches) {
    const translated = await translateBatch(
      batch.map((j) => j.text),
      target,
    );
    translated.forEach((value, i) => batch[i]!.set(value));
  }

  return out;
}

/** Translate one batch of strings via Google Cloud Translation v2. Order-preserving. */
async function translateBatch(texts: string[], target: string): Promise<string[]> {
  const params = new URLSearchParams({ key: env.GOOGLE_TRANSLATE_API_KEY });
  const response = await fetch(`${GOOGLE_TRANSLATE_URL}?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: texts,
      source: 'en',
      target,
      format: 'text',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    log.error('Google Translate failed', { status: response.status, error });
    throw new Error(`Translation API failed: ${response.status}`);
  }

  const data = await response.json();
  const translations = data?.data?.translations;
  if (!Array.isArray(translations) || translations.length !== texts.length) {
    log.error('Unexpected translation API response', {
      expected: texts.length,
      received: Array.isArray(translations) ? translations.length : 'not-array',
    });
    throw new Error('Translation API returned an unexpected response');
  }

  return translations.map((t: { translatedText?: string }) =>
    decodeHtmlEntities(t.translatedText ?? ''),
  );
}

/**
 * Google Translate re-encodes a handful of characters as HTML entities even with
 * format=text. Decode the common ones so stored copy is clean plain text.
 */
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** Extract translatable fields from a full proposal query result */
export function extractTranslatableContent(proposal: {
  tourTitle?: string | null;
  tourType?: string | null;
  pickupPoint?: string | null;
  inclusions?: string[] | null;
  exclusions?: string[] | null;
  extras?: Array<{ id: string; name: string; price: number; selected: boolean }> | null;
  days?: Array<{
    dayNumber: number;
    title?: string | null;
    description?: string | null;
    activities?: Array<{
      name: string;
      description?: string | null;
      location?: string | null;
    }>;
    accommodations?: Array<{
      accommodation: {
        id: string;
        name: string;
        overview?: string | null;
        description?: string | null;
      };
    }>;
    transportation?: Array<{
      id: string;
      notes?: string | null;
    }>;
  }>;
}): TranslatableContent {
  const days = (proposal.days || []).map((day) => ({
    dayNumber: day.dayNumber,
    title: day.title,
    description: day.description,
    activities: (day.activities || []).map((a) => ({
      name: a.name,
      description: a.description,
      location: a.location,
    })),
    transportation: (day.transportation || []).map((t) => ({
      id: t.id,
      notes: t.notes,
    })),
  }));

  // Deduplicate accommodations across days
  const accommodationMap = new Map<
    string,
    { id: string; name: string; overview?: string | null; description?: string | null }
  >();
  (proposal.days || []).forEach((day) => {
    day.accommodations?.forEach(({ accommodation }) => {
      if (!accommodationMap.has(accommodation.id)) {
        accommodationMap.set(accommodation.id, {
          id: accommodation.id,
          name: accommodation.name,
          overview: accommodation.overview,
          description: accommodation.description,
        });
      }
    });
  });

  return {
    tourTitle: proposal.tourTitle,
    tourType: proposal.tourType,
    pickupPoint: proposal.pickupPoint,
    inclusions: proposal.inclusions || [],
    exclusions: proposal.exclusions || [],
    extras: (proposal.extras || []).map((e) => ({ id: e.id, name: e.name })),
    days,
    accommodations: Array.from(accommodationMap.values()),
  };
}

/** Generate a short travel copy description for a day in the itinerary */
export async function generateDayCopy(context: {
  destinationName: string;
  dayNumber: number;
  activities: Array<{ name: string; location?: string }>;
  accommodationName?: string | null;
  tourType?: string;
}): Promise<string> {
  const activityList = context.activities.map((a) => a.name).join(', ');

  const prompt = `You are a travel copywriter for safari and adventure tour proposals. Write exactly 3 sentences describing Day ${context.dayNumber} of a trip.

Context:
- Destination: ${context.destinationName}
- Activities: ${activityList || 'general exploration'}
${context.accommodationName ? `- Accommodation: ${context.accommodationName}` : ''}
${context.tourType ? `- Tour type: ${context.tourType}` : ''}

Rules:
- Write warm, vivid travel copy that makes the reader excited about this day
- Exactly 3 sentences, no more
- Never use em-dashes. Use periods, commas, or colons instead
- Do not use generic filler phrases like "unforgettable experience" or "memories that last a lifetime"
- Be specific to the destination and activities
- Return only the 3 sentences, no headings, no formatting, no quotes`;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    log.error('Groq day copy generation failed', { status: response.status, error });
    throw new Error(`Day copy generation failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('Empty response from day copy generation');
  }

  // Strip thinking tags and clean up
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  // Remove any em-dashes that slipped through
  return cleaned.replace(/—/g, ',');
}
