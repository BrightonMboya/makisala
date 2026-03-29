const features = [
  'Drag-and-drop itinerary builder',
  'Automated pricing engine',
  'Branded client-facing proposals',
  'Real-time client comments',
  'Team collaboration workspace',
];

export function WhatIsRatiba() {
  return (
    <div className="flex h-full flex-col justify-center bg-[#F8F7F5] px-14 py-14">
      <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#C4956A]">
        01
      </span>

      <h2 className="mt-2 text-[48px] font-bold leading-[54px] tracking-[-0.03em] text-[#261B07]">
        What is Ratiba?
      </h2>

      <p className="mt-1 max-w-[560px] text-lg leading-7 text-[#261B07]/65">
        Ratiba is a SaaS platform that helps tour operators and travel agencies create, price, and
        send beautiful itineraries, faster than ever.
      </p>

      <div className="mt-7 flex max-w-[700px] flex-wrap gap-4">
        {features.map((feature) => (
          <div
            key={feature}
            className="flex items-center gap-2.5 rounded-xl border border-[#261B07]/8 bg-white px-5 py-3.5"
          >
            <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#C4956A]" />
            <span className="text-[15px] font-medium text-[#261B07]">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
