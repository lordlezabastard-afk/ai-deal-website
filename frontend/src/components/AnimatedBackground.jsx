import { useEffect, useRef } from "react";
import "./AnimatedBackground.css";

export const ACCENT_COLORS = {
  purple: [167, 139, 250],
  green: [52, 211, 153],
  orange: [251, 191, 36],
};

function lerpColor(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// Анимированный canvas-фон с частицами/орбами и плавно перетекающим акцентным цветом.
// colorRgb может меняться во времени (например, на Hero — по активной секции),
// scrollProgressRef — необязательный ref с прогрессом скролла (0..1) для лёгкого
// смещения частиц; на статичных страницах не передаётся (частицы просто дрейфуют сами).
function AnimatedBackground({ colorRgb, scrollProgressRef, className = "" }) {
  const canvasRef = useRef(null);
  const targetColorRef = useRef(colorRgb);
  const currentColorRef = useRef([...colorRgb]);

  useEffect(() => {
    targetColorRef.current = colorRgb;
  }, [colorRgb]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let rafId;

    const particles = Array.from({ length: 58 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00055,
      vy: (Math.random() - 0.5) * 0.00055,
    }));

    const orbs = [
      { baseX: 0.2, baseY: 0.32, r: 0.28, phase: 0, speed: 0.00022 },
      { baseX: 0.78, baseY: 0.26, r: 0.22, phase: 2.1, speed: 0.00028 },
      { baseX: 0.5, baseY: 0.78, r: 0.3, phase: 4.2, speed: 0.0002 },
    ];

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    resize();
    window.addEventListener("resize", resize);

    function draw() {
      currentColorRef.current = lerpColor(currentColorRef.current, targetColorRef.current, 0.02);
      const [r, g, b] = currentColorRef.current.map(Math.round);

      const offsetY = ((scrollProgressRef?.current ?? 0.5) - 0.5) * 40;

      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(255,255,255,0.035)";
      ctx.lineWidth = 1;
      const gridSize = 42;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const now = Date.now();
      orbs.forEach((orb) => {
        const x = (orb.baseX + Math.sin(now * orb.speed + orb.phase) * 0.07) * width;
        const y = (orb.baseY + Math.cos(now * orb.speed * 0.8 + orb.phase) * 0.06) * height + offsetY;
        const radius = orb.r * Math.max(width, height);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(${r},${g},${b},0.28)`);
        gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      const pts = particles.map((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
        return { x: p.x * width, y: p.y * height + offsetY };
      });

      ctx.strokeStyle = `rgba(${r},${g},${b},0.15)`;
      ctx.lineWidth = 1;
      const maxDist = 110;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = `rgba(${r},${g},${b},0.75)`;
      pts.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      rafId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={`animated-background ${className}`} />;
}

export default AnimatedBackground;
