const steps = [
  {
    num: '01',
    title: 'Prospecting',
    description: 'Identify and qualify tour operators via LinkedIn, events, and referrals.',
    highlighted: true,
  },
  {
    num: '02',
    title: 'Discovery Call',
    description: 'Understand their workflow, pain points, and team structure.',
  },
  {
    num: '03',
    title: 'Live Demo',
    description: 'Show how Ratiba solves their specific problems in real time.',
  },
  {
    num: '04',
    title: 'Proposal',
    description: 'Send a tailored pricing plan with onboarding timeline.',
  },
  {
    num: '05',
    title: 'Close',
    description: 'Handle objections, sign the contract, and hand off to onboarding.',
  },
];

export function SalesProcess() {
  return (
    <div className="flex h-full flex-col justify-center bg-[#F8F7F5] px-14 py-14">
      <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#C4956A]">
        04
      </span>

      <h2 className="mt-2 text-[48px] font-bold leading-[54px] tracking-[-0.03em] text-[#261B07]">
        The sales process
      </h2>

      <p className="mt-1 max-w-[500px] text-lg leading-7 text-[#261B07]/60">
        Five stages from first contact to closed deal. Every step has a purpose.
      </p>

      <div className="mt-8 flex gap-3">
        {steps.map((step) => (
          <div
            key={step.num}
            className={`flex flex-1 flex-col gap-2.5 rounded-2xl p-6 ${
              step.highlighted
                ? 'bg-[#261B07]'
                : 'border border-[#261B07]/8 bg-white'
            }`}
          >
            <span className="text-4xl font-bold leading-9 text-[#C4956A]">{step.num}</span>
            <span
              className={`text-lg font-semibold leading-6 ${
                step.highlighted ? 'text-[#F8F7F5]' : 'text-[#261B07]'
              }`}
            >
              {step.title}
            </span>
            <span
              className={`text-[13px] leading-[18px] ${
                step.highlighted ? 'text-[#F8F7F5]/50' : 'text-[#261B07]/55'
              }`}
            >
              {step.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
