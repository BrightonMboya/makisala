import { COMPETITORS, getAllCompetitorSlugs } from '@/lib/competitors';
import { USE_CASES, getAllUseCaseSlugs } from '@/lib/use-cases';
import { getAllGlossaryTerms } from '@/lib/glossary';
import { env } from '@/lib/env';

export const dynamic = 'force-static';

export async function GET() {
  const baseUrl = env.NEXT_PUBLIC_APP_URL;

  const compareLines = getAllCompetitorSlugs()
    .map((slug) => {
      const c = COMPETITORS[slug];
      if (!c) return null;
      return `- [Ratiba vs ${c.name}](${baseUrl}/compare/${slug}.md): ${c.excerpt}`;
    })
    .filter(Boolean)
    .join('\n');

  const useCaseLines = getAllUseCaseSlugs()
    .map((slug) => {
      const uc = USE_CASES[slug];
      if (!uc) return null;
      return `- [${uc.headline}](${baseUrl}/for/${slug}.md): ${uc.excerpt}`;
    })
    .filter(Boolean)
    .join('\n');

  const glossaryTerms = getAllGlossaryTerms();
  const glossaryLines = glossaryTerms
    .map((t) => `- [${t.fullName} (${t.term})](${baseUrl}/glossary/${t.slug}.md)`)
    .join('\n');

  const body = `# Ratiba

> Ratiba is a proposal and itinerary platform built specifically for safari operators and tour companies. It helps teams build interactive, mobile-optimized safari proposals that clients can view, comment on, and approve — replacing PDF quotes and Excel spreadsheets.

## Main pages

- [Ratiba homepage](${baseUrl}/): Overview of Ratiba, features, and use cases for safari operators
- [Pricing](${baseUrl}/pricing): Plans starting at $49/mo with flat-rate team pricing
- [Book a demo](${baseUrl}/demo): Schedule a live walkthrough with the Ratiba team

## Ratiba vs competitor comparisons

${compareLines}

## Features

- [Ratiba features](${baseUrl}/features.md): AI itinerary builder, live proposals, team collaboration, pricing engine, content library, and branded themes

## Use-case pages

${useCaseLines}

## Glossary

- [Safari industry glossary](${baseUrl}/glossary): Definitions of key safari and tour operator terms
${glossaryLines}

## About Ratiba

Ratiba is purpose-built for safari operators and tour companies worldwide. Unlike generic tour operator software (Tourwriter, Tourplan, Travefy) or content-first platforms (Wetu, Safari Portal), Ratiba focuses on the full workflow safari operators actually use: drag-and-drop day-by-day itinerary building with accommodations and game drives, automated multi-currency costing, live interactive proposals with client comments, and flat pricing that does not penalize growing teams.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
