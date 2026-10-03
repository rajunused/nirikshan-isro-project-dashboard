# 🛰️ NIRIKSHAN · Dynamic ESS Intelligence Hub
### High-Reliability Burn-in Screening Hub for Spaceflight Hardware
**SIH-PS170 • Indian Space Research Organisation (ISRO) / Department of Space (DOS)**

[![Vite](https://img.shields.io/badge/Vite-8.3.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.3.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_3D-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#)

---

## 🌌 Overview
**NIRIKSHAN** is an autonomous, browser-native flight component latent-defect screening intelligence hub engineered for satellite avionics and rad-hard space payloads. It evaluates dynamic leakage currents and parameter drift over 168-hour Environmental Stress Screening (ESS) burn-in cycles to predict mission anomalies before payload integration.

---

## ✨ Features

- **Photorealistic 3D Celestial Backdrop**:
  - WebGL 3D multi-galaxy engine powered by Three.js.
  - Features the Milky Way spiral galaxy core, distant Andromeda galaxy, James Webb Pillars of Creation cosmic nebula, and rotating Earth with atmospheric Rayleigh scattering.
- **Genuine Astronomical Shooting Stars**:
  - Hypersonic meteor simulation with ionizing plasma heads, tapered tails, and lingering persistent ionization trains.
- **Official ISRO Branding**:
  - Official vector logo with bilingual typography (*भारतीय अंतरिक्ष अनुसंधान संगठन / ISRO*).
- **Interactive Aerospace Launch Simulation HUD**:
  - Precision CAD vector launch vehicle modeled after ISRO's LVM3.
  - Supersonic Mach shock diamonds and plasma thruster exhaust.
  - Real-time telemetry: Mission Elapsed Time (`MET`), Altitude, Velocity (Mach), Downrange, and dynamic stage progression.
- **Aerodynamic Air & Rocket Click Effects**:
  - Transonic Mach air vapor rings and supersonic rocket thruster exhaust sparks on button clicks.
- **Minimalist Dark Space Dashboard**:
  - High-visibility frosted glass buttons, deep matte obsidian palettes (`#04060a`), and high-contrast electric neon cyan (`#00f0ff`) typography.
- **Interactive Telemetry Controls & Charts**:
  - Real-time Modified Z-Score bar chart, Mahalanobis Covariance scatter plot, and Isolation Forest anomaly heatmap.
  - Dynamic cost-sensitivity risk slider, safety slope threshold controls, Monte Carlo trajectory projection fan, and 96h actual telemetry arrival toggle.
  - CSV telemetry dossier export with formula injection sanitization.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/rajunused/nirikshan-isro.git

# Navigate into the project directory
cd nirikshan-isro

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open `http://localhost:5173/` in your browser.

### Production Build

```bash
# Build production bundle with Rolldown code-splitting
npm run build

# Preview production build locally
npm run preview
```

---

## 🔒 Security Hardening
- **0 Dependencies Vulnerabilities** verified via `npm audit`.
- Strict **Content Security Policy (CSP)** and HTTP security headers (`nosniff`, `DENY` framing, `strict-origin-when-cross-origin`).
- **CSV Formula Injection Mitigation** on all exported telemetry datasets.

---

## 📄 License
This project is open-source under the MIT License.
