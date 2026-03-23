const stats = [
  { value: '3.5 hrs', label: 'Average time to build one proposal manually' },
  { value: '23%', label: 'Of proposals have a pricing error' },
  { value: '5 days', label: 'Average feedback loop per revision cycle' },
  { value: '40%', label: 'Of deals lost to faster-responding competitors' },
];

export function CostOfStatus() {
  return (
    <div className="flex h-full flex-col justify-center bg-[#261B07] px-14 py-14">
      <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#C4956A]">
        The cost
      </span>

      <h2 className="mt-2 max-w-[700px] text-[48px] font-bold leading-[54px] tracking-[-0.03em] text-[#F8F7F5]">
        What the status quo is costing you
      </h2>

      <p className="mt-2 max-w-[480px] text-lg leading-7 text-[#F8F7F5]/50">
        Every day without a better system is lost revenue and lost time.
      </p>

      <div className="mt-10 flex gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-1 flex-col gap-3 rounded-2xl border border-[#F8F7F5]/10 p-7"
          >
            <span className="text-[44px] font-bold leading-[44px] tracking-[-0.03em] text-[#C4956A]">
              {stat.value}
            </span>
            <span className="text-[15px] leading-[22px] text-[#F8F7F5]/50">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
