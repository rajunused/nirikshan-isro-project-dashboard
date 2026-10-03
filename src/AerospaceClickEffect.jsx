import React, { useEffect, useState } from 'react';

// Lightweight Aerospace Shockwave & Rocket Thruster Blast Effect System
export default function AerospaceClickEffect() {
  const [effects, setEffects] = useState([]);

  useEffect(() => {
    const handleClick = (e) => {
      // Trigger effect when clicking buttons, selects, inputs, or interactive elements
      const target = e.target.closest('button, select, input, .kpi-card, .tab-btn, .component-row-btn, .forest-cell');
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;

      // Unique effect ID
      const effectId = Date.now() + Math.random();

      // Generate 8 supersonic rocket thruster exhaust spark trajectories
      const sparks = Array.from({ length: 8 }, (_, i) => {
        const angle = (i * (Math.PI * 2) / 8) + (Math.random() - 0.5) * 0.4;
        const speed = 25 + Math.random() * 35;
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed;
        const isCore = i % 2 === 0;
        return {
          id: i,
          dx,
          dy,
          color: isCore ? '#38bdf8' : '#f97316',
          size: isCore ? 3.5 : 2.5
        };
      });

      const newEffect = {
        id: effectId,
        x,
        y,
        sparks,
      };

      setEffects((prev) => [...prev.slice(-8), newEffect]);

      // Automatic cleanup after animation finishes (480ms)
      setTimeout(() => {
        setEffects((prev) => prev.filter((eff) => eff.id !== effectId));
      }, 500);
    };

    window.addEventListener('click', handleClick, { capture: true });
    return () => window.removeEventListener('click', handleClick, { capture: true });
  }, []);

  if (effects.length === 0) return null;

  return (
    <div className="aerospace-click-layer">
      {effects.map((eff) => (
        <div
          key={eff.id}
          className="effect-origin"
          style={{ left: eff.x, top: eff.y }}
        >
          {/* 1. Transonic Aerodynamic Mach Shockwave Air Vapor Ring */}
          <div className="mach-air-ring" />
          <div className="mach-air-secondary-ring" />

          {/* 2. Supersonic Rocket Thruster Exhaust Ignition Sparks */}
          {eff.sparks.map((spark) => (
            <span
              key={spark.id}
              className="rocket-exhaust-spark"
              style={{
                '--dx': `${spark.dx}px`,
                '--dy': `${spark.dy}px`,
                '--spark-color': spark.color,
                width: `${spark.size}px`,
                height: `${spark.size}px`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
