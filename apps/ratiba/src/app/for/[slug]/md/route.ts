import { getUseCase, getAllUseCaseSlugs } from '@/lib/use-cases';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return getAllUseCaseSlugs().map((slug) => ({ slug }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const data = getUseCase(slug);

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

function renderMarkdown(data: ReturnType<typeof getUseCase> & object): string {
  const { headline, subtitle, painPoints, solutions, features, faqs } = data;

  const painPointsSection = painPoints
    .map((p) => `### ${p.title}\n\n${p.description}`)
    .join('\n\n');

  const solutionsSection = solutions
    .map((s) => `### ${s.title}\n\n${s.description}`)
    .join('\n\n');

  const featuresSection = features.map((f) => `- ${f}`).join('\n');

  const faqSection = faqs
    .map((f) => `### ${f.question}\n\n${f.answer}`)
    .join('\n\n');

  return `# ${headline}

${subtitle}

## Pain points

${painPointsSection}

## How Ratiba solves this

${solutionsSection}

## Key features

${featuresSection}

## Frequently asked questions

${faqSection}

---

Ratiba is a proposal and itinerary platform built for safari operators and tour companies. Start free at https://ratiba.app
`;
}
