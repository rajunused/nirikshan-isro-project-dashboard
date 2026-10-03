import React, { useEffect, useRef } from 'react';

/**
 * Astronomical Shooting Star (Meteor & Bolide) Engine
 * Simulates genuine high-velocity meteor entries:
 * - Hypersonic entry velocity (quick 0.35s - 0.65s transit)
 * - Needle-thin ionizing head with aerodynamic plasma glow
 * - Exponentially tapered ionization trail
 * - Ephemeral persistent ionization train that lingers and dissipates
 * - Sporadic timing, varying magnitudes (from faint micro-meteors to bright fireballs)
 */
export default function ShootingStars() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Active meteors and persistent ionization smoke trains
    const activeMeteors = [];
    const persistentTrains = [];

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Create a meteor with realistic astronomical parameters
    const spawnMeteor = () => {
      // Radiant angle: natural diagonal descent (typically 28° to 48°)
      const angleDeg = 28 + Math.random() * 22;
      const angle = (angleDeg * Math.PI) / 180;

      // Realistic hypersonic velocity: covers screen in 18-28 frames (0.3s - 0.5s at 60fps)
      const isBolide = Math.random() < 0.15; // 15% bright fireball / bolide
      const speed = isBolide ? 34 + Math.random() * 12 : 42 + Math.random() * 18;
      const trailLength = isBolide ? 260 + Math.random() * 140 : 160 + Math.random() * 100;

      // Spawn across the upper quadrant
      const startX = Math.random() * (width * 0.95);
      const startY = -40 + Math.random() * (height * 0.35);

      // Trajectory deltas
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;

      return {
        x: startX,
        y: startY,
        dx,
        dy,
        speed,
        trailLength,
        isBolide,
        life: 0,
        maxLife: Math.floor(18 + Math.random() * 14), // Swift transit: 0.3s - 0.5s
        thickness: isBolide ? 2.0 : 1.2,
        colorCore: '#ffffff',
        colorGlow: isBolide ? '#93c5fd' : '#e0f2fe',
        colorTail: isBolide ? '#38bdf8' : '#818cf8',
        history: [], // For persistent ionization train
      };
    };

    let frameCount = 0;
    let nextSpawn = 90 + Math.floor(Math.random() * 120); // 1.5s to 3.5s natural spacing

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      ctx.clearRect(0, 0, width, height);

      frameCount++;
      if (frameCount >= nextSpawn) {
        activeMeteors.push(spawnMeteor());
        // Occasional meteor shower twin (cluster entry)
        if (Math.random() < 0.28) {
          setTimeout(() => {
            if (canvasRef.current) activeMeteors.push(spawnMeteor());
          }, 180 + Math.random() * 240);
        }
        frameCount = 0;
        nextSpawn = 120 + Math.floor(Math.random() * 180);
      }

      // =========================================================
      // 1. UPDATE & DRAW ACTIVE METEORS
      // =========================================================
      for (let i = activeMeteors.length - 1; i >= 0; i--) {
        const m = activeMeteors[i];
        m.life++;

        // Store trail point for persistent ionization train
        m.history.push({ x: m.x, y: m.y });
        if (m.history.length > 5) m.history.shift();

        m.x += m.dx;
        m.y += m.dy;

        // Meteor Light Curve:
        // Sudden ignition flare, high peak intensity, abrupt terminal ablation
        const progress = m.life / m.maxLife;
        let intensity;
        if (progress < 0.2) {
          intensity = Math.pow(progress / 0.2, 1.5);
        } else if (progress < 0.8) {
          intensity = 1.0 - (progress - 0.2) * 0.25;
        } else {
          // Sharp terminal fade or flare
          intensity = Math.pow(1 - (progress - 0.8) / 0.2, 2.0);
        }
        intensity = Math.max(0, Math.min(1, intensity));

        // Calculate tail origin
        const tailX = m.x - (m.dx / m.speed) * m.trailLength;
        const tailY = m.y - (m.dy / m.speed) * m.trailLength;

        // Draw razor-sharp ionization streak
        const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.65, `rgba(56, 189, 248, ${intensity * 0.35})`);
        grad.addColorStop(0.9, `rgba(186, 230, 253, ${intensity * 0.85})`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${intensity})`);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = m.thickness;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Pinpoint ionizing head glow
        const headGlow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.isBolide ? 8 : 4.5);
        headGlow.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
        headGlow.addColorStop(0.4, `rgba(224, 242, 254, ${intensity * 0.7})`);
        headGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = headGlow;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.isBolide ? 8 : 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Terminal ablation flare or persistent train transfer
        if (m.life >= m.maxLife || m.x > width + 100 || m.y > height + 100) {
          if (m.history.length >= 2) {
            persistentTrains.push({
              x1: m.history[0].x,
              y1: m.history[0].y,
              x2: m.x,
              y2: m.y,
              life: 0,
              maxLife: 45 + Math.floor(Math.random() * 35), // Lingers for ~1 second
              thickness: m.thickness * 0.9,
              isBolide: m.isBolide,
            });
          }
          activeMeteors.splice(i, 1);
        }
      }

      // =========================================================
      // 2. UPDATE & DRAW PERSISTENT IONIZATION TRAINS
      // =========================================================
      for (let j = persistentTrains.length - 1; j >= 0; j--) {
        const train = persistentTrains[j];
        train.life++;

        const trainProgress = train.life / train.maxLife;
        const trainOpacity = (1 - Math.pow(trainProgress, 1.4)) * 0.38;

        if (trainOpacity <= 0 || train.life >= train.maxLife) {
          persistentTrains.splice(j, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(train.x1, train.y1);
        ctx.lineTo(train.x2, train.y2);
        ctx.strokeStyle = `rgba(147, 197, 253, ${trainOpacity})`;
        ctx.lineWidth = train.thickness;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="shooting-stars-canvas"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  );
}
