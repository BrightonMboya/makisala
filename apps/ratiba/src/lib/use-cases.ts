export type UseCaseData = {
  name: string;
  slug: string;
  headline: string;
  subtitle: string;
  excerpt: string;
  painPoints: Array<{ title: string; description: string }>;
  solutions: Array<{ title: string; description: string; image: string }>;
  features: string[];
  faqs: Array<{ question: string; answer: string }>;
};

const IMAGES = {
  ai: 'https://brand.makisala.com/ai-feat.jpg',
  library: 'https://brand.makisala.com/content-library.jpg',
  team: 'https://brand.makisala.com/team_tagging.jpg',
  comments: 'https://brand.makisala.com/comments.jpg',
};

export const USE_CASES: Record<string, UseCaseData> = {
  'safari-operators': {
    name: 'Safari Operators',
    slug: 'safari-operators',
    headline: 'Safari Operator Software',
    subtitle:
      'Stop juggling spreadsheets and Word documents. Ratiba gives solo operators and small safari companies one workspace to build itineraries, price trips, and send proposals clients actually want to read.',
    excerpt:
      'Ratiba is purpose-built safari operator software. Build itineraries, calculate margins, and send interactive proposals — all in one tool designed for how safari businesses work.',
    painPoints: [
      {
        title: 'Hours lost on manual itineraries',
        description:
          'You copy-paste lodge descriptions into Word, update pricing in Excel, and export a PDF that looks the same as every other operator. Each proposal takes 2-3 hours.',
      },
      {
        title: 'Pricing errors eat your margins',
        description:
          'Seasonal rates, park fees, and currency conversions live in different spreadsheets. One wrong formula and you lose money on a trip — or worse, quote too high and lose the client.',
      },
      {
        title: 'No visibility into your pipeline',
        description:
          'You send a proposal and wait. No idea if the client opened it, which trips they liked, or when to follow up. Your inbox is your CRM.',
      },
    ],
    solutions: [
      {
        title: 'AI-powered itinerary builder',
        description:
          'Describe the trip — destinations, days, budget — and Ratiba generates a polished day-by-day itinerary using lodges and activities from your content library. Edit, refine, and send in minutes instead of hours.',
        image: IMAGES.ai,
      },
      {
        title: 'Built-in pricing engine',
        description:
          'Set per-night rates, seasonal pricing, and markup rules once. Ratiba calculates margins and totals automatically as you build the trip — no spreadsheet required.',
        image: IMAGES.library,
      },
      {
        title: 'Live client proposals',
        description:
          'Send interactive, mobile-optimized proposals your clients can view, comment on, and approve — no PDFs, no downloads, no back-and-forth. Know exactly when they open it.',
        image: IMAGES.team,
      },
    ],
    features: [
      'Drag-and-drop day-by-day scheduling',
      'Automated margin and cost calculations',
      'Shareable proposal links with client commenting',
      'Content library for lodges, activities, and destinations',
      'Multi-currency pricing with auto-conversion',
      'Instant PDF export when clients need it',
      'Team collaboration with role-based access',
      'Revenue dashboards and pipeline tracking',
    ],
    faqs: [
      {
        question: 'Is Ratiba built specifically for safari operators?',
        answer:
          'Yes. Every feature — from game-drive scheduling to lodge content management — is designed around how safari businesses actually work. No generic tour platform bloat.',
      },
      {
        question: 'How long does it take to set up?',
        answer:
          'Most operators are sending proposals within a day. Our team handles migration of your lodge database, pricing, and content — free of charge.',
      },
      {
        question: 'Can I use Ratiba as a solo operator?',
        answer:
          'Absolutely. Ratiba scales from solo operators to large teams. The Starter plan is designed for individual operators who want to save time and send better proposals.',
      },
      {
        question: 'Do my clients need to create an account?',
        answer:
          'No. Clients receive a link and can view the full itinerary, leave comments, and approve the trip — all without creating an account or downloading anything.',
      },
      {
        question: 'How does Ratiba compare to using Word and Excel?',
        answer:
          'Ratiba replaces the entire Word + Excel + email workflow. You build itineraries, calculate pricing, and share proposals in one tool — saving 2-3 hours per proposal on average.',
      },
      {
        question: 'Is there a free trial?',
        answer:
          'Yes. Every new account starts with a 14-day free trial — no credit card required. You can send real proposals to clients from day one.',
      },
    ],
  },

  dmcs: {
    name: 'DMCs',
    slug: 'dmcs',
    headline: 'DMC Software',
    subtitle:
      'Destination management companies handle complex multi-supplier itineraries with tight margins. Ratiba gives your team a shared workspace to build, price, and deliver trips without the operational chaos.',
    excerpt:
      'Ratiba is built for destination management companies. Manage suppliers, build multi-day itineraries, and send polished proposals — all from one platform your whole team shares.',
    painPoints: [
      {
        title: 'Too many cooks, no shared kitchen',
        description:
          'Sales builds the itinerary, ops reprices it, and the client gets a different version. Without a single source of truth, your team wastes time on version conflicts and miscommunication.',
      },
      {
        title: 'Supplier management is a mess',
        description:
          'Rates from lodges, transport providers, and activity vendors live in emails, PDFs, and spreadsheets. Pulling together an accurate quote means chasing information across a dozen sources.',
      },
      {
        title: 'Scaling means more headcount, not efficiency',
        description:
          'Every new booking requires the same manual work. You hire more staff to handle volume instead of streamlining the process — and per-seat software pricing makes it worse.',
      },
    ],
    solutions: [
      {
        title: 'One workspace for sales and ops',
        description:
          'Sales and operations work on the same live itinerary. No version conflicts, no handoff errors. Tag teammates, leave comments, and keep everyone aligned without email chains.',
        image: IMAGES.team,
      },
      {
        title: 'Centralized supplier database',
        description:
          'Store all your lodge descriptions, rates, and supplier details in one content library. Drag them into any itinerary — consistent, accurate, and always up to date.',
        image: IMAGES.library,
      },
      {
        title: 'Client-facing proposals that close',
        description:
          'Send interactive proposals your inbound agents and direct clients can view, comment on, and approve in one click. No more PDF ping-pong.',
        image: IMAGES.comments,
      },
    ],
    features: [
      'Multi-supplier itinerary building',
      'Role-based permissions for sales, ops, and management',
      'Centralized content library for lodges and activities',
      'Real-time team collaboration and commenting',
      'Automated costing with margin tracking',
      'Multi-currency support',
      'Shareable client proposals with approval workflow',
      'Revenue dashboards per team or department',
    ],
    faqs: [
      {
        question: 'Can different team members have different access levels?',
        answer:
          'Yes. Ratiba supports role-based permissions so sales, ops, and management each see what they need. Control who can edit pricing, approve proposals, or access revenue data.',
      },
      {
        question: 'How does Ratiba handle multi-supplier itineraries?',
        answer:
          'Build itineraries that pull from multiple suppliers — lodges, transport, activities — all with their own rates and availability. Ratiba calculates the full cost and margin automatically.',
      },
      {
        question: 'Can we use Ratiba alongside our existing booking system?',
        answer:
          'Yes. Ratiba focuses on the proposal and itinerary workflow. Many DMCs use it alongside their reservation system for the front-end sales process.',
      },
      {
        question: 'Is there a limit on team members?',
        answer:
          'The Business plan includes unlimited team seats at no extra per-user cost. Add your entire team — sales, ops, guides — without worrying about ballooning fees.',
      },
      {
        question: 'How long does migration take?',
        answer:
          'Our team handles the full migration — lodge data, pricing, descriptions, images. Most DMCs are up and running within a week.',
      },
    ],
  },

  'travel-agents': {
    name: 'Travel Agents',
    slug: 'travel-agents',
    headline: 'Travel Agent Itinerary Builder',
    subtitle:
      'Your clients expect stunning, detailed proposals — not generic PDFs. Ratiba helps travel agents build beautiful safari itineraries and send proposals that win bookings.',
    excerpt:
      'Ratiba helps travel agents build stunning safari itineraries and send interactive proposals that clients can approve in one click. No more Word docs and spreadsheets.',
    painPoints: [
      {
        title: 'Generic proposals lose bookings',
        description:
          'Clients compare your PDF to the operator down the road — and they look the same. Without visual, interactive proposals, you are competing on price alone.',
      },
      {
        title: 'Building itineraries takes too long',
        description:
          'You research lodges, copy descriptions, format the document, and manually calculate pricing. A single 10-day safari proposal can take half a day to put together.',
      },
      {
        title: 'Follow-up is guesswork',
        description:
          'You send a proposal and hope. No way to know if the client opened it, how long they spent reading, or which parts interested them. Follow-up timing is pure luck.',
      },
    ],
    solutions: [
      {
        title: 'Interactive proposals that impress',
        description:
          'Send clients a branded, mobile-optimized proposal they can scroll through, comment on, and approve — all from their phone. Stand out from every other agent sending PDFs.',
        image: IMAGES.comments,
      },
      {
        title: 'Build itineraries in minutes',
        description:
          'Start from a template or let AI generate a draft. Drag in lodges and activities from your content library, adjust the schedule, and your proposal is ready to send.',
        image: IMAGES.ai,
      },
      {
        title: 'Know when clients engage',
        description:
          'See when your client opens the proposal, which days they spend the most time on, and when they leave comments. Follow up at exactly the right moment.',
        image: IMAGES.library,
      },
    ],
    features: [
      'Branded proposal themes with your logo and colors',
      'AI-powered itinerary generation from a brief',
      'Client commenting and approval workflow',
      'Pre-built safari itinerary templates',
      'Multi-currency pricing with automatic conversion',
      'Instant PDF export for offline sharing',
      'Lodge and activity content library',
    ],
    faqs: [
      {
        question: 'Can I brand proposals with my own logo and colors?',
        answer:
          'Yes. Upload your logo, set your brand colors, and choose from multiple proposal themes. Every proposal looks like it came from your own design team.',
      },
      {
        question: 'Do I need to know the lodges and routes myself?',
        answer:
          'Ratiba comes with a growing content library of lodges and activities. You can also add your own preferred suppliers and descriptions.',
      },
      {
        question: 'Can I share proposals with my clients via WhatsApp?',
        answer:
          'Yes. Every proposal generates a shareable link that works perfectly on mobile. Send it via WhatsApp, email, or any messaging app.',
      },
      {
        question: 'How is this different from Canva or Google Docs?',
        answer:
          'Ratiba is purpose-built for safari itineraries. It handles day-by-day scheduling, pricing calculations, and client approval — things no generic document tool can do.',
      },
      {
        question: 'What does it cost?',
        answer:
          'Plans start at $49/month. Every new account gets a 14-day free trial — no credit card required.',
      },
    ],
  },

  'tour-companies': {
    name: 'Tour Companies',
    slug: 'tour-companies',
    headline: 'Tour Company Management Software',
    subtitle:
      'Established tour companies need tools that scale. Ratiba gives your team a shared platform to build itineraries, manage pricing, and send proposals — without per-seat fees slowing you down.',
    excerpt:
      'Ratiba helps tour companies streamline itinerary creation, pricing, and proposals. One workspace for your entire team — no per-seat fees, no version chaos.',
    painPoints: [
      {
        title: 'Every proposal is built from scratch',
        description:
          'Your team rebuilds the same itineraries over and over. There is no central template library, so every sales rep starts from a blank document — wasting hours each week.',
      },
      {
        title: 'Pricing inconsistency across the team',
        description:
          'Different reps use different rate sheets. Without a centralized pricing engine, you get inconsistent quotes, margin leakage, and awkward conversations with clients.',
      },
      {
        title: 'Software costs scale with headcount',
        description:
          'Most tour software charges per seat. A growing team of 10-15 people means $1,000+ per month just for proposal tools — before you have sent a single trip.',
      },
    ],
    solutions: [
      {
        title: 'Template library for your best trips',
        description:
          'Save your most popular itineraries as templates. Any team member can start from a proven trip, customize for the client, and send a polished proposal in minutes.',
        image: IMAGES.library,
      },
      {
        title: 'Centralized pricing engine',
        description:
          'Set rates, seasonal adjustments, and margin rules in one place. Every proposal your team sends uses the same accurate pricing — no more spreadsheet discrepancies.',
        image: IMAGES.ai,
      },
      {
        title: 'Unlimited team seats',
        description:
          'Add your entire team — sales, ops, guides, management — without paying per seat. Ratiba grows with your company, not against your budget.',
        image: IMAGES.team,
      },
    ],
    features: [
      'Shared itinerary template library',
      'Centralized pricing with margin controls',
      'Unlimited team members on Business plan',
      'Role-based permissions and access controls',
      'Real-time collaboration on live itineraries',
      'Client proposals with commenting and approval',
      'Revenue dashboards and reporting',
      'Content library for lodges and activities',
    ],
    faqs: [
      {
        question: 'How many team members can use Ratiba?',
        answer:
          'The Business plan includes unlimited team seats. Add your entire company — sales, operations, management, guides — at no extra cost.',
      },
      {
        question: 'Can we use our existing itinerary templates?',
        answer:
          'Yes. Our team migrates your existing content, templates, and pricing into Ratiba for free. You can also build new templates directly in the platform.',
      },
      {
        question: 'Does Ratiba replace our booking system?',
        answer:
          'Ratiba focuses on the proposal and itinerary workflow — the front-end sales process. Many companies use it alongside their existing reservation or booking system.',
      },
      {
        question: 'Can managers see team performance?',
        answer:
          'Yes. Revenue dashboards show proposals sent, trips booked, and revenue by team member. Management gets full visibility into the sales pipeline.',
      },
      {
        question: 'How does onboarding work for a large team?',
        answer:
          'We run live onboarding sessions for your team, handle data migration, and provide ongoing support. Most teams are fully productive within a week.',
      },
    ],
  },

  'luxury-travel': {
    name: 'Luxury Travel',
    slug: 'luxury-travel',
    headline: 'Luxury Travel Proposal Software',
    subtitle:
      'Luxury clients expect an experience before the trip even begins. Ratiba helps you create stunning, interactive proposals that match the quality of the journeys you sell.',
    excerpt:
      'Create luxury safari proposals that match the quality of your trips. Ratiba delivers interactive, beautifully designed itineraries your high-end clients will love.',
    painPoints: [
      {
        title: 'Your proposals do not match your brand',
        description:
          'You sell $50,000 trips but present them in the same Word document template everyone uses. The proposal experience does not reflect the luxury experience you deliver.',
      },
      {
        title: 'Personalization takes forever',
        description:
          'Luxury clients expect every detail tailored — special requests, private guides, exclusive experiences. Customizing each proposal manually eats into your day.',
      },
      {
        title: 'Clients expect instant responsiveness',
        description:
          'High-end travelers are used to concierge-level service. They want changes reflected immediately, not a 24-hour turnaround on a revised PDF.',
      },
    ],
    solutions: [
      {
        title: 'Magazine-quality proposals',
        description:
          'Send interactive proposals with full-bleed imagery, elegant typography, and smooth scrolling. Every proposal feels like a luxury travel magazine — because that is what your clients expect.',
        image: IMAGES.comments,
      },
      {
        title: 'Deep personalization, fast',
        description:
          'Start from a template and customize every detail — private activities, exclusive lodges, special occasions. AI helps you draft personalized descriptions so each trip feels one-of-a-kind.',
        image: IMAGES.ai,
      },
      {
        title: 'Real-time collaboration with clients',
        description:
          'Clients comment directly on the proposal. Make changes and they see updates instantly — no new PDF, no email attachment, no waiting.',
        image: IMAGES.library,
      },
    ],
    features: [
      'Premium proposal themes with full-bleed imagery',
      'AI-assisted personalized descriptions',
      'Real-time client commenting and approvals',
      'Custom branding with your logo and color palette',
      'High-resolution image galleries per day',
      'Multi-currency pricing for international clients',
      'Instant revisions visible to clients immediately',
    ],
    faqs: [
      {
        question: 'Can I customize the proposal design to match my brand?',
        answer:
          'Yes. Upload your logo, set your brand colors, and choose from premium themes designed for luxury travel. Every proposal reflects your brand identity.',
      },
      {
        question: 'How do luxury clients interact with the proposal?',
        answer:
          'Clients receive a link to a beautiful, mobile-optimized proposal. They can scroll through the itinerary, view image galleries, leave comments on specific days, and approve the trip — all without creating an account.',
      },
      {
        question: 'Can I include private experiences and custom activities?',
        answer:
          'Absolutely. Add any custom activity, private guide, or exclusive experience to the itinerary. Every element is fully editable and personalizable.',
      },
      {
        question: 'Is Ratiba suitable for ultra-luxury trips?',
        answer:
          'Yes. Ratiba handles trips at any price point. The proposal experience is designed to match the quality your clients expect from a luxury operator.',
      },
      {
        question: 'Do you offer white-label proposals?',
        answer:
          'Yes. On the Business plan, proposals are fully white-labeled — your brand, your domain, no Ratiba branding visible to clients.',
      },
    ],
  },

  'group-tours': {
    name: 'Group Tours',
    slug: 'group-tours',
    headline: 'Group Tour Itinerary Builder',
    subtitle:
      'Group departures and shared safaris need clear, shareable itineraries that every traveler can access. Ratiba makes it easy to build, share, and manage group trip proposals.',
    excerpt:
      'Build and share group safari itineraries with Ratiba. Create shareable proposals for group departures that every traveler can view and approve.',
    painPoints: [
      {
        title: 'Sharing itineraries with groups is painful',
        description:
          'You email a PDF to one person and hope it gets forwarded. Half the group has questions, the other half has not read it. Managing communication across 10-20 travelers is chaos.',
      },
      {
        title: 'Pricing per person is error-prone',
        description:
          'Group pricing with shared costs, single supplements, and tiered discounts is complex. One mistake in the spreadsheet and your margin disappears.',
      },
      {
        title: 'Last-minute changes cascade everywhere',
        description:
          'One traveler drops out or a lodge changes availability. You update the itinerary, recalculate pricing, regenerate the PDF, and re-send to everyone. Every change is a 30-minute task.',
      },
    ],
    solutions: [
      {
        title: 'One link for the entire group',
        description:
          'Share a single proposal link with every traveler. Everyone sees the same up-to-date itinerary — no more version confusion or forwarded attachments.',
        image: IMAGES.comments,
      },
      {
        title: 'Automatic group pricing',
        description:
          'Set per-person rates, shared costs, and single supplements. Ratiba recalculates automatically when group size changes — no spreadsheet gymnastics.',
        image: IMAGES.ai,
      },
      {
        title: 'Real-time updates for everyone',
        description:
          'Change a lodge, swap an activity, or adjust the schedule — every traveler sees the update instantly. No re-sending, no re-downloading.',
        image: IMAGES.library,
      },
    ],
    features: [
      'Shareable group proposal links',
      'Per-person and shared cost pricing',
      'Single supplement calculations',
      'Real-time itinerary updates visible to all travelers',
      'Group commenting and feedback',
      'Multi-departure template management',
      'Instant PDF export for travel documents',
    ],
    faqs: [
      {
        question: 'Can every traveler in the group view the itinerary?',
        answer:
          'Yes. Share one link and every traveler can view the full itinerary, see pricing, and leave comments — no account required.',
      },
      {
        question: 'How does group pricing work?',
        answer:
          'Set per-person rates, shared costs (like vehicle hire), and optional single supplements. Ratiba automatically calculates per-person totals as group size changes.',
      },
      {
        question: 'Can I manage multiple departures of the same trip?',
        answer:
          'Yes. Save a trip as a template and create new departures with different dates and group sizes. Each departure gets its own shareable proposal.',
      },
      {
        question: 'What happens when someone drops out of the group?',
        answer:
          'Adjust the group size and Ratiba recalculates pricing for everyone automatically. The updated proposal is visible instantly — no manual rework.',
      },
      {
        question: 'Can I use Ratiba for both group and private trips?',
        answer:
          'Absolutely. Ratiba handles both private custom safaris and group departures. Switch between pricing modes depending on the trip type.',
      },
    ],
  },

  'honeymoon-planners': {
    name: 'Honeymoon Planners',
    slug: 'honeymoon-planners',
    headline: 'Honeymoon Itinerary Builder',
    subtitle:
      'Honeymoon trips deserve proposals as special as the occasion. Ratiba helps you build romantic, beautifully presented safari itineraries that couples will remember before the trip even starts.',
    excerpt:
      'Create stunning honeymoon safari proposals with Ratiba. Build romantic itineraries with beautiful imagery and send interactive proposals couples will love.',
    painPoints: [
      {
        title: 'Couples expect a premium experience',
        description:
          'Honeymoon clients are emotionally invested. A generic PDF with bullet points does not capture the romance and excitement of the trip you are planning for them.',
      },
      {
        title: 'Two decision-makers, double the back-and-forth',
        description:
          'Both partners weigh in, often at different times. Email threads get long, feedback gets lost, and you end up with three different versions of the same itinerary.',
      },
      {
        title: 'Special requests are hard to track',
        description:
          'Anniversary dinners, spa treatments, private sundowners — honeymoon trips are full of special touches that get lost in email chains and spreadsheet notes.',
      },
    ],
    solutions: [
      {
        title: 'Visually stunning proposals',
        description:
          'Send proposals with beautiful full-width imagery, elegant layouts, and smooth scrolling. The proposal itself becomes part of the honeymoon excitement.',
        image: IMAGES.comments,
      },
      {
        title: 'Both partners collaborate in one place',
        description:
          'Share one proposal link with both partners. They can both view the itinerary, leave comments, and approve — no more relay-messaging through one person.',
        image: IMAGES.team,
      },
      {
        title: 'Every special touch documented',
        description:
          'Add special requests, romantic extras, and personalized notes directly into the itinerary. Nothing gets lost between booking and arrival.',
        image: IMAGES.library,
      },
    ],
    features: [
      'Romantic proposal themes with premium imagery',
      'Couple collaboration with shared commenting',
      'Special request tracking per day',
      'Personalized welcome notes and descriptions',
      'AI-assisted romantic itinerary generation',
      'Multi-currency pricing for international couples',
      'Instant PDF export for travel planning',
    ],
    faqs: [
      {
        question: 'Can both partners view and comment on the proposal?',
        answer:
          'Yes. Share one link and both partners can view the full itinerary, leave comments on specific days, and approve the trip together.',
      },
      {
        question: 'Are there proposal themes designed for honeymoons?',
        answer:
          'Yes. Ratiba includes premium themes with full-bleed imagery and elegant typography — perfect for presenting romantic safari itineraries.',
      },
      {
        question: 'Can I add special touches like private dinners?',
        answer:
          'Absolutely. Add any custom experience — bush dinners, spa treatments, private game drives, sundowners — directly into the day-by-day itinerary with descriptions and images.',
      },
      {
        question: 'How do honeymoon clients typically interact with proposals?',
        answer:
          'Couples usually browse the proposal on their phones, share it with each other, and leave comments on the days that excite them most. The interactive format creates excitement before the trip.',
      },
      {
        question: 'Can I include beach extensions in the itinerary?',
        answer:
          'Yes. Build multi-destination itineraries that combine safari with beach stays, island getaways, or city stopovers. Each segment has its own pricing and descriptions.',
      },
    ],
  },

  'adventure-travel': {
    name: 'Adventure Travel',
    slug: 'adventure-travel',
    headline: 'Adventure Tour Operator Software',
    subtitle:
      'Adventure travel is about the experience — your proposals should be too. Ratiba helps adventure operators build dynamic itineraries that capture the thrill of the trip and close bookings faster.',
    excerpt:
      'Ratiba helps adventure tour operators build dynamic itineraries, manage trip logistics, and send interactive proposals that capture the excitement of the adventure.',
    painPoints: [
      {
        title: 'Complex logistics, simple tools',
        description:
          'Multi-activity trips with varying difficulty levels, gear requirements, and timing constraints are hard to plan in a spreadsheet. Your tools do not match the complexity of your trips.',
      },
      {
        title: 'Proposals do not convey the adventure',
        description:
          'A plain PDF cannot capture the excitement of a walking safari, a canoe trip, or a mountain bike ride through the bush. Static documents undersell the experience.',
      },
      {
        title: 'Activity-level pricing is a headache',
        description:
          'Different activities have different costs, different group minimums, and different seasonal availability. Calculating accurate trip totals means juggling multiple rate sheets.',
      },
    ],
    solutions: [
      {
        title: 'Dynamic, visual proposals',
        description:
          'Send proposals with action imagery, detailed activity descriptions, and day-by-day breakdowns that make clients feel the adventure before they book.',
        image: IMAGES.ai,
      },
      {
        title: 'Activity-level itinerary builder',
        description:
          'Build itineraries activity by activity. Add timing, difficulty levels, and gear notes alongside lodge stays and transfers. Every element lives in one timeline.',
        image: IMAGES.library,
      },
      {
        title: 'Flexible pricing per activity',
        description:
          'Set pricing at the activity level — different rates for walking safaris, game drives, canoe trips, and bike rides. Ratiba totals everything automatically.',
        image: IMAGES.team,
      },
    ],
    features: [
      'Activity-level itinerary building',
      'Dynamic visual proposals with action imagery',
      'Per-activity pricing and costing',
      'Gear and preparation notes per day',
      'Multi-activity trip templates',
      'Client proposals with commenting and approval',
      'Group size and minimum calculations',
      'Content library for activities and destinations',
    ],
    faqs: [
      {
        question: 'Can I build itineraries with multiple activities per day?',
        answer:
          'Yes. Add as many activities as needed per day — morning game drive, afternoon walking safari, evening sundowner. Each activity has its own description, timing, and pricing.',
      },
      {
        question: 'Does Ratiba support adventure-specific details like gear lists?',
        answer:
          'Yes. Add preparation notes, gear requirements, fitness levels, and other details directly into each day or activity. Clients see everything in the proposal.',
      },
      {
        question: 'Can I create templates for popular adventure trips?',
        answer:
          'Absolutely. Save your most popular trips as templates and customize them per client. Start from a proven itinerary instead of building from scratch every time.',
      },
      {
        question: 'How does pricing work for multi-activity trips?',
        answer:
          'Set rates per activity, per lodge night, and per transfer. Ratiba calculates the total trip cost and your margin automatically as you build the itinerary.',
      },
      {
        question: 'Is Ratiba suitable for walking safaris and canoe trips?',
        answer:
          'Yes. Ratiba works for any type of safari or adventure trip — game drives, walking safaris, canoe safaris, mountain biking, horseback riding, and more.',
      },
    ],
  },

  'trekking-operators': {
    name: 'Trekking Operators',
    slug: 'trekking-operators',
    headline: 'Trekking Itinerary Software',
    subtitle:
      'From Kilimanjaro summits to gorilla trekking permits, trekking trips need detailed day-by-day planning. Ratiba helps trekking operators build precise itineraries and send proposals clients trust.',
    excerpt:
      'Build detailed trekking itineraries for Kilimanjaro, gorilla trekking, and mountain expeditions. Ratiba helps trekking operators plan, price, and present trips professionally.',
    painPoints: [
      {
        title: 'Day-by-day precision matters',
        description:
          'Trekking itineraries need exact camp locations, elevation profiles, and distance details. A vague proposal does not build the confidence clients need to book a challenging trip.',
      },
      {
        title: 'Permit and logistics coordination',
        description:
          'Park permits, porter arrangements, and gear logistics are complex. Tracking what is included in the price and what is extra creates confusion for both you and the client.',
      },
      {
        title: 'Clients need reassurance, not just information',
        description:
          'First-time trekkers have dozens of questions. Static PDFs cannot address concerns about fitness, preparation, or what to expect each day — leading to long email threads.',
      },
    ],
    solutions: [
      {
        title: 'Detailed day-by-day itineraries',
        description:
          'Build itineraries with camp names, distances, elevation details, and timing. Clients see exactly what each day looks like — building confidence and reducing pre-trip anxiety.',
        image: IMAGES.ai,
      },
      {
        title: 'Inclusive pricing, clearly presented',
        description:
          'Show clients exactly what is included — permits, meals, camping gear, porters — and what is not. Transparent pricing builds trust and reduces back-and-forth questions.',
        image: IMAGES.library,
      },
      {
        title: 'Interactive proposals with FAQs built in',
        description:
          'Add preparation guides, gear lists, and fitness recommendations directly into the proposal. Clients get all their answers in one place instead of emailing you 20 times.',
        image: IMAGES.comments,
      },
    ],
    features: [
      'Day-by-day trekking itinerary builder',
      'Camp and elevation detail tracking',
      'Inclusive/exclusive pricing breakdown',
      'Preparation guides and gear lists per trip',
      'Client proposals with built-in FAQs',
      'Route templates for popular treks',
      'Group pricing with porter/guide calculations',
      'Multi-currency pricing for international clients',
    ],
    faqs: [
      {
        question: 'Can I include elevation and distance details?',
        answer:
          'Yes. Add elevation gain, distance, and estimated walking time for each day. Clients see the full trekking profile alongside camp descriptions and images.',
      },
      {
        question: 'Does Ratiba support Kilimanjaro route templates?',
        answer:
          'Yes. Create templates for popular routes — Machame, Lemosho, Marangu, Rongai — and customize them per group. Start from a proven itinerary every time.',
      },
      {
        question: 'How do I show what is included in the price?',
        answer:
          'Ratiba lets you clearly list inclusions and exclusions in the proposal. Clients see exactly what they are paying for — permits, meals, gear, porters — with no surprises.',
      },
      {
        question: 'Can I add preparation and fitness guides?',
        answer:
          'Absolutely. Add gear checklists, fitness recommendations, and preparation timelines directly into the proposal. Clients get everything they need in one place.',
      },
      {
        question: 'Is Ratiba suitable for gorilla trekking itineraries?',
        answer:
          'Yes. Build gorilla trekking itineraries with permit details, lodge stays, and transfer logistics. The same tool works for any type of trekking or hiking trip.',
      },
      {
        question: 'Can I combine trekking with safari in one itinerary?',
        answer:
          'Yes. Build multi-segment itineraries that combine a Kilimanjaro trek with a safari extension or beach stay. Each segment has its own pricing and day-by-day details.',
      },
    ],
  },
};

export function getUseCase(slug: string): UseCaseData | undefined {
  return USE_CASES[slug];
}

export function getAllUseCaseSlugs(): string[] {
  return Object.keys(USE_CASES);
}
