'use client';

import { PaymentMethodBrand } from './PaymentMethodBrand';

export type PaymentMethod = {
  id: string;
  type: 'bank_transfer' | 'pesapal' | 'stripe' | 'paypal' | 'other';
  label: string;
  instructions: string | null;
  url: string | null;
};

// Link-based methods get a "Pay now" button; bank_transfer/other are mostly instructions.
const LINK_TYPES: PaymentMethod['type'][] = ['pesapal', 'stripe', 'paypal'];

/**
 * Renders the operator's payout instructions to a client after they confirm a
 * proposal. We never process payments here. We only display the details the
 * operator entered so the client can pay them directly.
 */
export function PaymentInstructions({ methods }: { methods: PaymentMethod[] }) {
  if (!methods || methods.length === 0) return null;

  return (
    <div className="mt-6 text-left">
      <h4 className="mb-3 text-xs font-bold tracking-[0.2em] text-stone-500 uppercase">
        How to pay
      </h4>
      <div className="space-y-3">
        {methods.map((method) => {
          const isLink = LINK_TYPES.includes(method.type) && method.url;
          return (
            <div
              key={method.id}
              className="rounded-xl border border-stone-200 bg-stone-50 p-4"
            >
              <div className="flex h-6 items-center">
                <PaymentMethodBrand type={method.type} size="md" />
              </div>
              <p className="mt-2 text-sm font-semibold text-stone-900">{method.label}</p>
              {method.instructions && (
                <p className="mt-2 text-sm whitespace-pre-line text-stone-600">
                  {method.instructions}
                </p>
              )}
              {isLink && (
                <a
                  href={method.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center justify-center rounded-lg bg-stone-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-900"
                >
                  Pay with {method.label}
                </a>
              )}
              {!isLink && method.url && (
                <a
                  href={method.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-stone-700 underline hover:text-stone-900"
                >
                  {method.url}
                </a>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-stone-400">
        Payments are made directly to the operator. Keep your payment confirmation for your
        records.
      </p>
    </div>
  );
}
