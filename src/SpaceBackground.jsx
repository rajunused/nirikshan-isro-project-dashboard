import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function SpaceBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 3000);
    camera.position.set(0, 0, 115);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // =========================================================
    // 1. DEEP 3D STARFIELD (3,200 Multi-spectral Stars)
    // =========================================================
    const starCount = 3200;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const colorPalette = [
      new THREE.Color('#ffffff'), // Pure White
      new THREE.Color('#93c5fd'), // Hot O/B Blue
      new THREE.Color('#c7d2fe'), // Blue-White
      new THREE.Color('#fbcfe8'), // Ethereal Nebula Pink
      new THREE.Color('#fed7aa'), // Stellar Amber
      new THREE.Color('#a78bfa'), // Deep Violet
    ];

    for (let i = 0; i < starCount; i++) {
      const r = 240 + Math.random() * 900;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = -140 - Math.random() * 850;

      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      starColors[i * 3] = col.r;
      starColors[i * 3 + 1] = col.g;
      starColors[i * 3 + 2] = col.b;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    // Custom star particle texture with soft natural glow
    const starCanvas = document.createElement('canvas');
    starCanvas.width = 32;
    starCanvas.height = 32;
    const sCtx = starCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    sGrad.addColorStop(0, 'rgba(255,255,255,1)');
    sGrad.addColorStop(0.25, 'rgba(220,235,255,0.9)');
    sGrad.addColorStop(0.65, 'rgba(180,210,255,0.22)');
    sGrad.addColorStop(1, 'rgba(0,0,0,0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 32, 32);
    const starTexture = new THREE.CanvasTexture(starCanvas);

    const starMaterial = new THREE.PointsMaterial({
      size: 3.0,
      map: starTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    masterGroup.add(starField);

    // =========================================================
    // 2. PRIMARY MILKY WAY GALAXY SPIRAL (3D TILTED PLANE)
    // =========================================================
    const galaxyTexture = textureLoader.load('/galaxy.jpg');
    galaxyTexture.colorSpace = THREE.SRGBColorSpace;

    const galaxyGeo = new THREE.PlaneGeometry(360, 240);
    const galaxyMat = new THREE.MeshBasicMaterial({
      map: galaxyTexture,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const galaxyMesh = new THREE.Mesh(galaxyGeo, galaxyMat);
    galaxyMesh.position.set(50, 14, -260);
    galaxyMesh.rotation.x = -0.52;
    galaxyMesh.rotation.y = 0.28;
    galaxyMesh.rotation.z = 0.38;
    masterGroup.add(galaxyMesh);

    // =========================================================
    // 3. SECONDARY DISTANT SPIRAL GALAXY (ANDROMEDA-STYLE)
    // =========================================================
    // Positioned in the upper-left cosmic quadrant in depth without glare
    const andromedaTexture = textureLoader.load('/andromeda.jpg');
    andromedaTexture.colorSpace = THREE.SRGBColorSpace;

    const andromedaGeo = new THREE.PlaneGeometry(280, 170);
    const andromedaMat = new THREE.MeshBasicMaterial({
      map: andromedaTexture,
      transparent: true,
      opacity: 0.48,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const andromedaMesh = new THREE.Mesh(andromedaGeo, andromedaMat);
    andromedaMesh.position.set(-85, 38, -320);
    andromedaMesh.rotation.x = -0.35;
    andromedaMesh.rotation.y = -0.42;
    andromedaMesh.rotation.z = 0.55;
    masterGroup.add(andromedaMesh);

    // =========================================================
    // 4. DEEP SPACE NEBULA CLOUDS (INTERSTELLAR DUST PILLARS)
    // =========================================================
    const nebulaTexture = textureLoader.load('/nebula.jpg');
    nebulaTexture.colorSpace = THREE.SRGBColorSpace;

    // Primary Cosmic Dust Nebula Field (Mid-background depth)
    const nebulaGeo = new THREE.PlaneGeometry(500, 320);
    const nebulaMat = new THREE.MeshBasicMaterial({
      map: nebulaTexture,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const nebulaMesh = new THREE.Mesh(nebulaGeo, nebulaMat);
    nebulaMesh.position.set(-20, -10, -360);
    nebulaMesh.rotation.z = -0.22;
    masterGroup.add(nebulaMesh);

    // Deep Outer Nebular Shroud (Extreme depth z = -580)
    const deepNebulaGeo = new THREE.PlaneGeometry(800, 500);
    const deepNebulaMat = new THREE.MeshBasicMaterial({
      map: nebulaTexture,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const deepNebulaMesh = new THREE.Mesh(deepNebulaGeo, deepNebulaMat);
    deepNebulaMesh.position.set(40, -30, -580);
    deepNebulaMesh.rotation.z = 0.85;
    masterGroup.add(deepNebulaMesh);

    // =========================================================
    // 5. CELESTIAL PLANET IN REALISTIC 3D ORBIT
    // =========================================================
    const planetGroup = new THREE.Group();
    planetGroup.position.set(74, -24, -70);
    masterGroup.add(planetGroup);

    const planetTexture = textureLoader.load('/earth.jpg');
    planetTexture.colorSpace = THREE.SRGBColorSpace;

    const planetRadius = 24;
    const planetGeo = new THREE.SphereGeometry(planetRadius, 64, 64);
    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTexture,
      roughness: 0.82,
      metalness: 0.08,
    });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetMesh.rotation.z = THREE.MathUtils.degToRad(23.44); // Authentic Earth axial tilt
    planetGroup.add(planetMesh);

    // Atmospheric Rayleigh Scattering Halo
    const atmosphereGeo = new THREE.SphereGeometry(planetRadius * 1.05, 48, 48);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.6);
          vec3 atmosphereColor = vec3(0.22, 0.74, 0.97); // Cyan atmospheric rim
          gl_FragColor = vec4(atmosphereColor, intensity * 0.75);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    planetGroup.add(atmosphereMesh);

    // =========================================================
    // 6. BALANCED DEEP SPACE LIGHTING (PRESERVING READABILITY)
    // =========================================================
    // Directional celestial starlight illumination (soft, no blinding glare)
    const starlight = new THREE.DirectionalLight('#e0f2fe', 2.8);
    starlight.position.set(-100, 70, 120);
    scene.add(starlight);

    // Subtle galactic rim light (cool cyan/indigo)
    const galacticRimLight = new THREE.DirectionalLight('#38bdf8', 1.2);
    galacticRimLight.position.set(130, -50, -40);
    scene.add(galacticRimLight);

    // Deep space ambient fill
    const spaceAmbientLight = new THREE.AmbientLight('#080d18', 0.9);
    scene.add(spaceAmbientLight);

    // =========================================================
    // 7. MOUSE PARALLAX & CONTINUOUS 3D MOTION
    // =========================================================
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId;
    let lastTime = performance.now();
    const startTime = performance.now();

    const animate = (currentTime) => {
      animationFrameId = requestAnimationFrame(animate);
      const now = currentTime || performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const elapsed = (now - startTime) / 1000;

      // Smooth inertia damping for camera parallax
      targetX += (mouseX - targetX) * 0.035;
      targetY += (mouseY - targetY) * 0.035;

      camera.position.x = targetX * 14;
      camera.position.y = -targetY * 9;
      camera.lookAt(0, 0, -100);

      // Primary Milky Way galaxy disc rotation
      galaxyMesh.rotation.z += delta * 0.012;

      // Secondary Andromeda galaxy gentle drift
      andromedaMesh.rotation.z -= delta * 0.008;

      // Deep space nebula slow undulating drift
      nebulaMesh.rotation.z += delta * 0.004;
      deepNebulaMesh.rotation.z -= delta * 0.003;

      // Realistic 3D Planet axial rotation
      planetMesh.rotation.y += delta * 0.035;

      // Planetary orbital wobble
      planetGroup.position.y = -24 + Math.sin(elapsed * 0.35) * 2.2;
      planetGroup.position.x = 74 + Math.cos(elapsed * 0.25) * 1.8;

      // Starfield subtle twinkling drift
      starField.rotation.y += delta * 0.002;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      starTexture.dispose();
      galaxyGeo.dispose();
      galaxyMat.dispose();
      andromedaGeo.dispose();
      andromedaMat.dispose();
      nebulaGeo.dispose();
      nebulaMat.dispose();
      deepNebulaGeo.dispose();
      deepNebulaMat.dispose();
      planetGeo.dispose();
      planetMat.dispose();
      atmosphereGeo.dispose();
      atmosphereMat.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="space-3d-viewport"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    />
  );
}
