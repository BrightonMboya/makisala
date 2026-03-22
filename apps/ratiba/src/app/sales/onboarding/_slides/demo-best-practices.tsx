const dos = [
  'Build their actual trip live — use a real destination they sell',
  'Show the client-facing proposal — the "wow" moment',
  'Tie every feature back to a pain point from discovery',
  'End with the pricing engine — show time saved',
];

const donts = [
  'Walk through every feature in the menu bar',
  'Use a generic sample itinerary with placeholder data',
  'Talk for more than 30 minutes without asking a question',
  "Skip the pricing feature — it's your biggest differentiator",
];

export function DemoBestPractices() {
  return (
    <div className="flex h-full flex-col justify-center bg-[#261B07] px-14 py-14">
      <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#C4956A]">
        06
      </span>

      <h2 className="mt-2 max-w-[600px] text-[48px] font-bold leading-[54px] tracking-[-0.03em] text-[#F8F7F5]">
        Demo best practices
      </h2>

      <p className="mt-1 max-w-[480px] text-lg leading-7 text-[#F8F7F5]/55">
        Show, don&apos;t tell. Build a real itinerary live — it&apos;s the most powerful thing you
        can do.
      </p>

      <div className="mt-8 flex gap-4">
        <div className="flex flex-1 flex-col gap-3.5 rounded-2xl border border-[#F8F7F5]/10 p-7">
          <span className="text-sm font-semibold uppercase tracking-[0.06em] text-[#7CB87A]">
            Do
          </span>
          <div className="flex flex-col gap-3">
            {dos.map((item, i) => (
              <div key={item}>
                <span className="text-[15px] leading-[22px] text-[#F8F7F5]/70">{item}</span>
                {i < dos.length - 1 && <div className="mt-3 h-px bg-[#F8F7F5]/6" />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3.5 rounded-2xl border border-[#F8F7F5]/10 p-7">
          <span className="text-sm font-semibold uppercase tracking-[0.06em] text-[#D4675A]">
            Don&apos;t
          </span>
          <div className="flex flex-col gap-3">
            {donts.map((item, i) => (
              <div key={item}>
                <span className="text-[15px] leading-[22px] text-[#F8F7F5]/70">{item}</span>
                {i < donts.length - 1 && <div className="mt-3 h-px bg-[#F8F7F5]/6" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
