# Ratiba SEO & LLM Visibility Plan

Last updated: 2026-04-07

## Current State

- **Google indexation**: Sitemap now lists 13+ pages (/, /features, /pricing, /demo, /about + 8 compare pages)
- **Competitors ranking**: SafariPortal, Tourwriter, Travefy, Tourplan, SafariOffice, TourConnect AI
- **Our angle**: Only itinerary builder built specifically for safari operators. Competitors are all generic global tools.
- **Cold email performance**: 0.3% reply rate (1/300+). SEO would bring warmer inbound leads.
- **Positioning update**: Removed "East Africa only" framing — Ratiba is for safari operators and tour companies worldwide

## Strategy

### Phase 1: Foundation (Weeks 1-4)
Get indexable pages live. Target long-tail keywords competitors aren't fighting over.

### Phase 2: Comparison & Alternative Pages (Weeks 5-8)
Capture buyers actively comparing tools. These convert the fastest.

### Phase 3: Use-Case & Industry Pages (Weeks 9-16)
Build topical authority around safari/tour operator workflows.

### Phase 4: Programmatic SEO (Weeks 17+)
Scale to hundreds of pages targeting "[tool] for [location/niche]" patterns.

---

## Phase 1: Foundation Pages

### Pages to Create

| Page | URL | Target Keyword | Priority |
|------|-----|---------------|----------|
| Homepage (improve) | / | itinerary builder for tour operators | P0 | DONE |
| Pricing | /pricing | tour operator software pricing | P0 | DONE |
| Features | /features | safari itinerary builder features | P1 | DONE (2026-04-06) |
| Book a Demo | /demo | (conversion page) | P0 | DONE |
| About / Our Story | /about | (trust signal) | P2 | DONE (2026-04-07) |
| Blog index | /blog | (content hub) | P1 | ROUTE READY, no posts |
| Sample itinerary showcase | /examples | safari itinerary examples | P1 | |
| FAQ page | /faq | tour operator software FAQ | P2 | |

### Technical SEO Fixes

- [x] Expand sitemap.ts to include all marketing pages (2026-04-07)
- [ ] Add blog sitemap (dynamic from CMS or markdown files)
- [x] Ensure all pages have generateMetadata with unique title/description (features, about done)
- [x] Add JSON-LD schema: FAQPage on /features and /compare pages
- [ ] Add JSON-LD schema: Organization, WebApplication, Product on homepage
- [ ] Add metadataBase to layout.tsx
- [ ] Make sample itineraries (/proposal/[id]) indexable for showcase ones
- [ ] Submit sitemap to Google Search Console
- [ ] Set up Google Business Profile
- [ ] Verify www vs non-www canonical is correct
- [x] Internal linking: Navbar links to /features, Footer links to /features, /pricing, /about, /demo (2026-04-07)

---

## Phase 2: Comparison & Alternative Pages

These are the highest-converting SEO pages for B2B SaaS. People searching "X vs Y" or "alternatives to X" are ready to buy.

### Comparison Pages (create all)

| Page | URL | Target Keyword |
|------|-----|---------------|
| Ratiba vs Tourwriter | /compare/tourwriter | tourwriter alternative | DONE |
| Ratiba vs Travefy | /compare/travefy | travefy alternative | DONE |
| Ratiba vs SafariPortal | /compare/safari-portal | safari portal alternative | DONE (2026-04-07) |
| Ratiba vs Tourplan | /compare/tourplan | tourplan alternative | DONE |
| Ratiba vs SafariOffice | /compare/safari-office | safarioffice alternative | DONE (2026-04-07) |
| Ratiba vs TourConnect AI | /compare/tourconnect | tourconnect alternative | DONE |
| Ratiba vs Wetu | /compare/wetu | wetu itinerary builder | DONE |
| Ratiba vs Excel/Word | /compare/spreadsheets | itinerary builder vs excel | DONE |
| Best Tour Operator Software 2026 | /blog/best-tour-operator-software | best tour operator software | |
| Best Safari Itinerary Software | /blog/best-safari-itinerary-software | safari itinerary software | |

