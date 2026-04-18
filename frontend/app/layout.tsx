import type { Metadata } from 'next';
import ClientWrapper from './ClientWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'LeakProof X | On-chain whistleblowing workflow',
  description:
    'Submit whistleblower reports, review them on Ethereum Sepolia, and manage disclosure permissions with a verifiable workflow.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
