export type CompetitorData = {
  name: string;
  slug: string;
  tagline: string;
  excerpt: string;
  reasons: Array<{ number: string; title: string; description: string; image: string }>;
  features: Array<{ name: string; ratiba: boolean; competitor: boolean }>;
  pricing: Array<{
    plan: string;
    ratibaPrice: string;
    competitorPrice: string;
    highlights: string[];
  }>;
  faqs: Array<{ question: string; answer: string }>;
};

const RATIBA_IMAGES = {
  ai: 'https://brand.makisala.com/ai-feat.jpg',
  proposals: 'https://brand.makisala.com/content-library.jpg',
  team: 'https://brand.makisala.com/team_tagging.jpg',
  comments: 'https://brand.makisala.com/comments.jpg',
};

export const COMPETITORS: Record<string, CompetitorData> = {
  tourwriter: {
    name: 'Tourwriter',
    slug: 'tourwriter',
    tagline:
      'Tourwriter is built for the global tour market. Ratiba is built for safari operators who need speed, accuracy, and beautiful client-facing proposals without the bloat.',
    excerpt:
      'Compare Ratiba vs Tourwriter for safari operators. See features, pricing, and why operators switch to Ratiba.',
    reasons: [
      {
        number: '01',
        title: 'Built for safari, not generic tours',
        description:
          'Tourwriter serves the global tour market — from city breaks to cruises. Ratiba is purpose-built for East African safari operators. Every feature, from game-drive scheduling to lodge availability, is designed around how you actually run trips.',
        image: RATIBA_IMAGES.ai,
      },
      {
        number: '02',
        title: 'Live proposals, not just PDFs',
        description:
          'Tourwriter sends branded PDFs or basic online links. Ratiba generates interactive, mobile-optimized proposals your clients can view, comment on, and approve — all in real time, no downloads needed.',
        image: RATIBA_IMAGES.proposals,
      },
      {
        number: '03',
        title: 'Flat pricing vs per-seat fees',
        description:
          'Tourwriter charges $99–$299 per user per month. A 5-person team on their Premium plan costs $1,245/mo. Ratiba offers flat plans starting at $49/mo — add your whole team without worrying about ballooning costs.',
        image: RATIBA_IMAGES.team,
      },
    ],
    features: [
      { name: 'Drag-and-drop itinerary builder', ratiba: true, competitor: true },
      { name: 'Client-facing live proposals', ratiba: true, competitor: false },
      { name: 'Real-time lodge availability', ratiba: true, competitor: false },
      { name: 'Automated costing & margins', ratiba: true, competitor: true },
      { name: 'Multi-currency support', ratiba: true, competitor: true },
      { name: 'Branded PDF exports', ratiba: true, competitor: true },
      { name: 'Live proposal links (no PDFs)', ratiba: true, competitor: false },
      { name: 'Safari-specific templates', ratiba: true, competitor: false },
      { name: 'Supplier payment tracking', ratiba: true, competitor: true },
      { name: 'CRM & lead management', ratiba: true, competitor: true },
      { name: 'API access', ratiba: true, competitor: false },
      { name: 'Unlimited team members (Business)', ratiba: true, competitor: false },
      { name: 'WhatsApp integration', ratiba: true, competitor: false },
      { name: 'Mobile-optimized proposals', ratiba: true, competitor: false },
      { name: 'Free onboarding & migration', ratiba: true, competitor: false },
    ],
    pricing: [
      {
        plan: 'Starter',
        ratibaPrice: '$49/mo',
        competitorPrice: '$99/user/mo',
        highlights: [
          'Ratiba: 5 active proposals, PDF export',
          'Tourwriter: per-user pricing adds up fast',
          '2 users on Tourwriter = $198/mo vs $49/mo on Ratiba',
        ],
      },
      {
        plan: 'Pro / Teams',
        ratibaPrice: '$99/mo (3 members)',
        competitorPrice: '$149/user/mo (Pro)',
        highlights: [
          'Ratiba: unlimited proposals, all themes, 3 team members',
          'Tourwriter Pro: 3 users = $447/mo',
          'Ratiba saves you $348/mo at 3 seats',
        ],
      },
      {
        plan: 'Business / Premium',
        ratibaPrice: '$249/mo (unlimited members)',
        competitorPrice: '$249/user/mo (Premium)',
        highlights: [
          'Ratiba: unlimited team members, custom domains',
          'Tourwriter: 5 users = $1,245/mo',
          'Ratiba saves you $996/mo at 5 seats',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is Tourwriter good for safari operators?',
        answer:
          'Tourwriter is a solid general tour operator tool with strong itinerary building and CRM features. However, it was designed for the global market — not specifically for safari operations in East Africa. Ratiba is purpose-built for safari operators with features like game-drive scheduling and lodge availability.',
      },
      {
        question: 'How much does Tourwriter cost compared to Ratiba?',
        answer:
          'Tourwriter charges per user: $99/mo (Starter), $149/mo (Pro), or $249–$299/mo (Premium). A 5-person team on Premium costs $1,245/mo. Ratiba offers flat pricing starting at $49/mo, with the Business plan at $249/mo for unlimited team members.',
      },
      {
        question: 'Can I migrate from Tourwriter to Ratiba?',
        answer:
          'Yes. Ratiba offers free onboarding and migration assistance. We help you move your supplier data, itinerary templates, and team over to Ratiba at no extra cost.',
      },
      {
        question: 'Does Tourwriter offer live client-facing proposals?',
        answer:
          'Tourwriter primarily generates branded PDF proposals and basic online links. Ratiba creates interactive, mobile-optimized live proposals that clients can view, comment on, and approve in real time — no downloads required.',
      },
      {
        question: 'Does Ratiba support multi-currency like Tourwriter?',
        answer:
          'Yes. Ratiba supports multi-currency pricing and automatic conversion, just like Tourwriter. Both platforms let you quote in your client\'s currency while tracking costs in your base currency.',
      },
      {
        question: 'Which tool is better for small safari companies?',
        answer:
          'For small safari companies, Ratiba is significantly more affordable. Tourwriter\'s per-user pricing makes it expensive even for 2–3 person teams. Ratiba\'s Starter plan at $49/mo includes everything a small operator needs to start sending professional proposals.',
      },
    ],
  },

  wetu: {
    name: 'Wetu',
    slug: 'wetu',
    tagline:
      'Wetu is a content platform with itinerary tools. Ratiba is a full operations platform built specifically for safari operators — from proposal to payment.',
    excerpt:
      'Compare Ratiba vs Wetu for safari operators. See how Ratiba offers more than just content management.',
    reasons: [
      {
        number: '01',
        title: 'More than a content library',
        description:
          'Wetu excels at curated travel content and digital itineraries. But it lacks the operational tools safari companies need — costing, team collaboration, and client proposal workflows. Ratiba combines beautiful proposals with the business tools to run your company.',
        image: RATIBA_IMAGES.proposals,
      },
      {
        number: '02',
        title: 'Interactive proposals, not static itineraries',
        description:
          'Wetu creates content-rich digital itineraries, but they are read-only. Ratiba proposals are interactive — clients can comment, ask questions, and approve trips directly, cutting your back-and-forth in half.',
        image: RATIBA_IMAGES.comments,
      },
      {
        number: '03',
        title: 'Built for the operator, not the supplier',
        description:
          'Wetu is designed for both suppliers and operators, spreading focus thin. Ratiba is 100% focused on tour operators — every feature is built to help you sell more trips and manage them better.',
        image: RATIBA_IMAGES.ai,
      },
    ],
    features: [
      { name: 'Drag-and-drop itinerary builder', ratiba: true, competitor: true },
      { name: 'Interactive client proposals', ratiba: true, competitor: false },
      { name: 'Content management system', ratiba: true, competitor: true },
      { name: 'Automated costing & margins', ratiba: true, competitor: false },
      { name: 'Multi-currency support', ratiba: true, competitor: true },
      { name: 'Branded PDF exports', ratiba: true, competitor: true },
      { name: 'Client comments on proposals', ratiba: true, competitor: false },
      { name: 'Safari-specific templates', ratiba: true, competitor: false },
      { name: 'Supplier payment tracking', ratiba: true, competitor: false },
      { name: 'CRM & lead management', ratiba: true, competitor: false },
      { name: 'Multi-language itineraries', ratiba: false, competitor: true },
      { name: 'API access', ratiba: true, competitor: true },
      { name: 'WhatsApp integration', ratiba: true, competitor: false },
      { name: 'Itinerary analytics', ratiba: false, competitor: true },
      { name: 'Team collaboration', ratiba: true, competitor: false },
    ],
    pricing: [
      {
        plan: 'Starter / Lite',
        ratibaPrice: '$49/mo',
        competitorPrice: '$75/mo (Lite)',
        highlights: [
          'Ratiba: proposals + itinerary builder + PDF export',
          'Wetu Lite: content and basic itineraries only',
          'Ratiba includes costing tools Wetu doesn\'t',
        ],
      },
      {
        plan: 'Pro / Standard',
        ratibaPrice: '$99/mo (3 members)',
        competitorPrice: '$150/mo',
        highlights: [
          'Ratiba: full proposal workflow + team features',
          'Wetu: richer content library but no costing',
          'Ratiba saves $51/mo and adds operational tools',
        ],
      },
      {
        plan: 'Business / Enterprise',
        ratibaPrice: '$249/mo (unlimited members)',
        competitorPrice: '$395/mo (Enterprise)',
        highlights: [
          'Ratiba: unlimited team, custom domains, full ops',
          'Wetu Enterprise: content + analytics + API',
          'Ratiba saves $146/mo with more features',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is Wetu good for safari operators?',
        answer:
          'Wetu is excellent for creating content-rich digital itineraries and is widely used in the African safari market. However, it\'s primarily a content platform — it lacks costing tools, client proposal workflows, and team collaboration features that operators need to run their business.',
      },
      {
        question: 'How does Wetu pricing compare to Ratiba?',
        answer:
          'Wetu offers plans at $75/mo, $150/mo, and $395/mo. Ratiba starts at $49/mo and includes operational tools (costing, proposals, CRM) that Wetu doesn\'t offer. Ratiba\'s Business plan at $249/mo is $146/mo cheaper than Wetu Enterprise.',
      },
      {
        question: 'Can I use Wetu and Ratiba together?',
        answer:
          'Some operators use Wetu for supplier content and Ratiba for proposals and operations. However, Ratiba\'s built-in content library means most operators find they don\'t need both tools.',
      },
      {
        question: 'Does Wetu offer client-facing proposals?',
        answer:
          'Wetu creates digital itineraries that clients can view, but they are read-only. Clients cannot comment, ask questions, or approve trips directly. Ratiba proposals are fully interactive with real-time comments and approval workflows.',
      },
      {
        question: 'Which is better for a small safari company?',
        answer:
          'For small safari companies that need to send proposals and manage costs, Ratiba is the better fit. Wetu is more suited for operators who primarily need a content library and digital itinerary presentation.',
      },
    ],
  },

  tourplan: {
    name: 'Tourplan',
    slug: 'tourplan',
    tagline:
      'Tourplan is enterprise software for large operators. Ratiba is built for agile safari companies that want to move fast without the complexity.',
    excerpt:
      'Compare Ratiba vs Tourplan for safari operators. Enterprise power vs purpose-built simplicity.',
    reasons: [
      {
        number: '01',
        title: 'Start in minutes, not months',
        description:
          'Tourplan is powerful enterprise software, but implementation takes months and requires dedicated training. Ratiba is ready to use out of the box — most operators send their first proposal within a day.',
        image: RATIBA_IMAGES.ai,
      },
      {
        number: '02',
        title: 'Modern proposals your clients love',
        description:
          'Tourplan focuses on back-office operations — reservations, accounting, and reporting. Ratiba gives you both: operational tools plus stunning, interactive proposals that win clients over.',
        image: RATIBA_IMAGES.proposals,
      },
      {
        number: '03',
        title: 'Transparent pricing, no sales calls',
        description:
          'Tourplan requires custom quotes through a sales process. Ratiba has transparent, published pricing starting at $49/mo — no surprise fees, no long contracts.',
        image: RATIBA_IMAGES.team,
      },
    ],
    features: [
      { name: 'Drag-and-drop itinerary builder', ratiba: true, competitor: true },
      { name: 'Client-facing live proposals', ratiba: true, competitor: false },
      { name: 'Automated costing & margins', ratiba: true, competitor: true },
      { name: 'Multi-currency support', ratiba: true, competitor: true },
      { name: 'Branded PDF exports', ratiba: true, competitor: true },
      { name: 'Integrated accounting', ratiba: false, competitor: true },
      { name: 'Safari-specific templates', ratiba: true, competitor: false },
      { name: 'Supplier reservations', ratiba: false, competitor: true },
      { name: 'CRM & lead management', ratiba: true, competitor: true },
      { name: 'Group tour management', ratiba: false, competitor: true },
      { name: 'API access', ratiba: true, competitor: true },
      { name: 'WhatsApp integration', ratiba: true, competitor: false },
      { name: 'Mobile-optimized proposals', ratiba: true, competitor: false },
      { name: 'Self-serve signup (no sales call)', ratiba: true, competitor: false },
      { name: 'Free onboarding & migration', ratiba: true, competitor: false },
    ],
    pricing: [
      {
        plan: 'Starter / Entry',
        ratibaPrice: '$49/mo',
        competitorPrice: 'Custom quote required',
        highlights: [
          'Ratiba: transparent pricing, start today',
          'Tourplan: requires sales call and custom quote',
          'No long-term contracts with Ratiba',
        ],
      },
      {
        plan: 'Pro / Standard',
        ratibaPrice: '$99/mo (3 members)',
        competitorPrice: 'Custom quote required',
        highlights: [
          'Ratiba: full proposal workflow + team features',
          'Tourplan: enterprise pricing typically $500+/mo',
          'Ratiba is built for SMB safari operators',
        ],
      },
      {
        plan: 'Business / Enterprise',
        ratibaPrice: '$249/mo (unlimited members)',
        competitorPrice: 'Custom quote required',
        highlights: [
          'Ratiba: unlimited team, all features included',
          'Tourplan: implementation can cost $10K+',
          'Ratiba includes free onboarding and migration',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is Tourplan good for safari operators?',
        answer:
          'Tourplan is powerful enterprise software used by 450+ operators in 70 countries. It excels at back-office operations, reservations, and accounting. However, it\'s designed for large operators and can be complex and expensive for small to mid-sized safari companies.',
      },
      {
        question: 'How much does Tourplan cost?',
        answer:
          'Tourplan does not publish pricing — you need to request a custom quote through their sales team. Implementation typically requires significant upfront investment. Ratiba has transparent pricing starting at $49/mo with no setup fees.',
      },
      {
        question: 'Can small safari companies use Tourplan?',
        answer:
          'Tourplan is primarily designed for large tour operators and DMCs. The implementation timeline, training requirements, and pricing structure make it challenging for small safari companies. Ratiba is purpose-built for operators of all sizes.',
      },
      {
        question: 'Does Tourplan offer client-facing proposals?',
        answer:
          'Tourplan focuses on back-office operations — reservations, accounting, and supplier management. It does not offer interactive, client-facing proposals. Ratiba generates stunning live proposals that clients can view, comment on, and approve directly.',
      },
      {
        question: 'How long does it take to set up Tourplan vs Ratiba?',
        answer:
          'Tourplan implementation typically takes weeks to months, often requiring dedicated training sessions. Ratiba can be set up in minutes — most operators send their first proposal within a day of signing up.',
      },
    ],
  },

  'safari-portal': {
    name: 'Safari Portal',
    slug: 'safari-portal',
    tagline:
      'Safari Portal is a capable itinerary builder for travel advisors. Ratiba is built specifically for East African safari operators — with deeper safari features and simpler pricing.',
    excerpt:
      'Compare Ratiba vs Safari Portal for safari operators. Feature comparison, pricing, and more.',
    reasons: [
      {
        number: '01',
        title: 'Purpose-built for East Africa',
        description:
          'Safari Portal serves travel advisors and DMCs globally. Ratiba is laser-focused on East African safari operators — our templates, content, and workflows are designed around how safaris actually work in Tanzania, Kenya, Uganda, and Rwanda.',
        image: RATIBA_IMAGES.ai,
      },
      {
        number: '02',
        title: 'More affordable at every tier',
        description:
          'Safari Portal starts at $199/mo for a single user. Ratiba starts at $49/mo and includes more features out of the box. Even Ratiba\'s Business plan at $249/mo gives you unlimited team members — Safari Portal charges extra per seat.',
        image: RATIBA_IMAGES.team,
      },
      {
        number: '03',
        title: 'Interactive proposals, not just PDFs',
        description:
          'Safari Portal creates great PDF proposals and lookbooks. Ratiba goes further with live, interactive proposals — clients can comment, ask questions, and approve directly, reducing your email back-and-forth.',
        image: RATIBA_IMAGES.comments,
      },
    ],
    features: [
      { name: 'Drag-and-drop itinerary builder', ratiba: true, competitor: true },
      { name: 'Interactive client proposals', ratiba: true, competitor: false },
      { name: 'PDF & lookbook exports', ratiba: true, competitor: true },
      { name: 'Automated costing & margins', ratiba: true, competitor: true },
      { name: 'Multi-currency support', ratiba: true, competitor: true },
      { name: 'CRM & contact management', ratiba: true, competitor: true },
      { name: 'Task management', ratiba: false, competitor: true },
      { name: 'Branded mobile app', ratiba: false, competitor: true },
      { name: 'Safari-specific templates', ratiba: true, competitor: false },
      { name: 'Client comments on proposals', ratiba: true, competitor: false },
      { name: 'AI assistant', ratiba: true, competitor: true },
      { name: 'WhatsApp integration', ratiba: true, competitor: false },
      { name: 'Unlimited team members (Business)', ratiba: true, competitor: false },
      { name: 'Flight search integration', ratiba: false, competitor: true },
      { name: 'Free onboarding & migration', ratiba: true, competitor: false },
    ],
    pricing: [
      {
        plan: 'Starter',
        ratibaPrice: '$49/mo',
        competitorPrice: '$199/mo (1 user)',
        highlights: [
          'Ratiba: proposals, itinerary builder, PDF export',
          'Safari Portal: similar features but 4x the price',
          'Ratiba saves you $150/mo from day one',
        ],
      },
      {
        plan: 'Pro / Standard',
        ratibaPrice: '$99/mo (3 members)',
        competitorPrice: '$299/mo',
        highlights: [
          'Ratiba: 3 team members, unlimited proposals',
          'Safari Portal Standard: still limited features',
          'Ratiba saves you $200/mo with more included',
        ],
      },
      {
        plan: 'Business / Deluxe',
        ratibaPrice: '$249/mo (unlimited members)',
        competitorPrice: '$399/mo (3 users) + per-seat add-ons',
        highlights: [
          'Ratiba: unlimited team, custom domains',
          'Safari Portal: additional users cost extra',
          'Ratiba saves $150+/mo with unlimited seats',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is Safari Portal good for safari operators?',
        answer:
          'Safari Portal is a capable itinerary builder with strong PDF/lookbook output, CRM, and a branded mobile app. It serves travel advisors and DMCs globally. For East African safari operators specifically, Ratiba offers deeper safari-specific features at a lower price point.',
      },
      {
        question: 'How much does Safari Portal cost vs Ratiba?',
        answer:
          'Safari Portal starts at $199/mo for 1 user, $299/mo (Standard), and $399/mo (Deluxe, 3 users). Additional users cost extra. Ratiba starts at $49/mo, with the Business plan at $249/mo including unlimited team members.',
      },
      {
        question: 'Does Safari Portal have a mobile app?',
        answer:
          'Yes, Safari Portal offers a branded mobile app (Deluxe plan and above) where clients can view their trip. Ratiba takes a different approach with mobile-optimized live proposal links that work on any device without requiring an app download.',
      },
      {
        question: 'Can I switch from Safari Portal to Ratiba?',
        answer:
          'Yes. Ratiba offers free onboarding and migration assistance to help you transition your supplier data, templates, and team from Safari Portal.',
      },
      {
        question: 'Which tool has better proposals?',
        answer:
          'Safari Portal creates beautiful PDF proposals and lookbooks. Ratiba proposals are interactive and live — clients can comment, approve, and engage directly on the proposal without downloading anything. Both produce professional output.',
      },
    ],
  },

  'safari-office': {
    name: 'SafariOffice',
    slug: 'safari-office',
    tagline:
      'SafariOffice is a lightweight quoting tool for safari companies. Ratiba is a complete platform — from itinerary building to live proposals to team management.',
    excerpt:
      'Compare Ratiba vs SafariOffice for safari operators. See why operators upgrade to Ratiba.',
    reasons: [
      {
        number: '01',
        title: 'Beyond PDF quotes',
        description:
          'SafariOffice generates PDF quotes and sends them by email. Ratiba creates interactive, mobile-optimized proposals that clients can view, comment on, and approve — all without downloading a file.',
        image: RATIBA_IMAGES.proposals,
      },
      {
        number: '02',
        title: 'A complete operations platform',
        description:
          'SafariOffice focuses on quote generation and a media library. Ratiba adds itinerary building, team collaboration, CRM, costing tools, and client proposal workflows — everything you need in one place.',
        image: RATIBA_IMAGES.ai,
      },
      {
        number: '03',
        title: 'Modern interface, faster workflows',
        description:
          'Ratiba is built with a modern, intuitive interface designed around how safari operators actually work. Drag-and-drop itinerary building, real-time collaboration, and AI assistance help you move faster.',
        image: RATIBA_IMAGES.team,
      },
    ],
    features: [
      { name: 'Drag-and-drop itinerary builder', ratiba: true, competitor: false },
      { name: 'Interactive client proposals', ratiba: true, competitor: false },
      { name: 'PDF quote generation', ratiba: true, competitor: true },
      { name: 'Safari image library', ratiba: true, competitor: true },
      { name: 'Multi-currency support', ratiba: true, competitor: false },
      { name: 'Branded proposals', ratiba: true, competitor: true },
      { name: 'Client comments on proposals', ratiba: true, competitor: false },
      { name: 'CRM & lead management', ratiba: true, competitor: true },
      { name: 'Team collaboration', ratiba: true, competitor: true },
      { name: 'SafariBookings integration', ratiba: false, competitor: true },
      { name: 'AI assistant', ratiba: true, competitor: true },
      { name: 'WhatsApp integration', ratiba: true, competitor: false },
      { name: 'API access', ratiba: true, competitor: false },
      { name: 'Content library', ratiba: true, competitor: true },
      { name: 'Automated costing & margins', ratiba: true, competitor: false },
    ],
    pricing: [
      {
        plan: 'Free / Starter',
        ratibaPrice: '$49/mo',
        competitorPrice: 'Free (2 users)',
        highlights: [
          'SafariOffice: free for 2 users with basic features',
          'Ratiba Starter: proposals, PDF export, content library',
          'Ratiba adds interactive proposals SafariOffice lacks',
        ],
      },
      {
        plan: 'Pro',
        ratibaPrice: '$99/mo (3 members)',
        competitorPrice: '~$50/mo (Pro + extra users)',
        highlights: [
          'SafariOffice Pro: better styling, video headers, AI',
          'Ratiba Pro: full itinerary builder + costing + themes',
          'Ratiba includes operational tools SafariOffice doesn\'t',
        ],
      },
      {
        plan: 'Business',
        ratibaPrice: '$249/mo (unlimited members)',
        competitorPrice: '~$95/mo (Pro + 8 users + add-ons)',
        highlights: [
          'Ratiba: unlimited team, custom domains, full ops',
          'SafariOffice: quote tool + media library at scale',
          'Ratiba is a complete platform, not just a quoting tool',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is SafariOffice good for safari companies?',
        answer:
          'SafariOffice is a solid, affordable quoting tool specifically for safari companies. It\'s great for generating PDF quotes with beautiful imagery. However, it lacks itinerary building, interactive proposals, costing tools, and team collaboration features that growing operators need.',
      },
      {
        question: 'Is SafariOffice really free?',
        answer:
          'SafariOffice offers a free plan for up to 2 users with basic features. Their Pro plan costs approximately €49.50/mo with additional users at €11.99 each. While cheaper than Ratiba, it offers significantly fewer features.',
      },
      {
        question: 'Should I upgrade from SafariOffice to Ratiba?',
        answer:
          'If you\'ve outgrown PDF quotes and need interactive proposals, itinerary building, team collaboration, and costing tools, Ratiba is the natural upgrade. Many operators start with SafariOffice and move to Ratiba as they grow.',
      },
      {
        question: 'Does SafariOffice have an itinerary builder?',
        answer:
          'SafariOffice focuses on quote generation — creating PDF documents with images and pricing. It does not have a drag-and-drop itinerary builder like Ratiba, which lets you visually plan day-by-day safari itineraries.',
      },
      {
        question: 'Can I migrate from SafariOffice to Ratiba?',
        answer:
          'Yes. Ratiba offers free onboarding and migration assistance to help you transition from SafariOffice, including moving your client data and setting up your templates.',
      },
    ],
  },

  travefy: {
    name: 'Travefy',
    slug: 'travefy',
    tagline:
      'Travefy is built for US travel agents. Ratiba is built for safari operators in East Africa — different market, different needs.',
    excerpt:
      'Compare Ratiba vs Travefy for safari operators. See why African operators choose Ratiba.',
    reasons: [
      {
        number: '01',
        title: 'Safari-first, not agent-first',
        description:
          'Travefy is designed for travel agents selling packaged trips in the US market. Ratiba is built for safari operators who create custom, multi-day itineraries with lodges, game drives, and transfers — a fundamentally different workflow.',
        image: RATIBA_IMAGES.ai,
      },
      {
        number: '02',
        title: 'Proposals built for safari selling',
        description:
          'Travefy proposals look great for general travel. Ratiba proposals are designed for the safari experience — with rich imagery, day-by-day breakdowns, accommodation highlights, and the visual storytelling that sells East African safari trips.',
        image: RATIBA_IMAGES.proposals,
      },
      {
        number: '03',
        title: 'No per-seat surprise fees',
        description:
          'Travefy\'s Agency plan charges $20/mo per additional seat on top of your base plan. Ratiba\'s Business plan includes unlimited team members at a flat $249/mo — no surprise costs as your team grows.',
        image: RATIBA_IMAGES.team,
      },
    ],
    features: [
      { name: 'Drag-and-drop itinerary builder', ratiba: true, competitor: true },
      { name: 'Interactive client proposals', ratiba: true, competitor: true },
      { name: 'Safari-specific templates', ratiba: true, competitor: false },
      { name: 'Automated costing & margins', ratiba: true, competitor: false },
      { name: 'Multi-currency support', ratiba: true, competitor: false },
      { name: 'Branded PDF exports', ratiba: true, competitor: true },
      { name: 'CRM with automations', ratiba: true, competitor: true },
      { name: 'Client comments on proposals', ratiba: true, competitor: false },
      { name: 'Lodge availability tracking', ratiba: true, competitor: false },
      { name: 'WhatsApp integration', ratiba: true, competitor: false },
      { name: 'Mobile apps', ratiba: false, competitor: true },
      { name: 'AI content import', ratiba: true, competitor: true },
      { name: 'Team collaboration', ratiba: true, competitor: true },
    ],
    pricing: [
      {
        plan: 'Starter / Core',
        ratibaPrice: '$49/mo',
        competitorPrice: '$39/mo (Core)',
        highlights: [
          'Travefy Core: great for US travel agents',
          'Ratiba Starter: built for safari operators',
          'Ratiba includes safari-specific features Travefy lacks',
        ],
      },
      {
        plan: 'Pro / Premium',
        ratibaPrice: '$99/mo (3 members)',
        competitorPrice: '$59/mo (Premium)',
        highlights: [
          'Travefy Premium: priority support + custom domain',
          'Ratiba Pro: costing, multi-currency, 3 team members',
          'Ratiba adds operational tools agents don\'t need',
        ],
      },
      {
        plan: 'Business / Agency',
        ratibaPrice: '$249/mo (unlimited members)',
        competitorPrice: '$59/mo + $20/seat',
        highlights: [
          'Travefy Agency: $59 + $20 per additional agent',
          'Ratiba Business: flat $249/mo, unlimited team',
          '10+ agents? Ratiba is more cost-effective',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is Travefy good for safari operators?',
        answer:
          'Travefy is an excellent tool for US-based travel agents and agencies. However, it\'s designed for the agent workflow — selling supplier packages, not creating custom safari itineraries. Safari operators in East Africa need features like multi-currency costing, lodge availability, and safari-specific templates that Travefy doesn\'t offer.',
      },
      {
        question: 'How does Travefy pricing compare to Ratiba?',
        answer:
          'Travefy\'s Core plan starts at $39/mo, which is cheaper than Ratiba\'s $49/mo Starter. However, Travefy\'s Agency plan charges $20/mo per additional seat. For teams of 10+, Ratiba\'s flat $249/mo Business plan is more cost-effective.',
      },
      {
        question: 'Does Travefy support multi-currency?',
        answer:
          'Travefy is primarily designed for the US market and doesn\'t offer multi-currency costing. Ratiba supports multi-currency pricing and conversion, essential for safari operators quoting in USD, EUR, and GBP while tracking costs in local currencies.',
      },
      {
        question: 'Can Travefy handle safari-specific itineraries?',
        answer:
          'Travefy can create general travel itineraries, but it lacks safari-specific templates, game-drive scheduling, and lodge availability features. Ratiba is purpose-built for the safari workflow with templates and content designed for East African operators.',
      },
      {
        question: 'Which is better for an East African DMC?',
        answer:
          'For East African DMCs, Ratiba is the clear choice. It\'s built for your market with safari-specific features, multi-currency support, and pricing designed for African businesses. Travefy is optimized for US travel agents selling packaged trips.',
      },
    ],
  },

  tourconnect: {
    name: 'TourConnect AI',
    slug: 'tourconnect',
    tagline:
      'TourConnect AI focuses on booking automation and B2B connections. Ratiba focuses on helping safari operators build itineraries and win clients with stunning proposals.',
    excerpt:
      'Compare Ratiba vs TourConnect AI for tour operators. Proposals vs booking automation.',
    reasons: [
      {
        number: '01',
        title: 'Proposal-first, not booking-first',
        description:
          'TourConnect AI automates B2B bookings and rate management. Ratiba focuses on what happens before the booking — building beautiful itineraries and sending proposals that convert leads into clients.',
        image: RATIBA_IMAGES.proposals,
      },
      {
        number: '02',
        title: 'Built for safari workflows',
        description:
          'TourConnect serves tour operators, DMCs, and accommodation groups globally. Ratiba is purpose-built for East African safari operators with templates, content, and workflows designed around safari trips.',
        image: RATIBA_IMAGES.ai,
      },
      {
        number: '03',
        title: 'Flat pricing, not per-seat',
        description:
          'TourConnect charges $50 per user per month. A 5-person team costs $250/mo. Ratiba\'s Business plan gives you unlimited team members at $249/mo flat.',
        image: RATIBA_IMAGES.team,
      },
    ],
    features: [
      { name: 'Drag-and-drop itinerary builder', ratiba: true, competitor: false },
      { name: 'Client-facing live proposals', ratiba: true, competitor: false },
      { name: 'AI trip creation', ratiba: true, competitor: true },
      { name: 'Automated costing & margins', ratiba: true, competitor: false },
      { name: 'Multi-currency support', ratiba: true, competitor: true },
      { name: 'Booking automation', ratiba: false, competitor: true },
      { name: 'Rate & contract management', ratiba: false, competitor: true },
      { name: 'Safari-specific templates', ratiba: true, competitor: false },
      { name: 'CRM & lead management', ratiba: true, competitor: true },
      { name: 'B2B supplier connections', ratiba: false, competitor: true },
      { name: 'Client comments on proposals', ratiba: true, competitor: false },
      { name: 'WhatsApp integration', ratiba: true, competitor: false },
      { name: 'Email AI automation', ratiba: false, competitor: true },
      { name: 'Branded PDF exports', ratiba: true, competitor: false },
      { name: 'Team collaboration', ratiba: true, competitor: false },
    ],
    pricing: [
      {
        plan: 'Starter',
        ratibaPrice: '$49/mo',
        competitorPrice: '$50/user/mo',
        highlights: [
          'Ratiba: proposals, itinerary builder, PDF export',
          'TourConnect: per-user, focused on B2B automation',
          'Even 1 user costs more on TourConnect',
        ],
      },
      {
        plan: 'Pro / Team',
        ratibaPrice: '$99/mo (3 members)',
        competitorPrice: '$50/user/mo (3 users = $150/mo)',
        highlights: [
          'Ratiba Pro: 3 members, all features, $99/mo',
          'TourConnect: 3 users = $150/mo',
          'Ratiba saves $51/mo with richer proposal tools',
        ],
      },
      {
        plan: 'Business',
        ratibaPrice: '$249/mo (unlimited members)',
        competitorPrice: '$50/user/mo (5 users = $250/mo)',
        highlights: [
          'Ratiba: unlimited team at a flat rate',
          'TourConnect: costs scale linearly per user',
          'At 6+ users, Ratiba is always cheaper',
        ],
      },
    ],
    faqs: [
      {
        question: 'What does TourConnect AI do?',
        answer:
          'TourConnect AI focuses on booking automation, rate management, and B2B supplier connections for tour operators and DMCs. It uses AI to automate trip creation and customer emails. It\'s a back-office tool rather than a client-facing proposal platform.',
      },
      {
        question: 'How is Ratiba different from TourConnect?',
        answer:
          'Ratiba focuses on the sales side — building itineraries, creating proposals, and winning clients. TourConnect focuses on the operations side — B2B bookings, rate management, and automation. They solve different problems.',
      },
      {
        question: 'Can I use both Ratiba and TourConnect?',
        answer:
          'Yes. Some operators use Ratiba for proposals and client management, and TourConnect for B2B booking automation. They serve complementary functions in the sales-to-operations workflow.',
      },
      {
        question: 'How does TourConnect pricing work?',
        answer:
          'TourConnect charges $50 per user per month. For a team of 5, that\'s $250/mo. Ratiba\'s Business plan offers unlimited team members at $249/mo flat — making it more cost-effective for growing teams.',
      },
      {
        question: 'Does TourConnect offer client-facing proposals?',
        answer:
          'TourConnect AI focuses on B2B automation — booking, rates, and supplier management. It does not create client-facing itinerary proposals. Ratiba is built specifically for creating proposals that win clients.',
      },
    ],
  },

  spreadsheets: {
    name: 'Excel & Word',
    slug: 'spreadsheets',
    tagline:
      'Spreadsheets and Word docs get the job done, but they cost you hours every week. Ratiba automates the manual work so you can focus on selling safari trips.',
    excerpt:
      'Stop building safari itineraries in Excel. Ratiba replaces spreadsheets with a purpose-built itinerary and proposal platform.',
    reasons: [
      {
        number: '01',
        title: 'Hours saved every week',
        description:
          'Copy-pasting lodge details, reformatting Word docs, manually calculating costs in Excel — it adds up to hours every week. Ratiba automates itinerary building, costing, and proposals so you can focus on selling.',
        image: RATIBA_IMAGES.ai,
      },
      {
        number: '02',
        title: 'Proposals that win clients',
        description:
          'A Word doc attachment can\'t compete with an interactive, mobile-optimized proposal. Ratiba proposals look professional, load instantly on any device, and let clients comment and approve directly.',
        image: RATIBA_IMAGES.proposals,
      },
      {
        number: '03',
        title: 'Your whole team, one system',
        description:
          'With spreadsheets, everyone has their own version. Pricing gets out of sync, proposals have inconsistent branding, and knowledge lives in individual inboxes. Ratiba puts your whole team on one platform.',
        image: RATIBA_IMAGES.team,
      },
    ],
    features: [
      { name: 'Drag-and-drop itinerary builder', ratiba: true, competitor: false },
      { name: 'Interactive client proposals', ratiba: true, competitor: false },
      { name: 'Automated costing & margins', ratiba: true, competitor: false },
      { name: 'Multi-currency pricing', ratiba: true, competitor: false },
      { name: 'Branded PDF exports', ratiba: true, competitor: false },
      { name: 'Client comments & approvals', ratiba: true, competitor: false },
      { name: 'Safari content library', ratiba: true, competitor: false },
      { name: 'Real-time team collaboration', ratiba: true, competitor: false },
      { name: 'CRM & lead management', ratiba: true, competitor: false },
      { name: 'Version history & audit trail', ratiba: true, competitor: false },
      { name: 'WhatsApp integration', ratiba: true, competitor: false },
      { name: 'Safari-specific templates', ratiba: true, competitor: false },
      { name: 'Automated follow-ups', ratiba: true, competitor: false },
      { name: 'Mobile-optimized proposals', ratiba: true, competitor: false },
      { name: 'Single source of truth', ratiba: true, competitor: false },
    ],
    pricing: [
      {
        plan: 'Starter',
        ratibaPrice: '$49/mo',
        competitorPrice: 'Free (or $7–20/mo for Office 365)',
        highlights: [
          'Excel is free/cheap but costs you time',
          'Ratiba pays for itself in hours saved',
          '1 extra proposal closed per month covers the cost',
        ],
      },
      {
        plan: 'Pro',
        ratibaPrice: '$99/mo (3 members)',
        competitorPrice: 'Free (or $12–22/user/mo for Office 365)',
        highlights: [
          'Spreadsheets don\'t scale with teams',
          'Ratiba keeps pricing, proposals, and clients in sync',
          'No more version conflicts or lost files',
        ],
      },
      {
        plan: 'Business',
        ratibaPrice: '$249/mo (unlimited members)',
        competitorPrice: 'Free (or $22/user/mo for Office 365)',
        highlights: [
          'At scale, spreadsheet chaos costs real revenue',
          'Ratiba gives your whole team one source of truth',
          'Professional proposals that convert better',
        ],
      },
    ],
    faqs: [
      {
        question: 'Why should I stop using Excel for safari itineraries?',
        answer:
          'Excel works for basic costing, but it can\'t generate client-facing proposals, track team changes, or automate pricing across currencies. As you grow, the manual work compounds — Ratiba automates the repetitive parts so you can focus on selling.',
      },
      {
        question: 'Is it worth paying for Ratiba when Excel is free?',
        answer:
          'If you close even one extra trip per month thanks to better-looking proposals, Ratiba pays for itself many times over. Most operators report saving 5–10 hours per week on proposal creation alone.',
      },
      {
        question: 'Can I import my existing Excel data into Ratiba?',
        answer:
          'Yes. Ratiba offers free onboarding assistance where we help you migrate your supplier data, pricing templates, and accommodation details from your existing spreadsheets.',
      },
      {
        question: 'Do my clients see a difference?',
        answer:
          'Absolutely. Instead of a Word doc email attachment, your clients get a beautiful, interactive proposal they can view on their phone, comment on, and approve — making you look more professional and trustworthy.',
      },
      {
        question: 'How long does it take to switch from spreadsheets?',
        answer:
          'Most operators are up and running within a day. Ratiba\'s onboarding team helps you set up your templates, import your data, and send your first proposal quickly.',
      },
    ],
  },
};

export function getCompetitor(slug: string): CompetitorData | undefined {
  return COMPETITORS[slug];
}

export function getAllCompetitorSlugs(): string[] {
  return Object.keys(COMPETITORS);
}
