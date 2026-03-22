const icps = [
  {
    title: 'Tour Operators',
    description:
      'Mid-size operators (5–50 staff) building custom safari, adventure, or cultural itineraries. Still using Word, PDF, or spreadsheets.',
    tags: ['5–50 employees', 'Custom trips', 'Africa focus'],
  },
  {
    title: 'Travel Agencies',
    description:
      'Boutique agencies selling high-end travel who need polished, branded proposals to win clients over competitors.',
    tags: ['High-end travel', 'Brand-conscious', 'Volume proposals'],
  },
  {
    title: 'DMCs',
    description:
      'Destination management companies coordinating lodges, transfers, and activities across multiple suppliers.',
    tags: ['Multi-supplier', 'Complex pricing', 'B2B + B2C'],
  },
];

export function WhoWeSellTo() {
  return (
    <div className="flex h-full flex-col justify-center bg-[#F8F7F5] px-14 py-14">
      <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#C4956A]">
        02
      </span>

      <h2 className="mt-2 text-[48px] font-bold leading-[54px] tracking-[-0.03em] text-[#261B07]">
        Who we sell to
      </h2>

      <p className="mt-1 max-w-[480px] text-lg leading-7 text-[#261B07]/60">
        Our ideal customer profile — know who to target and why they need us.
      </p>

      <div className="mt-7 flex gap-4">
        {icps.map((icp) => (
          <div
            key={icp.title}
            className="flex flex-1 flex-col gap-3 rounded-2xl border border-[#261B07]/8 bg-white p-7"
          >
            <span className="text-[28px] font-bold tracking-[-0.02em] text-[#261B07]">
              {icp.title}
            </span>
            <span className="text-[15px] leading-[22px] text-[#261B07]/60">{icp.description}</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {icp.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-[#EEECEA] px-3 py-1.5 text-xs font-medium text-[#261B07]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
