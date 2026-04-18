import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';
import ClientWrapper from './ClientWrapper';

export const metadata: Metadata = {
  title: 'LeakProof X | Privacy-First Whistleblowing Platform',
  description: 'Secure, confidential whistleblowing on blockchain with Fhenix privacy technology.',
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