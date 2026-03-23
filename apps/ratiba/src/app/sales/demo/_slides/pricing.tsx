const benefits = [
  'Unlimited proposals',
  'Automated pricing engine',
  'Branded client proposals',
  'Real-time client comments',
  'Team collaboration tools',
  'Dedicated onboarding support',
];

export function Pricing() {
  return (
    <div className="flex h-full flex-col justify-center bg-[#F8F7F5] px-14 py-14">
      <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#C4956A]">
        Investment
      </span>

      <h2 className="mt-2 text-[48px] font-bold leading-[54px] tracking-[-0.03em] text-[#261B07]">
        Simple, transparent pricing
      </h2>

      <p className="mt-1 max-w-[500px] text-lg leading-7 text-[#261B07]/60">
        No per-seat fees. No surprises. Pay for growth, not headcount.
      </p>

      <div className="mt-8 flex gap-5">
        <div className="flex flex-1 flex-col gap-6 rounded-2xl border border-[#261B07]/8 bg-white p-8">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium uppercase tracking-[0.06em] text-[#C4956A]">
              What&apos;s included
            </span>
            <span className="text-[15px] leading-[22px] text-[#261B07]/55">
              Everything your team needs to build and send proposals professionally.
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="flex-shrink-0"
                >
                  <path
                    d="M3 8.5L6.5 12L13 4"
                    stroke="#7CB87A"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[15px] font-medium text-[#261B07]">{b}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-5 rounded-2xl bg-[#261B07] p-8">
          <span className="text-sm font-medium uppercase tracking-[0.06em] text-[#C4956A]">
            ROI snapshot
          </span>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[40px] font-bold leading-[40px] tracking-[-0.02em] text-[#F8F7F5]">
                10x
              </span>
              <span className="text-[14px] text-[#F8F7F5]/45">Faster proposal turnaround</span>
            </div>
            <div className="h-px bg-[#F8F7F5]/8" />
            <div className="flex flex-col gap-1">
              <span className="text-[40px] font-bold leading-[40px] tracking-[-0.02em] text-[#F8F7F5]">
                0
              </span>
              <span className="text-[14px] text-[#F8F7F5]/45">
                Pricing errors with automated calculations
              </span>
            </div>
            <div className="h-px bg-[#F8F7F5]/8" />
            <div className="flex flex-col gap-1">
              <span className="text-[40px] font-bold leading-[40px] tracking-[-0.02em] text-[#F8F7F5]">
                1 week
              </span>
              <span className="text-[14px] text-[#F8F7F5]/45">
                From sign-up to your first live proposal
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