### Page Template for Comparisons

Each comparison page should have:
- H1: "Ratiba vs [Competitor]: Which Tour Operator Software is Right for You?"
- Feature comparison table (side by side)
- Pricing comparison
- Best for section (who should use which)
- Honest pros/cons of both
- FAQ schema (5-8 questions)
- CTA: "Try Ratiba free" or "Book a demo"
- Meta title: "Ratiba vs [Competitor] (2026) | Pricing, Features & Comparison"
- Meta description under 160 chars

---

## Phase 3: Use-Case Pages

### By Role / Business Type

| Page | URL | Target Keyword |
|------|-----|---------------|
| For Safari Operators | /for/safari-operators | safari operator software |
| For DMCs | /for/dmc | DMC software africa |
| For Travel Agents | /for/travel-agents | travel agent itinerary builder |
| For Tour Companies | /for/tour-companies | tour company management software |
| For Luxury Travel | /for/luxury-travel | luxury travel proposal software |
| For Group Tours | /for/group-tours | group tour itinerary builder |
| For Honeymoon Planners | /for/honeymoon-planners | honeymoon itinerary builder |
| For Adventure Travel | /for/adventure-travel | adventure tour operator software |
| For Walking/Trekking Operators | /for/trekking-operators | trekking itinerary software |

### By Feature / Workflow

| Page | URL | Target Keyword |
|------|-----|---------------|
| Itinerary Builder | /features/itinerary-builder | itinerary builder software |
| Proposal Generator | /features/proposals | tour proposal software |
| Client Portal | /features/client-portal | client-facing itinerary portal |
| Team Collaboration | /features/collaboration | tour operator team software |
| Branded Proposals | /features/branded-proposals | branded travel proposal |
| Pricing Calculator | /features/pricing | safari pricing calculator |
| AI Itinerary Assistant | /features/ai | AI itinerary builder |
| Accommodation Library | /features/accommodations | accommodation management tour operator |

### By Region (East Africa focus, expand globally)

| Page | URL | Target Keyword |
|------|-----|---------------|
| For Tanzania Operators | /for/tanzania | tour operator software tanzania |
| For Kenya Operators | /for/kenya | tour operator software kenya |
| For Uganda Operators | /for/uganda | tour operator software uganda |
| For Rwanda Operators | /for/rwanda | tour operator software rwanda |
| For South Africa Operators | /for/south-africa | tour operator software south africa |
| For East Africa DMCs | /for/east-africa | east africa DMC software |
| For Africa Tour Operators | /for/africa | africa tour operator software |
| For Operators Worldwide | /for/worldwide | tour operator software |

---

## Phase 4: Programmatic SEO

### Template Pages at Scale

**Pattern 1: "[Software Type] for [Location]"**
- URL: /solutions/[location]
- Example: /solutions/arusha, /solutions/nairobi, /solutions/cape-town, /solutions/dar-es-salaam
- Target: "[city] tour operator software"
- Content: city-specific intro + how Ratiba helps operators in that city + local testimonial if available

**Pattern 2: "[Use Case] Template"**
- URL: /templates/[template-type]
- Example: /templates/7-day-serengeti-safari, /templates/gorilla-trekking-itinerary, /templates/kilimanjaro-climb
- Target: "[trip type] itinerary template"
- Content: a real sample itinerary built in Ratiba, showcasing the product while targeting search intent

**Pattern 3: "How to [task]"**
- URL: /guides/[task]
- Example: /guides/build-safari-itinerary, /guides/price-multi-day-tour, /guides/create-branded-proposal
- Target: "how to build a safari itinerary"
- Content: step-by-step guide using Ratiba, with screenshots

### Data Sources for pSEO
- List of 50+ East Africa cities/towns with tour operators
- List of 30+ itinerary types (safari, trek, beach, honeymoon, gorilla, etc.)
- List of 20+ workflow tasks (build itinerary, share proposal, manage accommodations, etc.)

