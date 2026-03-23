const testimonials = [
  {
    quote:
      'We went from spending half a day on each proposal to sending them out in 20 minutes. Clients immediately noticed the difference.',
    name: 'Safari Operations Manager',
    company: 'Mid-size operator, Tanzania',
  },
  {
    quote:
      'The pricing engine alone saved us from a $4,000 mistake in the first week. It paid for itself before the trial ended.',
    name: 'Head of Sales',
    company: 'Luxury DMC, East Africa',
  },
  {
    quote:
      'Our clients used to take days to respond to PDFs. With Ratiba, they comment in real time and we close faster.',
    name: 'Founder',
    company: 'Boutique travel agency',
  },
];

export function WhatTeamsAreSaying() {
  return (
    <div className="flex h-full flex-col justify-center bg-[#261B07] px-14 py-14">
      <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#C4956A]">
        Social proof
      </span>

      <h2 className="mt-2 text-[48px] font-bold leading-[54px] tracking-[-0.03em] text-[#F8F7F5]">
        What teams are saying
      </h2>

      <div className="mt-10 flex gap-5">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="flex flex-1 flex-col justify-between gap-6 rounded-2xl border border-[#F8F7F5]/10 p-7"
          >
            <p className="text-[17px] leading-[26px] text-[#F8F7F5]/75">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="flex flex-col gap-1">
              <span className="text-[15px] font-semibold text-[#F8F7F5]">{t.name}</span>
              <span className="text-[13px] text-[#F8F7F5]/40">{t.company}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
