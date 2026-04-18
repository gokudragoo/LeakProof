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
        <FloatingBackgroundOrbs />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

function FloatingBackgroundOrbs() {
  return (
    <>
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        style={{ background: 'transparent' }}
      >
        <div
          className="absolute rounded-full blur-3xl animate-pulse"
          style={{
            width: 600,
            height: 600,
            left: '-20%',
            top: '-10%',
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
            animation: 'float 20s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl animate-pulse"
          style={{
            width: 500,
            height: 500,
            right: '-15%',
            bottom: '10%',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)',
            animation: 'float 25s ease-in-out infinite reverse',
            animationDelay: '5s',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: 400,
            height: 400,
            left: '40%',
            top: '60%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
            animation: 'float 18s ease-in-out infinite',
            animationDelay: '10s',
          }}
        />
      </div>
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, -30px) rotate(5deg); }
          50% { transform: translate(-10px, -20px) rotate(-3deg); }
          75% { transform: translate(15px, -40px) rotate(3deg); }
        }
      `}</style>
    </>
  );
}