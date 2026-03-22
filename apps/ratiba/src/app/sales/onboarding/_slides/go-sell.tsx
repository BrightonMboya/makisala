export function GoSell() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#261B07] px-14 py-14">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-[#C4956A]" />
        <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#F8F7F5]/40">
          Now go close some deals
        </span>
      </div>

      <h2 className="mt-4 max-w-[700px] text-center text-[72px] font-bold leading-[76px] tracking-[-0.04em] text-[#F8F7F5]">
        You&apos;ve got the playbook. Go sell.
      </h2>

      <p className="mt-5 max-w-[480px] text-center text-lg leading-7 text-[#F8F7F5]/45">
        Questions? Reach out to your sales lead anytime. We&apos;re building this together.
      </p>
    </div>
  );
}
