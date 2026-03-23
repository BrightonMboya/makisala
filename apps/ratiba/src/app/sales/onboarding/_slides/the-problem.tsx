const painPoints = [
  {
    title: 'Proposals take hours to build',
    description:
      'Sales teams copy-paste between Word docs, spreadsheets, and email, wasting 2–4 hours per proposal.',
  },
  {
    title: 'Proposals look generic and unprofessional',
    description:
      "Flat PDFs with no branding can't compete against operators who present polished, visual experiences.",
  },
  {
    title: 'Pricing errors lose deals and margin',
    description:
      'Manual pricing across seasons, room types, and supplements leads to costly mistakes and awkward corrections.',
  },
  {
    title: 'Feedback loops are slow and fragmented',
    description:
      'Clients respond via email or WhatsApp. Changes get lost, versions multiply, and deals stall.',
  },
];

export function TheProblem() {
  return (
    <div className="flex h-full flex-col justify-center bg-[#261B07] px-14 py-14">
      <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#C4956A]">
        03
      </span>

      <h2 className="mt-2 max-w-[700px] text-[48px] font-bold leading-[54px] tracking-[-0.03em] text-[#F8F7F5]">
        The problem we solve
      </h2>

      <div className="mt-7 flex max-w-[900px] flex-col gap-5">
        {painPoints.map((point, i) => (
          <div key={point.title}>
            <div className="flex items-start gap-5">
              <span className="w-10 flex-shrink-0 text-[32px] font-bold leading-9 text-[#C4956A]">
                {i + 1}
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-xl font-semibold leading-[26px] text-[#F8F7F5]">
                  {point.title}
                </span>
                <span className="text-[15px] leading-[22px] text-[#F8F7F5]/50">
                  {point.description}
                </span>
              </div>
            </div>
            {i < painPoints.length - 1 && <div className="mt-5 h-px bg-[#F8F7F5]/8" />}
          </div>
        ))}
      </div>
    </div>
  );
}
