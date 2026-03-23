const nextSteps = [
  {
    num: '1',
    title: 'Start your free trial',
    description: 'Get full access to Ratiba, no credit card required. Build your first proposal today.',
  },
  {
    num: '2',
    title: 'We help you set up',
    description:
      'Our team imports your accommodations, rates, and branding. You\'re live in under a week.',
  },
  {
    num: '3',
    title: 'Send your first proposal',
    description:
      'Build a real itinerary for a real client. See the difference for yourself.',
  },
];

export function WhatsNext() {
  return (
    <div className="flex h-full flex-col justify-center bg-[#261B07] px-14 py-14">
      <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#C4956A]">
        Next steps
      </span>

      <h2 className="mt-2 text-[48px] font-bold leading-[54px] tracking-[-0.03em] text-[#F8F7F5]">
        Ready to see the difference?
      </h2>

      <p className="mt-2 max-w-[480px] text-lg leading-7 text-[#F8F7F5]/50">
        Here&apos;s exactly what happens after today&apos;s call.
      </p>

      <div className="mt-10 flex gap-5">
        {nextSteps.map((step) => (
          <div
            key={step.num}
            className="flex flex-1 flex-col gap-4 rounded-2xl border border-[#F8F7F5]/10 p-7"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C4956A]">
              <span className="text-base font-bold text-[#261B07]">{step.num}</span>
            </div>
            <span className="text-xl font-semibold leading-[26px] text-[#F8F7F5]">
              {step.title}
            </span>
            <span className="text-[15px] leading-[22px] text-[#F8F7F5]/50">
              {step.description}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-10 flex items-center gap-4">
        <div className="rounded-xl bg-[#C4956A] px-7 py-3.5">
          <span className="text-[15px] font-semibold text-[#261B07]">Start your free trial</span>
        </div>
        <div className="rounded-xl border border-[#F8F7F5]/20 px-7 py-3.5">
          <span className="text-[15px] font-semibold text-[#F8F7F5]">View sample proposal</span>
        </div>
      </div>
    </div>
  );
}
