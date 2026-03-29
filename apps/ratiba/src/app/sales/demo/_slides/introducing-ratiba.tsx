const pillars = [
  {
    title: 'Build itineraries in minutes',
    description:
      'Drag-and-drop builder with your accommodations, activities, and transfers. No more copy-paste.',
  },
  {
    title: 'Automated, accurate pricing',
    description:
      'Season rates, supplements, and markups calculated automatically. Update one rate and every proposal reflects it.',
  },
  {
    title: 'Proposals clients love',
    description:
      'Branded, interactive proposals with stunning imagery. Clients can comment directly. No more email chains.',
  },
  {
    title: 'One workspace for your team',
    description:
      'Sales, ops, and managers work in one place. @mentions, shared templates, and real-time collaboration.',
  },
];

export function IntroducingRatiba() {
  return (
    <div className="flex h-full flex-col justify-center bg-[#F8F7F5] px-14 py-14">
      <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#C4956A]">
        The solution
      </span>

      <h2 className="mt-2 text-[48px] font-bold leading-[54px] tracking-[-0.03em] text-[#261B07]">
        Introducing Ratiba
      </h2>

      <p className="mt-1 max-w-[520px] text-lg leading-7 text-[#261B07]/60">
        One platform to build, price, and send proposals so you can focus on selling trips, not
        formatting documents.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {pillars.map((p) => (
          <div
            key={p.title}
            className="flex flex-col gap-2 rounded-2xl border border-[#261B07]/8 bg-white p-7"
          >
            <span className="text-xl font-bold tracking-[-0.01em] text-[#261B07]">{p.title}</span>
            <span className="text-[15px] leading-[22px] text-[#261B07]/60">{p.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
