const objections = [
  {
    objection: '"We already use Word/Excel"',
    response:
      'That\'s exactly why teams switch. Ratiba replaces 3 tools with one. Let me show you the time difference.',
  },
  {
    objection: '"It\'s too expensive"',
    response:
      'How much does one lost deal cost? One pricing error? Ratiba pays for itself with the first deal it helps you win.',
  },
  {
    objection: '"Our team won\'t adopt it"',
    response:
      'We\'ve seen teams go live in under a week. We handle onboarding and training so your team just builds trips.',
  },
  {
    objection: '"We need to think about it"',
    response:
      'Of course. What specific concerns should I address before our next conversation? Let\'s schedule a follow-up now.',
  },
];

export function HandlingObjections() {
  return (
    <div className="flex h-full flex-col justify-center bg-[#F8F7F5] px-14 py-14">
      <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#C4956A]">
        07
      </span>

      <h2 className="mt-2 text-[48px] font-bold leading-[54px] tracking-[-0.03em] text-[#261B07]">
        Handling objections
      </h2>

      <p className="mt-1 max-w-[480px] text-lg leading-7 text-[#261B07]/60">
        Objections are buying signals. Here&apos;s how to respond.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#261B07]/8">
        <div className="flex bg-[#261B07] px-6 py-3.5">
          <span className="flex-1 text-[13px] font-semibold text-[#F8F7F5]/60">OBJECTION</span>
          <span className="flex-1 text-[13px] font-semibold text-[#F8F7F5]/60">RESPONSE</span>
        </div>
        {objections.map((row, i) => (
          <div
            key={row.objection}
            className={`flex bg-white px-6 py-4.5 ${
              i < objections.length - 1 ? 'border-b border-[#261B07]/6' : ''
            }`}
          >
            <span className="flex-1 text-[15px] font-medium leading-[22px] text-[#261B07]">
              {row.objection}
            </span>
            <span className="flex-1 text-[15px] leading-[22px] text-[#261B07]/65">
              {row.response}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
