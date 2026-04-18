'use client';

import { useState, useEffect } from 'react';

interface FloatingOrbProps {
  size?: number;
  color?: string;
  blur?: number;
  duration?: number;
  delay?: number;
  x?: string;
  y?: string;
}

export default function FloatingOrb({
  size = 300,
  color = 'primary',
  blur = 100,
  duration = 20,
  delay = 0,
  x = '50%',
  y = '50%',
}: FloatingOrbProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  const colorMap: Record<string, string> = {
    primary: 'rgba(14, 165, 233, 0.3)',
    purple: 'rgba(168, 85, 247, 0.2)',
    emerald: 'rgba(16, 185, 129, 0.15)',
    amber: 'rgba(245, 158, 11, 0.15)',
  };

  return (
    <div
      className={`absolute rounded-full blur-3xl transition-opacity duration-1000 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        background: colorMap[color] || colorMap.primary,
        filter: `blur(${blur}px)`,
        animation: `float ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}