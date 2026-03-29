const challenges = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Hours lost on every proposal',
    description:
      'Copying between Word, Excel, and email. Formatting images. Recalculating prices. A single itinerary can take 2–4 hours before it even reaches the client.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    title: 'Flat PDFs that don\'t impress',
    description:
      'Your trip is a once-in-a-lifetime experience, but the proposal looks like a tax document. Clients compare you to competitors who look more polished.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: 'Pricing mistakes eat your margin',
    description:
      'Season rates, room supplements, child policies, park fees: one wrong cell in the spreadsheet and you\'re either losing money or losing the client.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Feedback scattered everywhere',
    description:
      'Clients reply on WhatsApp, email, or phone. Changes get lost. Versions multiply. By the time you send revision 4, everyone is confused.',
  },
];

export function TheChallenges() {
  return (
    <div className="flex h-full flex-col justify-center bg-[#F8F7F5] px-14 py-14">
      <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#C4956A]">
        The challenge
      </span>

      <h2 className="mt-2 max-w-[600px] text-[48px] font-bold leading-[54px] tracking-[-0.03em] text-[#261B07]">
        Sound familiar?
      </h2>

      <p className="mt-1 max-w-[500px] text-lg leading-7 text-[#261B07]/60">
        These are the problems we hear from travel teams every single day.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {challenges.map((c) => (
          <div
            key={c.title}
            className="flex gap-4 rounded-2xl border border-[#261B07]/8 bg-white p-6"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#261B07] text-[#C4956A]">
              {c.icon}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[17px] font-semibold leading-[22px] text-[#261B07]">
                {c.title}
              </span>
              <span className="text-[14px] leading-[20px] text-[#261B07]/55">
                {c.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
