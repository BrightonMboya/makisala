const comparisons = [
  {
    before: 'Copy-paste between 3–4 tools',
    after: 'One drag-and-drop builder',
  },
  {
    before: '2–4 hours per proposal',
    after: '20 minutes or less',
  },
  {
    before: 'Flat PDF attachments',
    after: 'Interactive branded proposals',
  },
  {
    before: 'Manual pricing in spreadsheets',
    after: 'Automated with live margin view',
  },
  {
    before: 'Feedback via email & WhatsApp',
    after: 'In-context client comments',
  },
  {
    before: 'Version chaos across team',
    after: 'Single source of truth',
  },
];

export function BeforeAfter() {
  return (
    <div className="flex h-full flex-col justify-center bg-[#F8F7F5] px-14 py-14">
      <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#C4956A]">
        The difference
      </span>

      <h2 className="mt-2 text-[48px] font-bold leading-[54px] tracking-[-0.03em] text-[#261B07]">
        Before &amp; after Ratiba
      </h2>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[#261B07]/8">
        <div className="flex">
          <div className="flex-1 bg-[#261B07] px-6 py-3.5">
            <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[#D4675A]">
              Without Ratiba
            </span>
          </div>
          <div className="flex-1 bg-[#261B07] px-6 py-3.5">
            <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[#7CB87A]">
              With Ratiba
            </span>
          </div>
        </div>
        {comparisons.map((row, i) => (
          <div
            key={row.before}
            className={`flex bg-white ${
              i < comparisons.length - 1 ? 'border-b border-[#261B07]/6' : ''
            }`}
          >
            <span className="flex-1 border-r border-[#261B07]/6 px-6 py-4 text-[15px] leading-[22px] text-[#261B07]/55">
              {row.before}
            </span>
            <span className="flex-1 px-6 py-4 text-[15px] font-medium leading-[22px] text-[#261B07]">
              {row.after}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
