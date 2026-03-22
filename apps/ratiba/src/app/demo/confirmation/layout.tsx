import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thank You | Ratiba',
  robots: { index: false },
};

export default function ConfirmationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
