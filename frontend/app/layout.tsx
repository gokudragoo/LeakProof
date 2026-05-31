import type { Metadata, Viewport } from 'next';
import ClientWrapper from './ClientWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'LeakProof X | On-chain whistleblowing workflow',
  description:
    'Submit whistleblower reports, review them on Ethereum Sepolia, and manage disclosure permissions with a verifiable workflow.',
  applicationName: 'LeakProof X',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
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
