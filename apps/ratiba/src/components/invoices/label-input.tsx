import { cn } from '@/lib/utils';

interface LabelInputProps {
  children: React.ReactNode;
  className?: string;
}

export function Label({ children, className }: LabelInputProps) {
  return (
    <span
      className={cn(
        'text-[11px] font-mono font-normal uppercase tracking-wide text-[#878787]',
        className,
      )}
    >
      {children}
    </span>
  );
}
