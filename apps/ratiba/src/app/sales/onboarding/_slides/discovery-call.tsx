const questions = [
  {
    category: 'Ask about workflow',
    question:
      '"Walk me through how you build an itinerary today — from first enquiry to sending the proposal."',
  },
  {
    category: 'Ask about pain',
    question:
      '"What\'s the most frustrating part of that process? Where do things break down?"',
  },
  {
    category: 'Ask about team',
    question:
      '"How many people touch an itinerary before it reaches the client? Who prices it?"',
  },
  {
    category: 'Ask about goals',
    question:
      '"If you could change one thing about your proposal process, what would it be?"',
  },
];

export function DiscoveryCall() {
  return (
    <div className="flex h-full flex-col justify-center bg-[#F8F7F5] px-14 py-14">
      <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#C4956A]">
        05
      </span>

      <h2 className="mt-2 text-[48px] font-bold leading-[54px] tracking-[-0.03em] text-[#261B07]">
        Running the discovery call
      </h2>

      <p className="mt-1 max-w-[520px] text-lg leading-7 text-[#261B07]/60">
        Your goal is to understand, not to pitch. Listen 70%, talk 30%.
      </p>

      <div className="mt-7 grid grid-cols-2 gap-4">
        {questions.map((q) => (
          <div
            key={q.category}
            className="flex flex-col gap-1.5 rounded-[14px] border border-[#261B07]/8 bg-white p-5"
          >
            <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[#C4956A]">
              {q.category}
            </span>
            <span className="text-[15px] leading-[22px] text-[#261B07]/70">{q.question}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
