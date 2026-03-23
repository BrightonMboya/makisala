const steps = [
  {
    num: '01',
    title: 'Build the itinerary',
    description:
      'Select your destinations, accommodations, and activities. Drag to reorder days. Add notes and imagery.',
  },
  {
    num: '02',
    title: 'Price it automatically',
    description:
      'Ratiba pulls in your rates, applies season pricing, calculates supplements, and shows your margin, live.',
  },
  {
    num: '03',
    title: 'Send the proposal',
    description:
      'Generate a branded, interactive link. Your client sees a stunning visual proposal, not a PDF attachment.',
  },
  {
    num: '04',
    title: 'Collaborate and close',
    description:
      'Clients comment directly on the proposal. Your team gets notified instantly. Revise and resend in seconds.',
  },
];

export function HowItWorks() {
  return (
    <div className="flex h-full flex-col justify-center bg-[#261B07] px-14 py-14">
      <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#C4956A]">
        How it works
      </span>

      <h2 className="mt-2 text-[48px] font-bold leading-[54px] tracking-[-0.03em] text-[#F8F7F5]">
        Four steps to a winning proposal
      </h2>

      <div className="mt-10 flex gap-4">
        {steps.map((step, i) => (
          <div
            key={step.num}
            className={`flex flex-1 flex-col gap-3 rounded-2xl p-7 ${
              i === 0
                ? 'bg-[#C4956A]/15 border border-[#C4956A]/25'
                : 'border border-[#F8F7F5]/8'
            }`}
          >
            <span className="text-[36px] font-bold leading-9 text-[#C4956A]">{step.num}</span>
            <span className="text-lg font-semibold leading-6 text-[#F8F7F5]">{step.title}</span>
            <span className="text-[14px] leading-[20px] text-[#F8F7F5]/50">
              {step.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
