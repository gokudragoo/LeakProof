'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
  life: number;
  maxLife: number;
  trail: { x: number; y: number; opacity: number }[];
}

interface MousePos {
  x: number;
  y: number;
}

export default function InteractiveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const gridRef = useRef<{ x: number; y: number; size: number }[]>([]);
  const mouseRef = useRef<MousePos>({ x: 0, y: 0 });
  const animationRef = useRef<number>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Initialize grid
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Create grid points
    const grid: { x: number; y: number; size: number }[] = [];
    const spacing = 80;
    for (let x = 0; x < window.innerWidth + spacing; x += spacing) {
      for (let y = 0; y < window.innerHeight + spacing; y += spacing) {
        grid.push({ x, y, size: 0 });
      }
    }
    gridRef.current = grid;

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const createParticle = useCallback((mouseX: number, mouseY: number, isClick: boolean = false): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = isClick ? Math.random() * 3 + 2 : Math.random() * 1 + 0.5;
    return {
      x: mouseX,
      y: mouseY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.8 + 0.4,
      hue: Math.random() * 120 + 170, // cyan to green
      life: 0,
      maxLife: Math.random() * 80 + 40,
      trail: [],
    };
  }, []);

  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, p: Particle) => {
    // Draw trail
    if (p.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(p.trail[0].x, p.trail[0].y);
      for (let i = 1; i < p.trail.length; i++) {
        ctx.lineTo(p.trail[i].x, p.trail[i].y);
      }
      ctx.strokeStyle = `hsla(${p.hue}, 80%, 60%, ${p.opacity * 0.3})`;
      ctx.lineWidth = p.size * 0.5;
      ctx.stroke();
    }

    // Draw particle
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
    gradient.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${p.opacity})`);
    gradient.addColorStop(0.5, `hsla(${p.hue}, 80%, 50%, ${p.opacity * 0.5})`);
    gradient.addColorStop(1, `hsla(${p.hue}, 80%, 50%, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = `hsla(${p.hue}, 90%, 80%, ${p.opacity})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, mouse: MousePos) => {
    gridRef.current.forEach((point) => {
      const dx = mouse.x - point.x;
      const dy = mouse.y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 200;

      if (distance < maxDist) {
        const intensity = 1 - distance / maxDist;
        point.size = intensity * 3;

        ctx.fillStyle = `rgba(14, 165, 233, ${intensity * 0.8})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        ctx.fill();

        // Lines to mouse
        ctx.strokeStyle = `rgba(14, 165, 233, ${intensity * 0.3})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      } else {
        point.size = 0;
      }
    });
  }, []);

  const drawConnections = useCallback((ctx: CanvasRenderingContext2D, particles: Particle[]) => {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 100) {
          const opacity = (1 - distance / 100) * 0.3;
          ctx.strokeStyle = `rgba(14, 165, 233, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    let lastEmit = 0;
    const emitInterval = 50;

    const animate = (timestamp: number) => {
      // Dark fade for trail effect
      ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mouse = mouseRef.current;

      // Draw grid
      drawGrid(ctx, mouse);

      // Emit particles near mouse
      if (timestamp - lastEmit > emitInterval) {
        for (let i = 0; i < 2; i++) {
          particlesRef.current.push(createParticle(mouse.x, mouse.y));
        }
        lastEmit = timestamp;
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((p) => {
        // Add to trail
        p.trail.push({ x: p.x, y: p.y, opacity: p.opacity });
        if (p.trail.length > 10) p.trail.shift();

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.life++;
        p.opacity = Math.max(0, p.opacity - 0.008);

        if (p.life < p.maxLife) {
          drawParticle(ctx, p);
          return true;
        }
        return false;
      });

      // Draw connections
      drawConnections(ctx, particlesRef.current);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleClick = (e: MouseEvent) => {
      for (let i = 0; i < 15; i++) {
        particlesRef.current.push(createParticle(e.clientX, e.clientY, true));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, createParticle, drawParticle, drawGrid, drawConnections]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
}