import { env } from '@/lib/env';
import { log } from '@/lib/logger';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'qwen/qwen3-32b';

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

export async function translateProposalContent(
  content: TranslatableContent,
  targetLanguage: string,
): Promise<TranslatedContent> {
  const prompt = `You are a professional travel proposal translator. Translate the following travel proposal content from English to ${targetLanguage}.

Rules:
- Translate all text naturally for a travel context
- Keep proper nouns (hotel names, park names, city names) in their original form unless they have a well-known local name
- Preserve the exact JSON structure
- Do not translate IDs or numeric values

Input JSON:
${JSON.stringify(content, null, 2)}

Return ONLY raw valid JSON (no markdown, no code fences, no explanation) with the exact same structure as the input.`;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 16384,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    log.error('Groq translation failed', { status: response.status, error });
    throw new Error(`Translation API failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('Empty response from translation API');
  }

  // Strip thinking tags (Qwen3 includes <think>...</think> before the answer)
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  // Extract JSON from response - model may wrap it in markdown code blocks
  // Closing fence may be missing if response was truncated
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/);
  const jsonStr = jsonMatch ? jsonMatch[1]!.trim() : cleaned;

  try {
    return JSON.parse(jsonStr) as TranslatedContent;
  } catch {
    log.error('Failed to parse translation JSON', {
      responsePreview: jsonStr.slice(0, 500),
    });
    throw new Error('Translation returned invalid JSON');
  }
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
