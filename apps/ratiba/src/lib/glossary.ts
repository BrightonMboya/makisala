export type GlossaryTerm = {
  term: string;
  slug: string;
  fullName: string;
  definition: string;
  details: string;
  relatedTerms: string[];
  howRatibaHelps: string;
};

const GLOSSARY: Record<string, GlossaryTerm> = {
  dmc: {
    term: 'DMC',
    slug: 'dmc',
    fullName: 'Destination Management Company',
    definition:
      'A DMC is a local company that provides ground services — logistics, accommodation, transport, and activities — to inbound tour operators and travel agents. DMCs are the on-the-ground experts who make itineraries happen.',
    details:
      'Destination Management Companies act as the operational backbone for international tour operators who sell trips into a region but lack local infrastructure. A DMC in Tanzania, for example, would handle lodge bookings, vehicle allocation, guide assignments, and park permits on behalf of an overseas partner.\n\nDMCs typically work on net rates, adding a markup before quoting their partner operators. They need systems that handle complex multi-supplier pricing, seasonal rate changes, and high volumes of itinerary requests — often with tight turnaround times.',
    relatedTerms: ['inbound-tour-operator', 'ground-handler', 'net-rate', 'markup'],
    howRatibaHelps:
      'Ratiba gives DMCs a single workspace to build itineraries, manage supplier rates, and send polished proposals to partner operators — replacing spreadsheets and email chains with a purpose-built tool.',
  },
  fit: {
    term: 'FIT',
    slug: 'fit',
    fullName: 'Free Independent Traveler',
    definition:
      'FIT refers to a traveler who books a custom, independent trip rather than joining a group tour. In the safari industry, FIT itineraries are tailor-made for individuals, couples, or families with flexible schedules and personalized preferences.',
    details:
      'FIT travel is the backbone of the luxury safari market. Unlike group departures with fixed dates and routes, FIT trips are built from scratch for each client — choosing specific lodges, activities, and travel dates based on personal preferences and budget.\n\nFor tour operators, FIT bookings require more planning effort per client but typically generate higher margins. Each itinerary is unique, which makes having a flexible itinerary builder essential for operators who handle significant FIT volume.',
    relatedTerms: ['tour-operator', 'rack-rate', 'single-supplement', 'per-person-sharing'],
    howRatibaHelps:
      'Ratiba\'s AI itinerary builder lets operators create custom FIT proposals in minutes instead of hours, pulling from their content library and calculating pricing automatically.',
  },
  'inbound-tour-operator': {
    term: 'Inbound tour operator',
    slug: 'inbound-tour-operator',
    fullName: 'Inbound Tour Operator',
    definition:
      'An inbound tour operator receives travelers coming into a destination country and handles all local arrangements. In East Africa, inbound operators organize safaris, transfers, accommodation, and guided experiences for international visitors.',
    details:
      'Inbound tour operators are the destination-side counterpart to outbound operators. They specialize in a specific country or region and have direct relationships with lodges, vehicle providers, and local guides. International agents and outbound operators rely on inbound operators for local expertise and competitive ground rates.\n\nMost safari companies in Tanzania and Kenya operate as inbound tour operators, receiving bookings from agents and direct clients worldwide. Their workflow revolves around building itineraries, quoting accurate prices, and converting inquiries into confirmed bookings.',
    relatedTerms: ['outbound-tour-operator', 'dmc', 'ground-handler', 'travel-agent'],
    howRatibaHelps:
      'Ratiba is purpose-built for inbound safari operators — from itinerary creation and seasonal pricing to shareable client proposals that close trips faster.',
  },
  'outbound-tour-operator': {
    term: 'Outbound tour operator',
    slug: 'outbound-tour-operator',
    fullName: 'Outbound Tour Operator',
    definition:
      'An outbound tour operator sells and packages trips to destinations outside the traveler\'s home country. They work with inbound operators or DMCs at the destination to deliver the ground services.',
    details:
      'Outbound operators are typically based in source markets like the US, UK, Germany, or Australia. They market safari holidays to their local audience, handle client communication and payments, and partner with inbound operators in East Africa to execute the trip on the ground.\n\nThe outbound operator focuses on sales, marketing, and client relationships, while relying on their destination partners for accurate pricing, availability, and logistics. Clear, professional proposals from their inbound partners directly affect their conversion rates.',
    relatedTerms: ['inbound-tour-operator', 'travel-agent', 'commission', 'rack-rate'],
    howRatibaHelps:
      'When inbound operators use Ratiba, outbound partners receive polished, interactive proposals they can forward directly to their clients — replacing static PDFs and speeding up the sales cycle.',
  },
  'ground-handler': {
    term: 'Ground handler',
    slug: 'ground-handler',
    fullName: 'Ground Handler',
    definition:
      'A ground handler is a local company that manages on-the-ground logistics for tours — vehicles, drivers, guides, permits, and transfers. They execute the operational side of an itinerary once it\'s sold.',
    details:
      'Ground handlers focus on execution rather than sales. While tour operators build and sell the itinerary, ground handlers make sure the vehicles are in place, the guides are briefed, and the logistics run smoothly from airport pickup to final departure.\n\nIn some cases, a single company acts as both tour operator and ground handler. In others, especially with larger DMCs, the ground handling is a distinct operational function that needs its own coordination tools and schedules.',
    relatedTerms: ['dmc', 'inbound-tour-operator', 'game-drive', 'fly-in-safari'],
    howRatibaHelps:
      'Ratiba keeps itinerary details, timing, and supplier information in one place — so ground handling teams can see exactly what needs to happen each day without digging through emails.',
  },
  'travel-agent': {
    term: 'Travel agent',
    slug: 'travel-agent',
    fullName: 'Travel Agent',
    definition:
      'A travel agent sells trips on behalf of tour operators and earns a commission on each booking. In the safari industry, agents connect travelers with specialist operators who build and execute the itinerary.',
    details:
      'Travel agents act as intermediaries between the traveler and the operator. They may specialize in safari travel or sell a broader range of holidays. Agents rely on operators to provide accurate quotes, compelling proposals, and timely responses to client inquiries.\n\nFor safari operators, agents are a major source of bookings. Building strong agent relationships depends on fast turnaround, professional proposals, and clear commission structures. Operators who can respond to agent inquiries quickly and with polished materials win more bookings.',
    relatedTerms: ['commission', 'outbound-tour-operator', 'rack-rate', 'tour-operator'],
    howRatibaHelps:
      'Ratiba lets operators respond to agent inquiries with shareable, branded proposals in minutes — helping them win more agent bookings through speed and professionalism.',
  },
  'tour-operator': {
    term: 'Tour operator',
    slug: 'tour-operator',
    fullName: 'Tour Operator',
    definition:
      'A tour operator designs, prices, and sells packaged travel experiences. In the safari industry, tour operators build itineraries combining lodges, activities, transport, and guides into a complete trip.',
    details:
      'Tour operators differ from travel agents in that they create the product rather than just selling it. A safari tour operator selects the lodges, plans the route, sets the pricing, and coordinates logistics. They take on the operational risk and responsibility for delivering the experience.\n\nSafari tour operators range from solo owner-operators running a handful of trips per month to large companies with dedicated sales, operations, and reservations teams. Regardless of size, the core workflow is the same: receive an inquiry, build an itinerary, quote a price, send a proposal, and convert the booking.',
    relatedTerms: ['dmc', 'inbound-tour-operator', 'fit', 'travel-agent'],
    howRatibaHelps:
      'Ratiba replaces the patchwork of spreadsheets, documents, and email that most tour operators use — bringing itinerary building, pricing, and proposals into one integrated workspace.',
  },
  'game-drive': {
    term: 'Game drive',
    slug: 'game-drive',
    fullName: 'Game Drive',
    definition:
      'A game drive is a guided wildlife-viewing excursion in a vehicle, typically in a national park or game reserve. It is the most common safari activity, usually conducted in the early morning or late afternoon when animals are most active.',
    details:
      'Game drives are the core activity in most safari itineraries. They typically last 3-4 hours and are led by an experienced guide in a 4x4 vehicle with open sides or a pop-up roof for unobstructed viewing. Most itineraries include two game drives per day — a morning drive starting at dawn and an afternoon drive returning at sunset.\n\nWhen building itineraries, operators need to schedule game drives around meal times, transfer logistics, and park gate hours. The timing and duration of game drives directly affect the overall day structure and client experience.',
    relatedTerms: ['walking-safari', 'big-five', 'sundowner', 'bush-camp'],
    howRatibaHelps:
      'Ratiba\'s drag-and-drop scheduler lets operators slot game drives into daily itineraries with accurate timing, so clients see exactly what each day looks like.',
  },
  'walking-safari': {
    term: 'Walking safari',
    slug: 'walking-safari',
    fullName: 'Walking Safari',
    definition:
      'A walking safari is a guided bush walk where travelers explore wildlife areas on foot with an armed ranger and experienced guide. It offers a more intimate, sensory experience than a vehicle-based game drive.',
    details:
      'Walking safaris are available in select parks and conservancies where regulations permit foot access. They range from short 2-hour walks near a lodge to multi-day walking expeditions between mobile camps. Walking safaris appeal to experienced safari-goers looking for a deeper connection with the bush.\n\nFor operators, walking safaris require specific permits, qualified walking guides, and sometimes armed rangers — details that need to be reflected in both the itinerary logistics and the pricing. They are a premium product that differentiates an operator\'s offering.',
    relatedTerms: ['game-drive', 'mobile-safari', 'bush-camp', 'fly-in-safari'],
    howRatibaHelps:
      'Ratiba lets operators include walking safari activities with specific guide requirements and permit notes, keeping all logistics visible in the itinerary.',
  },
  'fly-in-safari': {
    term: 'Fly-in safari',
    slug: 'fly-in-safari',
    fullName: 'Fly-in Safari',
    definition:
      'A fly-in safari uses light aircraft to transfer between camps and parks, replacing long road drives. It is common in remote areas of Tanzania, Kenya, and Botswana where road access is limited or time-consuming.',
    details:
      'Fly-in safaris are the premium tier of safari travel. Travelers arrive at bush airstrips by chartered or scheduled light aircraft, minimizing transit time and maximizing time in the wildlife areas. This format is standard in destinations like the Serengeti, Selous (Nyerere), Ruaha, and the Okavango Delta.\n\nFor operators, fly-in safaris involve coordinating flight schedules, weight limits, airstrip logistics, and ground transfers at each end. Pricing includes flight costs that vary by route and season, adding complexity to the quoting process.',
    relatedTerms: ['mobile-safari', 'bush-camp', 'tented-camp', 'high-season'],
    howRatibaHelps:
      'Ratiba handles multi-segment itineraries with flights, ground transfers, and camp stays — calculating total costs including seasonal flight rates automatically.',
  },
  'big-five': {
    term: 'Big Five',
    slug: 'big-five',
    fullName: 'Big Five',
    definition:
      'The Big Five refers to five iconic African wildlife species: lion, leopard, elephant, rhinoceros, and Cape buffalo. The term originated from big-game hunting but is now used in wildlife tourism to describe the most sought-after animals to see on safari.',
    details:
      'The Big Five remains a powerful marketing concept in safari tourism, even though modern travelers are equally interested in broader wildlife experiences. Many clients specifically ask about Big Five sighting opportunities when planning a trip, making it a key selling point in proposals and itinerary descriptions.\n\nOperators often highlight which parks and conservancies offer the best chances for Big Five sightings. For example, the Ngorongoro Crater is known for reliable rhino sightings, while the Serengeti excels for lion and leopard. Including this context in proposals helps set client expectations.',
    relatedTerms: ['game-drive', 'walking-safari', 'lodge', 'migration'],
    howRatibaHelps:
      'Ratiba\'s content library lets operators store destination descriptions with Big Five highlights, so every proposal includes accurate wildlife information.',
  },
  migration: {
    term: 'Migration',
    slug: 'migration',
    fullName: 'Great Migration',
    definition:
      'The Great Migration is the annual circular movement of over 1.5 million wildebeest, along with hundreds of thousands of zebra and gazelle, across the Serengeti-Mara ecosystem. It is one of the world\'s greatest wildlife spectacles and a major driver of East African safari tourism.',
    details:
      'The Migration follows a roughly predictable pattern through the year: calving in the southern Serengeti (January-March), moving northwest through the central Serengeti (April-June), crossing the Grumeti and Mara rivers (July-October), and returning south (November-December). However, exact timing varies with rainfall.\n\nFor safari operators, the Migration heavily influences itinerary design, lodge selection, and pricing. Clients booking migration-focused trips need to be in the right part of the ecosystem at the right time. Operators must stay current on herd movements and adjust recommendations accordingly.',
    relatedTerms: ['high-season', 'game-drive', 'mobile-safari', 'tented-camp'],
    howRatibaHelps:
      'Ratiba helps operators build migration-season itineraries with the right camps and timing, and seasonal pricing rules automatically adjust rates for peak migration periods.',
  },
  'bush-camp': {
    term: 'Bush camp',
    slug: 'bush-camp',
    fullName: 'Bush Camp',
    definition:
      'A bush camp is a small, remote safari accommodation set in a wilderness area with minimal infrastructure. Bush camps prioritize proximity to wildlife and an authentic bush experience over luxury amenities.',
    details:
      'Bush camps typically have 4-10 rooms or tents and are located in prime wildlife areas away from main roads and larger lodges. They range from basic camping setups to comfortable tented accommodations with en-suite facilities. The appeal is exclusivity and immersion in nature.\n\nFor operators, bush camps are a key product for clients seeking authentic safari experiences. They often have limited availability and require advance booking, especially during peak season. Pricing is usually on a full-board basis including all meals, activities, and sometimes drinks.',
    relatedTerms: ['tented-camp', 'mobile-safari', 'full-board', 'walking-safari'],
    howRatibaHelps:
      'Ratiba stores bush camp details, availability notes, and seasonal rates in the content library — making it easy to drop them into itineraries with accurate pricing.',
  },
  'mobile-safari': {
    term: 'Mobile safari',
    slug: 'mobile-safari',
    fullName: 'Mobile Safari',
    definition:
      'A mobile safari uses temporary camps that move to follow wildlife or access remote areas not served by permanent lodges. The camp — including tents, kitchen, and staff — travels with the guests.',
    details:
      'Mobile safaris are the original safari format and remain popular for their flexibility and sense of adventure. A full mobile camp typically includes sleeping tents, a mess tent, bush showers, and a dedicated crew who set up and break down camp as the group moves.\n\nFor operators, mobile safaris are logistically complex. They require coordinating camp crew, vehicles, supplies, permits, and campsites across multiple locations. Pricing must account for the full crew, equipment, and provisions — making accurate costing essential.',
    relatedTerms: ['bush-camp', 'walking-safari', 'fly-in-safari', 'game-drive'],
    howRatibaHelps:
      'Ratiba lets operators map out multi-day mobile safari routes with camp locations, crew logistics, and all-inclusive pricing in a single itinerary view.',
  },
  sundowner: {
    term: 'Sundowner',
    slug: 'sundowner',
    fullName: 'Sundowner',
    definition:
      'A sundowner is drinks and snacks enjoyed at a scenic spot in the bush while watching the sunset. It is a classic safari tradition and a popular inclusion in afternoon game drive itineraries.',
    details:
      'Sundowners are typically arranged at a scenic viewpoint — a hilltop, riverbank, or open plain — where guests enjoy cocktails and canapes as the sun sets. They are a signature touch that elevates the safari experience and are often highlighted in proposals as a memorable moment.\n\nFor operators, sundowners are a low-cost, high-impact addition to an itinerary. They are usually included in the lodge or camp rate on a full-board or all-inclusive basis. Mentioning sundowners in the itinerary adds experiential detail that helps clients visualize the trip.',
    relatedTerms: ['game-drive', 'full-board', 'all-inclusive', 'lodge'],
    howRatibaHelps:
      'Ratiba lets operators add experiential details like sundowners to daily schedules, so proposals read like a story rather than a list of transfers and check-ins.',
  },
  'full-board': {
    term: 'Full board',
    slug: 'full-board',
    fullName: 'Full Board',
    definition:
      'Full board (FB) is an accommodation rate that includes the room plus all three meals — breakfast, lunch, and dinner. It is the most common meal plan basis in the safari industry.',
    details:
      'Full board is the standard pricing basis for safari lodges and camps, where guests eat all meals at the property. It typically does not include drinks (alcoholic or sometimes even soft drinks), laundry, or premium activities like balloon safaris.\n\nOperators need to be clear about what full board includes versus excludes when quoting clients. The distinction between full board and all-inclusive is a common source of confusion and client complaints if not communicated properly in the proposal.',
    relatedTerms: ['half-board', 'all-inclusive', 'bed-and-breakfast', 'rack-rate'],
    howRatibaHelps:
      'Ratiba lets operators specify the meal plan basis for each accommodation in the itinerary, so clients see exactly what is and isn\'t included in their quoted price.',
  },
  'half-board': {
    term: 'Half board',
    slug: 'half-board',
    fullName: 'Half Board',
    definition:
      'Half board (HB) is an accommodation rate that includes the room plus two meals, typically breakfast and dinner. It is less common in safari lodges but standard in some beach hotels and city properties.',
    details:
      'Half board is typically used for non-safari segments of an itinerary — such as a Zanzibar beach extension or a night in Nairobi. In these settings, guests are expected to be out during the day and may choose to eat lunch independently.\n\nFor operators, mixing meal plan bases within a single itinerary (full board at safari camps, half board at the beach hotel) requires clear communication in the proposal. Clients need to understand which meals are included at each stop.',
    relatedTerms: ['full-board', 'bed-and-breakfast', 'all-inclusive', 'lodge'],
    howRatibaHelps:
      'Ratiba displays the meal plan for each accommodation segment, making it clear to clients when meals are included and when they\'ll need to budget separately.',
  },
  'all-inclusive': {
    term: 'All-inclusive',
    slug: 'all-inclusive',
    fullName: 'All-Inclusive',
    definition:
      'All-inclusive (AI) is an accommodation rate that covers the room, all meals, drinks (including alcohol), and usually activities like game drives and bush walks. It is common at premium safari camps.',
    details:
      'All-inclusive rates simplify the client experience by bundling everything into one nightly price. At premium camps, this typically includes all meals, house wines and spirits, soft drinks, laundry, and standard activities. Some ultra-premium properties also include premium drinks and spa treatments.\n\nFor operators, all-inclusive properties are easier to quote because there are fewer variables. However, the nightly rates are higher, and operators need to clearly communicate what is included to justify the price to cost-conscious clients.',
    relatedTerms: ['full-board', 'rack-rate', 'per-person-sharing', 'tented-camp'],
    howRatibaHelps:
      'Ratiba\'s pricing engine handles all-inclusive rates alongside full-board and half-board properties in the same itinerary, calculating accurate totals regardless of the mix.',
  },
  'bed-and-breakfast': {
    term: 'Bed and breakfast',
    slug: 'bed-and-breakfast',
    fullName: 'Bed and Breakfast',
    definition:
      'Bed and breakfast (BB) is an accommodation rate that includes the room and breakfast only. It is typical for city hotels and overnight stops where guests arrange their own lunch and dinner.',
    details:
      'BB rates are standard for city hotels in Nairobi, Arusha, Dar es Salaam, and other urban stops that bookend a safari. Guests arriving late or departing early often only need a room and breakfast, making BB the practical and cost-effective choice.\n\nFor operators, BB segments at the start and end of an itinerary are straightforward to quote but important to communicate clearly. Clients should know they\'ll be arranging their own meals during city stays.',
    relatedTerms: ['half-board', 'full-board', 'lodge', 'rack-rate'],
    howRatibaHelps:
      'Ratiba lets operators include BB city stays in the same itinerary as full-board safari camps, with each segment clearly showing its meal plan basis.',
  },
  lodge: {
    term: 'Lodge',
    slug: 'lodge',
    fullName: 'Safari Lodge',
    definition:
      'A safari lodge is a permanent accommodation built in or near a wildlife area, offering rooms or suites with en-suite facilities, dining, and guided safari activities. Lodges range from mid-range to ultra-luxury.',
    details:
      'Lodges are the most common accommodation type in the safari industry. They are permanent structures (unlike tented camps) and typically offer a higher level of comfort and amenities — swimming pools, restaurants, bars, and spa facilities. Lodges can range from 10 rooms to over 100, depending on the property.\n\nFor operators, lodge selection is a core part of itinerary design. Factors include location, quality, rate structure, availability, meal plan, and the client\'s budget and preferences. Operators typically maintain relationships with multiple lodges in each destination to offer variety and handle availability constraints.',
    relatedTerms: ['tented-camp', 'bush-camp', 'full-board', 'rack-rate'],
    howRatibaHelps:
      'Ratiba\'s content library stores lodge details, photos, rates, and descriptions — ready to drop into any itinerary with a few clicks.',
  },
  'tented-camp': {
    term: 'Tented camp',
    slug: 'tented-camp',
    fullName: 'Tented Camp',
    definition:
      'A tented camp is a safari accommodation using semi-permanent or permanent canvas tents with en-suite bathrooms, beds, and furnishings. Despite the name, luxury tented camps rival lodges in comfort while offering a closer-to-nature experience.',
    details:
      'Tented camps range from simple to ultra-luxurious. At the premium end, tents feature king-size beds, freestanding bathtubs, private decks, and butler service. The canvas walls and open design create an immersive bush atmosphere that many safari travelers prefer over solid-walled lodges.\n\nFor operators, tented camps are often a key selling point — they represent the "authentic safari experience" that clients envision. Many tented camps are seasonal, closing during heavy rains and reopening for peak season, which operators must account for in itinerary planning and availability.',
    relatedTerms: ['lodge', 'bush-camp', 'mobile-safari', 'full-board'],
    howRatibaHelps:
      'Ratiba tracks seasonal availability and closure dates for tented camps, preventing operators from booking properties that are closed during the client\'s travel dates.',
  },
  banda: {
    term: 'Banda',
    slug: 'banda',
    fullName: 'Banda',
    definition:
      'A banda is a simple, traditional-style accommodation structure found in East African national parks and rural areas. Bandas are typically small standalone huts or cottages with basic furnishings.',
    details:
      'Bandas are the budget-friendly accommodation option in many East African parks. They are managed by national park authorities (like TANAPA in Tanzania) and offer basic shelter — usually a bed, mosquito net, and sometimes an en-suite bathroom. They are popular with budget travelers, local tourists, and backpackers.\n\nFor operators who serve the budget segment or local market, bandas are an important accommodation option. Pricing is significantly lower than lodges and tented camps, and availability is managed directly through the park authority rather than through a lodge reservations team.',
    relatedTerms: ['lodge', 'tented-camp', 'bed-and-breakfast', 'per-person-sharing'],
    howRatibaHelps:
      'Ratiba lets operators include bandas alongside premium lodges in the same itinerary, supporting mixed-budget trips with accurate pricing at every level.',
  },
  'rack-rate': {
    term: 'Rack rate',
    slug: 'rack-rate',
    fullName: 'Rack Rate',
    definition:
      'The rack rate is the published, full-price rate for an accommodation — before any trade discounts, commissions, or special offers are applied. It is the "retail" price that a walk-in guest or direct booker would pay.',
    details:
      'Rack rates serve as the baseline for all pricing in the safari industry. Lodges publish rack rates on their websites and in their rate sheets, and these are the rates that direct-booking clients see. Tour operators rarely pay rack rate — they receive contracted net rates or earn a commission off the rack rate.\n\nUnderstanding the relationship between rack rate and net rate is essential for operators to calculate their margins. An operator quoting rack rate to a client while paying net rate to the lodge captures the difference as margin.',
    relatedTerms: ['net-rate', 'markup', 'commission', 'per-person-sharing'],
    howRatibaHelps:
      'Ratiba\'s pricing engine lets operators store both rack and net rates, automatically calculating margins and ensuring quotes are profitable on every trip.',
  },
  'net-rate': {
    term: 'Net rate',
    slug: 'net-rate',
    fullName: 'Net Rate',
    definition:
      'A net rate is the discounted, trade-only price that a lodge or supplier offers to tour operators and DMCs. It is lower than the rack rate and is not visible to end clients.',
    details:
      'Net rates are the foundation of tour operator economics. Lodges contract net rates with operators, who then add a markup to create their selling price. The difference between net rate and selling price is the operator\'s gross margin. Net rates are typically confidential and vary by operator based on volume, relationship, and contract terms.\n\nManaging net rates across dozens of suppliers, multiple seasons, and different room types is one of the most complex parts of running a safari business. A single lodge might have 6+ rate tiers across high, shoulder, and low seasons, each with different child, single, and sharing rates.',
    relatedTerms: ['rack-rate', 'markup', 'commission', 'high-season'],
    howRatibaHelps:
      'Ratiba stores contracted net rates by supplier, season, and room type — then automatically applies the correct rate when an operator adds a property to an itinerary.',
  },
  markup: {
    term: 'Markup',
    slug: 'markup',
    fullName: 'Markup',
    definition:
      'Markup is the percentage or fixed amount that a tour operator adds on top of the net (cost) rate to arrive at the selling price. It represents the operator\'s gross profit on each component of the trip.',
    details:
      'Markup strategy varies across operators and components. Some operators apply a flat percentage markup (e.g., 25-35%) across all services, while others use different markups for accommodation, transport, and activities. Premium or hard-to-get lodges might carry a higher markup, while competitive routes might require lower margins.\n\nGetting markup right is critical to profitability. Too high and the operator loses competitive bids; too low and they can\'t cover overheads. Operators need to see their margins clearly on every itinerary before sending a quote.',
    relatedTerms: ['net-rate', 'rack-rate', 'commission', 'per-person-sharing'],
    howRatibaHelps:
      'Ratiba lets operators set default markup rules and override them per component — showing real-time margin calculations as they build each itinerary.',
  },
  commission: {
    term: 'Commission',
    slug: 'commission',
    fullName: 'Commission',
    definition:
      'Commission is the percentage of the selling price that a lodge or operator pays to a travel agent or referring partner for each booking. Standard safari industry commissions range from 10% to 20%.',
    details:
      'Commission is the alternative to the net-rate model. Instead of receiving a discounted price and adding markup, the agent sells at rack rate and receives a commission payment after the trip. Some operators use a hybrid model — paying commission to agents while working on net rates with their own suppliers.\n\nFor operators who work with agents, managing commission payments, tracking which bookings came through which agent, and ensuring commission is factored into pricing is an ongoing operational task.',
    relatedTerms: ['rack-rate', 'net-rate', 'travel-agent', 'markup'],
    howRatibaHelps:
      'Ratiba tracks commission structures per agent and factors them into pricing calculations, so operators always know their true margin after commission payouts.',
  },
  'per-person-sharing': {
    term: 'Per person sharing',
    slug: 'per-person-sharing',
    fullName: 'Per Person Sharing',
    definition:
      'Per person sharing (pps) is the standard pricing format in the safari industry, quoting the nightly rate per guest based on two people sharing a room or tent. It is the default unit used in lodge rate sheets.',
    details:
      'Per person sharing rates assume double occupancy. When a client travels alone, they pay the per-person-sharing rate plus a single supplement to cover the unoccupied half of the room. When three people share (if the room type allows), a third-person rate or child rate may apply.\n\nFor operators, working in per-person-sharing rates requires careful math when quoting groups, families, and solo travelers. Itinerary pricing must correctly handle different room configurations and apply the right supplements.',
    relatedTerms: ['single-supplement', 'rack-rate', 'net-rate', 'full-board'],
    howRatibaHelps:
      'Ratiba\'s pricing engine handles per-person-sharing rates, single supplements, child rates, and triple occupancy — calculating accurate totals for any group composition.',
  },
  'single-supplement': {
    term: 'Single supplement',
    slug: 'single-supplement',
    fullName: 'Single Supplement',
    definition:
      'A single supplement is the additional charge applied when one guest occupies a room designed for two. It covers the revenue the lodge loses from the empty second bed.',
    details:
      'Single supplements are one of the most common sources of client questions and complaints in safari pricing. The supplement can add 30-50% to the per-person cost, which surprises solo travelers who expect to pay less for using a room alone. Operators must communicate single supplement charges clearly and early in the quoting process.\n\nSome lodges waive or reduce single supplements during low season to attract solo travelers. Operators need to track which properties offer single supplement waivers and during which periods — a detail that varies by lodge and season.',
    relatedTerms: ['per-person-sharing', 'rack-rate', 'low-season', 'fit'],
    howRatibaHelps:
      'Ratiba automatically applies single supplement rates when the itinerary includes a solo traveler, and flags properties with seasonal waivers.',
  },
  'high-season': {
    term: 'High season',
    slug: 'high-season',
    fullName: 'High Season',
    definition:
      'High season is the peak travel period when demand and prices are at their highest. In East Africa, high season typically runs from July to October (dry season, Great Migration) and December to February (short dry season).',
    details:
      'During high season, lodge rates increase significantly — often 40-80% above low-season rates. Availability is tighter, popular properties book out months in advance, and clients need to plan well ahead. High season coincides with the best wildlife viewing conditions: dry weather concentrates animals around water sources.\n\nFor operators, high season means higher revenue per trip but also higher costs and more competition for availability. Accurate, up-to-date seasonal pricing is essential to avoid quoting outdated rates or losing margin.',
    relatedTerms: ['low-season', 'shoulder-season', 'migration', 'rack-rate'],
    howRatibaHelps:
      'Ratiba stores seasonal rate periods and automatically applies the correct high-season rates when an operator builds an itinerary for peak-season dates.',
  },
  'low-season': {
    term: 'Low season',
    slug: 'low-season',
    fullName: 'Low Season',
    definition:
      'Low season (also called green season) is the off-peak period when travel demand drops and accommodation rates are at their lowest. In East Africa, low season typically runs from March to May during the long rains.',
    details:
      'Low season offers significant discounts — rates can be 30-50% lower than high season. Some camps and lodges close entirely during the heaviest rains, while others remain open with reduced rates and special offers. Wildlife viewing can still be excellent, and the landscape is lush and green.\n\nFor operators, low season is an opportunity to offer value-focused itineraries to budget-conscious clients. It also means dealing with lodge closures, reduced flight schedules, and road conditions affected by rain. Operators need to know which properties stay open and which close.',
    relatedTerms: ['high-season', 'shoulder-season', 'net-rate', 'rack-rate'],
    howRatibaHelps:
      'Ratiba flags closed properties during low season and applies green-season rates automatically, helping operators build accurate off-peak itineraries.',
  },
  'shoulder-season': {
    term: 'Shoulder season',
    slug: 'shoulder-season',
    fullName: 'Shoulder Season',
    definition:
      'Shoulder season is the transitional period between high and low season, offering moderate rates and decent conditions. In East Africa, shoulder season typically falls in June and November.',
    details:
      'Shoulder season is often the sweet spot for value-conscious travelers who want good wildlife viewing without peak-season prices. Rates are lower than high season, availability is better, and parks are less crowded. The weather is transitional — occasional rain possible but generally manageable.\n\nFor operators, shoulder season requires careful pricing since many lodges have distinct shoulder-season rate tiers that fall between their high and low rates. Getting the season dates right is essential — a trip that spans the boundary between shoulder and high season may have different rates for different nights.',
    relatedTerms: ['high-season', 'low-season', 'rack-rate', 'net-rate'],
    howRatibaHelps:
      'Ratiba handles itineraries that span multiple seasons, applying the correct rate for each night even when a trip crosses from shoulder into high season.',
  },
};

/* ------------------------------------------------------------------ */
/*  Helper functions                                                   */
/* ------------------------------------------------------------------ */

export function getGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return GLOSSARY[slug];
}

export function getAllGlossaryTermSlugs(): string[] {
  return Object.keys(GLOSSARY);
}

export function getAllGlossaryTerms(): GlossaryTerm[] {
  return Object.values(GLOSSARY).sort((a, b) =>
    a.term.localeCompare(b.term, undefined, { sensitivity: 'base' }),
  );
}
