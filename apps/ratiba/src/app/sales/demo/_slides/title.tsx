export function TitleSlide() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#261B07] px-14 py-14">
      <div className="mb-5 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-[#C4956A]" />
        <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-white/45">
          Product Overview
        </span>
      </div>

      <h1 className="max-w-[800px] text-center text-[68px] font-bold leading-[72px] tracking-[-0.04em] text-[#F8F7F5]">
        Build faster itineraries. Win more clients.
      </h1>

      <p className="mt-5 max-w-[560px] text-center text-xl leading-[30px] text-[#F8F7F5]/50">
        Ratiba helps tour operators, agencies, and DMCs create, price, and send beautiful proposals
        in minutes, not hours.
      </p>

      <div className="absolute bottom-14 left-14 right-14 flex items-center justify-between">
        <span className="text-sm font-medium text-[#F8F7F5]/30">ratiba.io</span>
        <span className="text-sm font-medium text-[#F8F7F5]/30">Confidential</span>
      </div>
    </div>
  );
}
