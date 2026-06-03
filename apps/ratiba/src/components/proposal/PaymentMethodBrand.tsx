import { Landmark, Wallet } from 'lucide-react';

type PaymentMethodType = 'bank_transfer' | 'pesapal' | 'stripe' | 'paypal' | 'other';

// Real brand wordmarks (transparent PNGs on the Makisala brand CDN) so clients
// recognize the provider instantly. Update these centrally on brand.makisala.com.
const LOGOS: Partial<Record<PaymentMethodType, { src: string; alt: string }>> = {
  stripe: {
    src: 'https://brand.makisala.com/Stripe%20wordmark%20-%20Blurple%20-%20Large.png',
    alt: 'Stripe',
  },
  pesapal: {
    src: 'https://brand.makisala.com/pesapal-logo.png',
    alt: 'Pesapal',
  },
  paypal: {
    src: 'https://brand.makisala.com/paypal-logo.png',
    alt: 'PayPal',
  },
};

// Fallback colored badge for providers without a wordmark logo.
const BADGE: Record<
  Exclude<PaymentMethodType, 'stripe' | 'pesapal' | 'paypal'>,
  { bg: string; label: string; Icon: typeof Landmark }
> = {
  bank_transfer: { bg: '#334155', label: 'Bank Transfer', Icon: Landmark },
  other: { bg: '#57534E', label: 'Other', Icon: Wallet },
};

const SIZES = {
  sm: { logo: 'h-4', badge: 'h-5 w-5', icon: 'h-3 w-3', text: 'text-xs' },
  md: { logo: 'h-6', badge: 'h-7 w-7', icon: 'h-4 w-4', text: 'text-sm' },
} as const;

/**
 * Recognizable brand element for a payment method: the official wordmark for
 * Stripe and Pesapal, or a colored badge + label for everything else.
 */
export function PaymentMethodBrand({
  type,
  size = 'md',
}: {
  type: string;
  size?: 'sm' | 'md';
}) {
  const s = SIZES[size];
  const logo = LOGOS[type as PaymentMethodType];

  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element -- remote brand asset, no Next image config needed
    return <img src={logo.src} alt={logo.alt} className={`${s.logo} w-auto object-contain`} />;
  }

  const key = (type in BADGE ? type : 'other') as keyof typeof BADGE;
  const { bg, label, Icon } = BADGE[key];

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`flex shrink-0 items-center justify-center rounded-md text-white ${s.badge}`}
        style={{ backgroundColor: bg }}
      >
        <Icon className={s.icon} strokeWidth={2.25} />
      </span>
      <span className={`font-semibold text-stone-700 ${s.text}`}>{label}</span>
    </span>
  );
}
