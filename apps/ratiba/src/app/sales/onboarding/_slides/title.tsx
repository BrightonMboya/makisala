export function TitleSlide() {
  return (
    <div className="flex h-full flex-col justify-center bg-[#261B07] px-14 py-14">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-[#C4956A]" />
        <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-white/50">
          Sales Onboarding
        </span>
      </div>

      <h1 className="max-w-[720px] text-[64px] font-bold leading-[68px] tracking-[-0.03em] text-[#F8F7F5]">
        Welcome to the Ratiba Sales Team
      </h1>

      <p className="mt-3 max-w-[540px] text-xl leading-[30px] text-[#F8F7F5]/55">
        Everything you need to know to sell Ratiba, from first call to closed deal.
      </p>

      <div className="absolute bottom-14 left-14 right-14 flex items-center justify-between">
        <span className="text-sm font-medium text-[#F8F7F5]/35">Ratiba | Internal</span>
        <span className="text-sm font-medium text-[#F8F7F5]/35">2026</span>
      </div>
    </div>
  );
}
