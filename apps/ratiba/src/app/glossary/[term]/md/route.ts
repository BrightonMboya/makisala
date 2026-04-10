import { getGlossaryTerm, getAllGlossaryTermSlugs } from '@/lib/glossary';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return getAllGlossaryTermSlugs().map((term) => ({ term }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ term: string }> },
) {
  const { term } = await params;
  const data = getGlossaryTerm(term);

  if (!data) {
    return new Response('Not found', { status: 404 });
  }

  const md = renderMarkdown(data);

  return new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}

function renderMarkdown(data: ReturnType<typeof getGlossaryTerm> & object): string {
  const { term, fullName, definition, details, howRatibaHelps, relatedTerms } = data;

  const relatedSection = relatedTerms
    .map((t) => `- [${t}](/glossary/${t}.md)`)
    .join('\n');

  return `# ${fullName} (${term})

## Definition

${definition}

## Details

${details}

## How Ratiba helps

${howRatibaHelps}

## Related terms

${relatedSection}

---

Ratiba is a proposal and itinerary platform built for safari operators and tour companies. Start free at https://ratiba.app
`;
}
