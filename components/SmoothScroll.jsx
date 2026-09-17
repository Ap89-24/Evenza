"use client";

import { useEffect } from "react";

export default function SmoothScroll({ children }) {
  useEffect(() => {
    let lenis = null;
    let animationFrameId = null;

    async function initLenis() {
      try {
        let Lenis;
        try {
          const mod = await import("lenis");
          Lenis = mod.default || mod;
        } catch {
          // Dynamic CDN fallback if lenis package is not yet compiled in node_modules
          if (!window.Lenis) {
            await new Promise((resolve, reject) => {
              const script = document.createElement("script");
              script.src = "https://unpkg.com/lenis@1.1.18/dist/lenis.min.js";
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            });
          }
          Lenis = window.Lenis;
        }

        if (!Lenis) return;

        lenis = new Lenis({
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential smooth deceleration
          orientation: "vertical",
          gestureOrientation: "vertical",
          smoothWheel: true,
          smoothTouch: true, // Enable smooth scrolling on mobile & touch devices
          touchMultiplier: 2.0, // Optimized touch responsiveness for mobile UX
          wheelMultiplier: 1.0,
          lerp: 0.08, // Extra liquid-smooth interpolation
          autoResize: true,
        });

        // Request animation frame loop
        function raf(time) {
          if (lenis) {
            lenis.raf(time);
            animationFrameId = requestAnimationFrame(raf);
          }
        }

        animationFrameId = requestAnimationFrame(raf);
      } catch (err) {
        console.warn("Lenis smooth scroll initialization warning:", err.message);
      }
    }

    initLenis();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (lenis) {
        lenis.destroy();
      }
    };
  }, []);

  return <>{children}</>;
}
