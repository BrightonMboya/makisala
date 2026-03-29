const weeks = [
  {
    num: 1,
    title: 'Learn the product',
    tasks: ['Complete product training', 'Build 3 sample itineraries', 'Shadow 2 live demos'],
  },
  {
    num: 2,
    title: 'Start prospecting',
    tasks: [
      'Build your target list (50 leads)',
      'Send first outreach sequences',
      'Run your first discovery call',
    ],
  },
  {
    num: 3,
    title: 'Run solo demos',
    tasks: [
      'Lead 3 demos independently',
      'Get feedback from manager',
      'Refine your pitch narrative',
    ],
  },
  {
    num: 4,
    title: 'Close your first deal',
    tasks: ['Send 2+ proposals', 'Follow up and handle objections', 'Target: 1 signed contract'],
  },
];

export function FirstThirtyDays() {
  return (
    <div className="flex h-full flex-col justify-center bg-[#261B07] px-14 py-14">
      <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#C4956A]">
        09
      </span>

      <h2 className="mt-2 text-[48px] font-bold leading-[54px] tracking-[-0.03em] text-[#F8F7F5]">
        Your first 30 days
      </h2>

      <p className="mt-1 max-w-[480px] text-lg leading-7 text-[#F8F7F5]/50">
        A clear ramp plan so you know exactly what to focus on each week.
      </p>

      <div className="mt-8 flex gap-3.5">
        {weeks.map((week) => (
          <div
            key={week.num}
            className="flex flex-1 flex-col gap-3.5 rounded-2xl border border-[#F8F7F5]/10 p-6"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#C4956A]">
                <span className="text-sm font-bold text-[#261B07]">{week.num}</span>
              </div>
              <span className="text-[13px] font-medium uppercase tracking-[0.06em] text-[#F8F7F5]/45">
                Week {week.num}
              </span>
            </div>

            <span className="text-lg font-semibold leading-6 text-[#F8F7F5]">{week.title}</span>

            <div className="flex flex-col gap-2">
              {week.tasks.map((task) => (
                <span key={task} className="text-sm leading-5 text-[#F8F7F5]/50">
                  {task}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
