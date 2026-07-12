import type { RequestItem } from '@/types/dashboard';

export type ProposalStatus = RequestItem['status'];

interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  dot: string;
  // Literal hex pair for consumers that can't use Tailwind classes (e.g. the
  // calendar library, which styles events via inline color values).
  hex: { fg: string; bg: string };
}

export const PROPOSAL_STATUSES: ProposalStatus[] = [
  'draft',
  'shared',
  'awaiting_payment',
  'paid',
  'booked',
  'completed',
  'cancelled',
];

export const proposalStatusConfig: Record<ProposalStatus, StatusConfig> = {
  draft: { label: 'Draft', bg: 'bg-stone-100', text: 'text-stone-800', dot: 'bg-stone-400', hex: { fg: '#78716c', bg: '#f5f5f4' } },
  shared: { label: 'Shared', bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', hex: { fg: '#16a34a', bg: '#dcfce7' } },
  awaiting_payment: { label: 'Awaiting Payment', bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500', hex: { fg: '#ca8a04', bg: '#fef9c3' } },
  paid: { label: 'Paid', bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', hex: { fg: '#2563eb', bg: '#dbeafe' } },
  booked: { label: 'Booked', bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500', hex: { fg: '#059669', bg: '#d1fae5' } },
  completed: { label: 'Completed', bg: 'bg-teal-100', text: 'text-teal-800', dot: 'bg-teal-500', hex: { fg: '#0d9488', bg: '#ccfbf1' } },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500', hex: { fg: '#dc2626', bg: '#fee2e2' } },
};

export function getStatusConfig(status: ProposalStatus): StatusConfig {
  return proposalStatusConfig[status] ?? proposalStatusConfig.draft;
}
