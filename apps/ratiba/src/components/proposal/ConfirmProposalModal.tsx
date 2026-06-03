'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { PaymentInstructions, type PaymentMethod } from './PaymentInstructions';

interface Props {
  proposalId: string;
  defaultName?: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Self-contained confirm dialog used by themes that don't ship their own.
 * Collects the client name, confirms the proposal (notifies the operator), and
 * then shows the operator's payment instructions so the client can pay directly.
 */
export function ConfirmProposalModal({ proposalId, defaultName, open, onClose }: Props) {
  const [name, setName] = useState(defaultName || '');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [methods, setMethods] = useState<PaymentMethod[]>([]);

  const confirmMutation = trpc.proposals.confirm.useMutation();
  const isConfirming = confirmMutation.isPending;

  const handleConfirm = async () => {
    if (!name.trim()) return;
    setStatus('idle');
    setError('');
    try {
      const result = await confirmMutation.mutateAsync({
        proposalId,
        clientName: name.trim(),
      });
      setMethods((result.paymentMethods ?? []) as PaymentMethod[]);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setError(err?.message || 'An unexpected error occurred');
    }
  };

  const handleClose = () => {
    onClose();
    setStatus('idle');
    setError('');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => status === 'idle' && handleClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl"
          >
            {status === 'success' ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 font-serif text-2xl text-stone-900">Proposal Confirmed!</h3>
                <p className="mb-2 text-stone-600">
                  {methods.length > 0
                    ? 'Thank you for confirming. The operator has been notified. You can pay using the details below.'
                    : 'Thank you for confirming. The tour operator has been notified and will contact you shortly to finalize your booking.'}
                </p>

                <PaymentInstructions methods={methods} />

                <button
                  onClick={handleClose}
                  className="mt-6 rounded-lg bg-stone-800 px-6 py-3 text-sm font-medium text-white hover:bg-stone-900"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="mb-2 font-serif text-2xl text-stone-900">Confirm Your Proposal</h3>
                <p className="mb-6 text-sm text-stone-600">
                  By confirming, you agree to proceed with this trip. The tour operator will be
                  notified and you can then pay directly.
                </p>

                <div className="mb-6">
                  <label className="mb-2 block text-xs font-semibold tracking-wide text-stone-500 uppercase">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 focus:outline-none"
                  />
                </div>

                {status === 'error' && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    disabled={isConfirming}
                    className="flex-1 rounded-lg border border-stone-200 px-6 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isConfirming || !name.trim()}
                    className="flex-1 rounded-lg bg-green-700 px-6 py-3 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
                  >
                    {isConfirming ? 'Confirming...' : 'Confirm & Notify'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