---

## Blog Content Plan

### Month 1 - Product-Led SEO

| Week | Target Keyword | Blog Title |
|------|---------------|------------|
| W1 | how to build a safari itinerary | How to Build a Safari Itinerary in 10 Minutes (Step-by-Step) |
| W2 | tour operator proposal template | The Perfect Safari Proposal: Template + Examples |
| W3 | safari itinerary examples | 5 Safari Itinerary Examples Your Clients Will Love |
| W4 | tour operator workflow | The Modern Safari Operator Workflow: From Inquiry to Booking |

### Month 2 - Competitor Capture

| Week | Target Keyword | Blog Title |
|------|---------------|------------|
| W5 | best tour operator software 2026 | The 8 Best Tour Operator Software Tools in 2026 (Honest Review) |
| W6 | tourwriter alternative | Looking for a Tourwriter Alternative? Here's What to Consider |
| W7 | safari portal vs | Safari Portal vs Ratiba: Which Safari Software is Better? |
| W8 | itinerary builder free | Free Itinerary Builders vs Professional Tools: What Tour Operators Need |

### Month 3 - Industry Authority

| Week | Target Keyword | Blog Title |
|------|---------------|------------|
| W9 | tour operator mistakes | 7 Mistakes Tour Operators Make with Proposals (and How to Fix Them) |
| W10 | travel agency pricing strategy | How to Price Multi-Day Tours Without Losing Money |
| W11 | tour operator CRM | Do Safari Operators Need a CRM? (The Honest Answer) |
| W12 | proposal conversion rate | How to Turn More Safari Inquiries into Bookings |

### Month 4 - Regional Content

| Week | Target Keyword | Blog Title |
|------|---------------|------------|
| W13 | tanzania tour operator tips | Running a Tour Company in Tanzania: What Software Actually Helps |
| W14 | kenya vs tanzania safari operator | Kenya vs Tanzania: Where Should New Safari Operators Start? |
| W15 | uganda gorilla trekking operator | Starting a Gorilla Trekking Business in Uganda: The Complete Guide |
| W16 | safari industry technology | Safari Industry Technology Report 2026: Trends and Tools |

---

## LLM / AI Search Optimization (LLMO)

### Why This Matters
LLMs (ChatGPT, Claude, Perplexity, Gemini) are increasingly used by tour operators to research tools. When someone asks "what's the best itinerary builder for safari operators?" we need to be in the answer.

### How LLMs Decide What to Recommend
1. **Entity mentions** - Is "Ratiba" mentioned across multiple credible sources?
2. **Structured data** - Does your site have clear schema markup?
3. **Answer-first content** - Do your pages directly answer common questions?
4. **Freshness** - Is content recently updated?
5. **Specificity** - Niche-specific tools get recommended for niche queries

### LLMO Action Items

**On-site (do now):**
- [ ] Add WebApplication schema to homepage with name, description, category, pricing
- [ ] Add FAQPage schema to every marketing page
- [ ] Structure content as Q&A pairs (LLMs love extracting these)
- [ ] Add "What is Ratiba?" section on homepage (direct answer LLMs can extract)
- [ ] Add clear product category labels: "safari itinerary builder", "tour operator proposal software"
- [ ] Keep content fresh - update pricing page and feature pages monthly
- [ ] Add a /about page with founder story and company details (E-E-A-T signals)

**Off-site (ongoing):**
- [ ] Get listed on G2, Capterra, GetApp with reviews
- [ ] Get mentioned in "best tour operator software" listicle articles (pitch to tech/travel bloggers)
- [ ] Answer questions on Reddit r/touroperators, TripAdvisor forums, and Quora about safari software
- [ ] Contribute to travel industry publications (SafariBookings blog, Travel Weekly, etc.)
- [ ] Get listed on ProductHunt
- [ ] Get listed on AlternativeTo.net
- [ ] Create a Wikipedia-eligible presence (press coverage, third-party mentions)

