import { getCompetitor, getAllCompetitorSlugs } from '@/lib/competitors';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return getAllCompetitorSlugs().map((slug) => ({ slug }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const data = getCompetitor(slug);

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

function renderMarkdown(data: ReturnType<typeof getCompetitor> & object): string {
  const { name, tagline, reasons, features, pricing, faqs } = data;

  const featureRows = features
    .map(
      (f) =>
        `| ${f.name} | ${f.ratiba ? '✓' : '✗'} | ${f.competitor ? '✓' : '✗'} |`,
    )
    .join('\n');

  const reasonsSection = reasons
    .map((r) => `### ${r.number}. ${r.title}\n\n${r.description}`)
    .join('\n\n');

  const pricingSection = pricing
    .map((tier) => {
      const highlights = tier.highlights.map((h) => `- ${h}`).join('\n');
      return `### ${tier.plan}\n\n- **Ratiba:** ${tier.ratibaPrice}\n- **${name}:** ${tier.competitorPrice}\n\n${highlights}`;
    })
    .join('\n\n');

  const faqSection = faqs
    .map((f) => `### ${f.question}\n\n${f.answer}`)
    .join('\n\n');

  return `# Ratiba vs ${name}

${tagline}

## Why choose Ratiba over ${name}

${reasonsSection}

## Feature comparison

| Feature | Ratiba | ${name} |
|---------|--------|---------|
${featureRows}

## Pricing comparison

${pricingSection}

## Frequently asked questions

${faqSection}

---

Ratiba is a proposal and itinerary platform built for East African safari operators. Start free at https://ratiba.app
`;
}
