import React, { useEffect, useRef, useState } from 'react';

/**
 * MonteCarloRocketDrawer
 * Renders an aerospace rocket animation that dynamically draws the Monte Carlo
 * simulated trajectory line across the graph and vanishes into deep space
 * upon mission completion.
 */
export default function MonteCarloRocketDrawer({
  containerRef,
  isActive,
  runId,
  data
}) {
  const [rocketState, setRocketState] = useState(null);
  const [particles, setParticles] = useState([]);
  const [beacon, setBeacon] = useState(null);
  const animFrameRef = useRef(null);
  const particleIdRef = useRef(0);

  useEffect(() => {
    if (!isActive || !containerRef.current) {
      setRocketState(null);
      setBeacon(null);
      setParticles([]);
      return;
    }

    // Cancel any previous running animation loop
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    setBeacon(null);

    // Give React and Recharts 1-2 frames to render the mcSim line in the DOM
    let attempts = 0;
    const maxAttempts = 15;

    const findAndAnimate = () => {
      const container = containerRef.current;
      if (!container) return;

      const pathEl =
        container.querySelector('.mc-rocket-line path.recharts-line-curve') ||
        container.querySelector('.mc-rocket-line path') ||
        container.querySelector('.mc-rocket-line .recharts-curve');

      if (!pathEl) {
        attempts++;
        if (attempts < maxAttempts) {
          animFrameRef.current = requestAnimationFrame(findAndAnimate);
        }
        return;
      }

      // Calculate pixel offset of the Recharts surface relative to container
      const surface = container.querySelector('.recharts-surface') || pathEl.ownerSVGElement;
      const surfaceRect = surface ? surface.getBoundingClientRect() : null;
      const containerRect = container.getBoundingClientRect();
      const offsetX = surfaceRect ? surfaceRect.left - containerRect.left : 12;
      const offsetY = surfaceRect ? surfaceRect.top - containerRect.top : 12;

      let totalLength = 0;
      try {
        totalLength = pathEl.getTotalLength();
      } catch (err) {
        totalLength = 0;
      }

      if (!totalLength || totalLength <= 10) {
        attempts++;
        if (attempts < maxAttempts) {
          animFrameRef.current = requestAnimationFrame(findAndAnimate);
        }
        return;
      }

      // Setup initial stroke dasharray to hide line initially
      pathEl.style.strokeDasharray = `${totalLength} ${totalLength}`;
      pathEl.style.strokeDashoffset = `${totalLength}`;
      pathEl.style.transition = 'none';

      const duration = 1500; // 1.5 seconds flight time
      let startTime = null;
      let activeParticles = [];

      const animateFlight = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth cubic-bezier ease-in-out
        const eased =
          progress < 0.5
            ? 2 * progress * progress
            : -1 + (4 - 2 * progress) * progress;

        const currentDist = eased * totalLength;
        const p1 = pathEl.getPointAtLength(currentDist);
        const p2 = pathEl.getPointAtLength(Math.min(totalLength, currentDist + 3));

        // Tangent angle in degrees
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
        const rocketX = p1.x + offsetX;
        const rocketY = p1.y + offsetY;

        // Progressively reveal the trajectory line
        pathEl.style.strokeDashoffset = `${totalLength - currentDist}`;

        // Emit exhaust trail particles from the rocket's thruster nozzle
        const rad = (angle * Math.PI) / 180;
        const nozzleX = rocketX - Math.cos(rad) * 16;
        const nozzleY = rocketY - Math.sin(rad) * 16;

        if (progress < 1) {
          for (let k = 0; k < 3; k++) {
            const spread = (Math.random() - 0.5) * 0.7;
            const speed = 1.2 + Math.random() * 2.5;
            activeParticles.push({
              id: particleIdRef.current++,
              x: nozzleX + (Math.random() - 0.5) * 4,
              y: nozzleY + (Math.random() - 0.5) * 4,
              vx: -Math.cos(rad + spread) * speed,
              vy: -Math.sin(rad + spread) * speed,
              size: 2 + Math.random() * 3.5,
              alpha: 0.95,
              color: Math.random() > 0.4 ? '#00f0ff' : Math.random() > 0.5 ? '#f97316' : '#ffffff'
            });
          }
        }

        // Update active particles (decay & drift)
        activeParticles = activeParticles
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            alpha: p.alpha - 0.045,
            size: p.size * 0.96
          }))
          .filter((p) => p.alpha > 0.05);

        setParticles([...activeParticles]);

        if (progress < 1) {
          setRocketState({
            x: rocketX,
            y: rocketY,
            angle,
            progress,
            vanishing: false,
            visible: true
          });
          animFrameRef.current = requestAnimationFrame(animateFlight);
        } else {
          // Mission reached final 168h waypoint!
          // Restore solid path without dash array
          pathEl.style.strokeDasharray = 'none';
          pathEl.style.strokeDashoffset = '0';

          // Set permanent beacon at final endpoint
          setBeacon({
            x: rocketX,
            y: rocketY
          });

          // Trigger supersonic burst and vanish into deep space
          setRocketState({
            x: rocketX,
            y: rocketY,
            angle,
            progress: 1,
            vanishing: true,
            visible: true
          });

          // After warp flare finishes (400ms), rocket vanishes completely
          setTimeout(() => {
            setRocketState(null);
            setParticles([]);
          }, 450);
        }
      };

      animFrameRef.current = requestAnimationFrame(animateFlight);
    };

    animFrameRef.current = requestAnimationFrame(findAndAnimate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isActive, runId]);

  if (!isActive) return null;

  return (
    <svg
      className="mc-rocket-canvas-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 15,
        overflow: 'visible'
      }}
    >
      <defs>
        {/* Glow filter for rocket plume and sparks */}
        <filter id="rocketPlumeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Thruster Flame Gradient */}
        <linearGradient id="thrusterJetGrad" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="30%" stopColor="#00f0ff" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#f97316" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </linearGradient>

        {/* Shockwave Flare Gradient */}
        <radialGradient id="warpBurstGrad">
          <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.5" />
          <stop offset="80%" stopColor="#f97316" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Exhaust Spark Particles */}
      <g className="exhaust-particles" filter="url(#rocketPlumeGlow)">
        {particles.map((p) => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.size}
            fill={p.color}
            opacity={p.alpha}
          />
        ))}
      </g>

      {/* Trajectory Endpoint Beacon Indicator */}
      {beacon && (
        <g className="mc-endpoint-beacon" transform={`translate(${beacon.x}, ${beacon.y})`}>
          <circle r="12" fill="none" stroke="#00f0ff" strokeWidth="1" opacity="0.4" className="beacon-ring" />
          <circle r="7" fill="none" stroke="#00f0ff" strokeWidth="1.5" opacity="0.75" />
          <circle r="3.5" fill="#00f0ff" />
          <circle r="1.5" fill="#ffffff" />
        </g>
      )}

      {/* The Rocket Vehicle */}
      {rocketState && rocketState.visible && (
        <g
          className={`mc-animated-rocket ${rocketState.vanishing ? 'vanishing' : ''}`}
          transform={`translate(${rocketState.x}, ${rocketState.y}) rotate(${rocketState.angle})`}
          style={{
            transformOrigin: '0px 0px',
            transition: rocketState.vanishing ? 'transform 0.4s ease-out, opacity 0.4s ease-out' : 'none',
            opacity: rocketState.vanishing ? 0 : 1,
            transform: rocketState.vanishing
              ? `translate(${rocketState.x + 35}, ${rocketState.y - 15}) rotate(${rocketState.angle}) scale(1.6)`
              : `translate(${rocketState.x}, ${rocketState.y}) rotate(${rocketState.angle})`
          }}
        >
          {/* Hypersonic Mach Shockwave Cone at Nose */}
          <path
            d="M 16 0 L 8 -7 L 8 7 Z"
            fill="none"
            stroke="rgba(0, 240, 255, 0.45)"
            strokeWidth="0.8"
          />

          {/* Vanish Warp Shock Ring */}
          {rocketState.vanishing && (
            <circle
              r="24"
              fill="url(#warpBurstGrad)"
              className="warp-burst-ring"
            />
          )}

          {/* Thruster Exhaust Flame */}
          <g filter="url(#rocketPlumeGlow)">
            {/* Outer Flame Plume */}
            <path
              d="M -11 0 L -28 -4.5 Q -38 0 -28 4.5 Z"
              fill="url(#thrusterJetGrad)"
            />
            {/* Core Intense Jet */}
            <path
              d="M -11 0 L -20 -2 Q -26 0 -20 2 Z"
              fill="#ffffff"
              opacity="0.9"
            />
            {/* Mach Diamonds in Exhaust Plume */}
            <polygon points="-16,-1.5 -18,0 -16,1.5 -14,0" fill="#ffffff" />
            <polygon points="-22,-1 -23.5,0 -22,1 -20.5,0" fill="#38bdf8" />
          </g>

          {/* Rocket Aerodynamic Body (ISRO Launch Vehicle Silhouette) */}
          <g className="rocket-cad-body">
            {/* Left Solid Booster */}
            <rect x="-8" y="-6.5" width="13" height="3" rx="1.5" fill="#1e293b" stroke="#38bdf8" strokeWidth="0.6" />
            {/* Right Solid Booster */}
            <rect x="-8" y="3.5" width="13" height="3" rx="1.5" fill="#1e293b" stroke="#38bdf8" strokeWidth="0.6" />

            {/* Core Fuselage */}
            <path
              d="M -11 -3.8 L 6 -3.8 Q 14 0 6 3.8 L -11 3.8 Z"
              fill="#0b1120"
              stroke="#00f0ff"
              strokeWidth="0.9"
            />

            {/* ISRO Tricolor Saffron Payload Band */}
            <rect x="2" y="-3.4" width="3.2" height="6.8" fill="#f97316" />

            {/* Nozzle Bell */}
            <path d="M -11 -2.5 L -13 -3.5 L -13 3.5 L -11 2.5 Z" fill="#475569" stroke="#94a3b8" strokeWidth="0.5" />

            {/* Center Avionics Cockpit Window / Sensor */}
            <circle cx="9" cy="0" r="1.1" fill="#00f0ff" filter="url(#rocketPlumeGlow)" />
          </g>
        </g>
      )}
    </svg>
  );
}
