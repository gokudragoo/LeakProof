import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';
import ParticleBackground from '@/components/ParticleBackground';

export const metadata: Metadata = {
  title: 'LeakProof X | Privacy-First Whistleblowing Platform',
  description: 'Secure, confidential whistleblowing and compliance reporting on blockchain with Fhenix privacy technology.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="relative">
        <ParticleBackground />
        <BackgroundOrbs />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

function BackgroundOrbs() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    >
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  );
}