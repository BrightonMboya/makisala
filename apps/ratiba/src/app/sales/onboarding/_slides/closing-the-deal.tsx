const techniques = [
  {
    title: 'Summarize the value',
    description:
      'Recap exactly how Ratiba solves their 2–3 biggest pain points. Make it personal, not generic.',
  },
  {
    title: 'Create urgency naturally',
    description:
      '"Your peak booking season is in 8 weeks — teams typically need 1 week to onboard. When would you want to be live?"',
  },
  {
    title: 'Offer a pilot',
    description:
      "Let them build one real itinerary in Ratiba. Once they see their brand on it, they won't go back to PDFs.",
  },
  {
    title: 'Always set the next step',
    description:
      'Never end a call without a calendar invite. "Let\'s lock in Tuesday at 10am to review the proposal with your team."',
  },
];

export function ClosingTheDeal() {
  return (
    <div className="flex h-full flex-col justify-center bg-[#F8F7F5] px-14 py-14">
      <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#C4956A]">
        08
      </span>

      <h2 className="mt-2 text-[48px] font-bold leading-[54px] tracking-[-0.03em] text-[#261B07]">
        Closing the deal
      </h2>

      <p className="mt-1 max-w-[520px] text-lg leading-7 text-[#261B07]/60">
        Close with confidence. The goal is a clear next step, not pressure.
      </p>

      <div className="mt-7 grid grid-cols-2 gap-4">
        {techniques.map((t) => (
          <div
            key={t.title}
            className="flex flex-col gap-2 rounded-[14px] border border-[#261B07]/8 bg-white p-6"
          >
            <span className="text-xl font-bold tracking-[-0.01em] text-[#261B07]">{t.title}</span>
            <span className="text-[15px] leading-[22px] text-[#261B07]/60">{t.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