**Content format for LLM discoverability:**
- Start pages with a direct definition: "Ratiba is an itinerary builder designed for safari operators and tour companies in East Africa."
- Include structured comparison tables (LLMs extract tabular data well)
- Use specific numbers: "Used by 50+ operators", "Build itineraries in 10 minutes"
- Include real customer names when possible (LLMs cite specific examples)

### Track LLM Visibility
- Monthly: Ask ChatGPT, Claude, Perplexity "What's the best itinerary builder for safari operators?" and track if Ratiba appears
- Track mentions via brand monitoring (Google Alerts, Mention.com)
- Goal: appear in 30%+ of relevant LLM queries within 6 months

---

## Technical Checklist

### Immediate (before any content)
- [ ] Expand sitemap.ts to include all public pages
- [ ] Add metadataBase to layout.tsx
- [ ] Add WebApplication JSON-LD schema to homepage
- [ ] Submit updated sitemap to Google Search Console
- [ ] Set up Google Business Profile
- [ ] Add proper og:image to all pages
- [ ] Ensure www/non-www canonical is correct

### Per-Page Requirements
- [ ] Unique meta title (under 60 chars)
- [ ] Unique meta description (under 160 chars)
- [ ] H1 tag with primary keyword
- [ ] Internal links to 2-3 other pages
- [ ] FAQ schema where applicable
- [ ] CTA above the fold
- [ ] Mobile responsive

### Tracking Setup
- [ ] Google Search Console verified and sitemap submitted
- [ ] Google Analytics 4 with conversion events (demo booked, signed up)
- [ ] Track keyword rankings weekly (use Google Search Console)
- [ ] Monthly LLM visibility check

---

## Goals

| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| Pages indexed | 30+ | 60+ | 100+ |
| Organic monthly visits | 100-300 | 500-1,500 | 3,000-8,000 |
| Comparison page rankings (page 1) | 2-3 | 5-8 | 10+ |
| Organic demo bookings/month | 1-2 | 5-10 | 15-30 |
| LLM mention rate | 5% | 15% | 30%+ |
| Blog posts published | 4 | 12 | 24 |
| Backlinks acquired | 10 | 25 | 50+ |

---

## Priority Order (What to Do First)

1. **Week 1**: Fix technical foundation (sitemap, schema, metadataBase)
2. **Week 2**: Create /features page, /about page, improve homepage copy
3. **Week 3**: Create first 3 comparison pages (vs Tourwriter, vs Travefy, vs SafariPortal)
4. **Week 4**: Create first 3 use-case pages (/for/safari-operators, /for/dmc, /for/travel-agents)
5. **Week 5-8**: Publish weekly blog posts (product-led content)
6. **Week 9-12**: Create remaining comparison + use-case pages
7. **Week 13+**: Start programmatic SEO (templates, city pages)

---

## Competitors to Monitor

| Competitor | Strength | Weakness | Our Angle |
|-----------|----------|----------|-----------|
| Tourwriter | Established, good SEO content | Expensive ($149/user/mo), generic | We're built for safari, they're built for everyone |
| Travefy | Beautiful proposals, affordable ($49/mo) | No safari focus, limited operational features | We understand East Africa accommodations + parks |
| SafariPortal | Safari-specific, Tourplan integration | Enterprise-focused, complex | We're simpler, faster, modern UX |
| SafariOffice | Safari-specific | Dated UI, limited collaboration | Modern collaboration, client portal |
| Tourplan | 40 years in business, comprehensive | Very expensive, steep learning curve | We're the anti-Tourplan - simple, fast, affordable |
| Wetu | Strong in Southern Africa, great itineraries | Expensive, Southern Africa bias | We're East Africa first, more affordable |
| TourConnect AI | AI-powered | New, unproven | We have real operator workflows + AI |
| Excel/Word | Free, familiar | No collaboration, ugly proposals, no branding | Everything Excel can't do |
