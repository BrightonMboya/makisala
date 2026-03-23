const features = [
  {
    title: 'Itinerary Builder',
    description: 'Watch us build a real trip in under 5 minutes, with your destinations.',
  },
  {
    title: 'Pricing Engine',
    description: 'See how rates, seasons, and markups are calculated automatically.',
  },
  {
    title: 'Client Proposal',
    description: 'Experience the interactive proposal exactly as your clients will see it.',
  },
  {
    title: 'Team Collaboration',
    description: 'See how comments, @mentions, and shared templates keep your team aligned.',
  },
];

export function LiveDemo() {
  return (
    <div className="flex h-full flex-col justify-center bg-[#F8F7F5] px-14 py-14">
      <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#C4956A]">
        Live demo
      </span>

      <h2 className="mt-2 text-[48px] font-bold leading-[54px] tracking-[-0.03em] text-[#261B07]">
        Let&apos;s see it in action
      </h2>

      <p className="mt-1 max-w-[500px] text-lg leading-7 text-[#261B07]/60">
        We&apos;ll walk through each of these live, using a real trip you sell.
      </p>

      <div className="mt-8 flex gap-4">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="flex flex-1 flex-col gap-3 rounded-2xl border border-[#261B07]/8 bg-white p-6"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#261B07]">
              <span className="text-sm font-bold text-[#C4956A]">{i + 1}</span>
            </div>
            <span className="text-lg font-semibold leading-6 text-[#261B07]">{f.title}</span>
            <span className="text-[14px] leading-[20px] text-[#261B07]/55">{f.description}</span>
          </div>
        ))}
      </div>

      <a
        href="/dashboard"
        className="mt-8 flex items-center gap-3 self-start rounded-xl bg-[#261B07] px-6 py-4 transition-opacity hover:opacity-80"
      >
        <div className="h-3 w-3 animate-pulse rounded-full bg-[#C4956A]" />
        <span className="text-sm font-medium text-[#F8F7F5]/70">
          Switching to live demo...
        </span>
      </a>
    </div>
  );
}
