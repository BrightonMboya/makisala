import type { RequestItem } from '@/types/dashboard';

type ProposalStatus = RequestItem['status'];

interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  dot: string;
}

export const PROPOSAL_STATUSES: ProposalStatus[] = [
  'draft',
  'shared',
  'awaiting_payment',
  'paid',
  'booked',
  'cancelled',
];

export const proposalStatusConfig: Record<ProposalStatus, StatusConfig> = {
  draft: { label: 'Draft', bg: 'bg-stone-100', text: 'text-stone-800', dot: 'bg-stone-400' },
  shared: { label: 'Shared', bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  awaiting_payment: { label: 'Awaiting Payment', bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  paid: { label: 'Paid', bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  booked: { label: 'Booked', bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
};

export function getStatusConfig(status: ProposalStatus): StatusConfig {
  return proposalStatusConfig[status] ?? proposalStatusConfig.draft;
}
