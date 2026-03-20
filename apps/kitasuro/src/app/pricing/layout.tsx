import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing for Tour Operator Proposal Software',
  description:
    'See Ratiba pricing for tour operators and travel agencies. Transparent plans that grow with your team, with no setup fees and unlimited proposals.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'Ratiba Pricing | Transparent Plans for Travel Teams',
    description:
      'Transparent pricing for tour operators and travel agencies. Unlimited proposals, team collaboration, and support as your business grows.',
    url: '/pricing',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ratiba Pricing | Transparent Plans for Travel Teams',
    description:
      'Transparent pricing for tour operators and travel agencies. Unlimited proposals, team collaboration, and support as your business grows.',
  },
};

export default function PricingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
