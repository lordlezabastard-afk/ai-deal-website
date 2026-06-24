import { useEffect, useRef } from "react";
import "./HeroParticles.css";

const SHAPE_WEIGHTS = [
  { shape: "triangle", weight: 0.4 },
  { shape: "circle", weight: 0.35 },
  { shape: "diamond", weight: 0.25 },
];

// [r, g, b] для каждого цвета палитры Dala, используемого в частицах.
const PALETTE = {
  plum: [128, 82, 255],
  bone: [255, 255, 255],
  ash: [189, 189, 189],
  amber: [255, 184, 41],
  lichen: [21, 132, 110],
};

// Распределение цветов частиц по секциям (доли в сумме = 1).
const SECTION_PALETTES = [
  [
    { color: PALETTE.plum, weight: 0.6 },
    { color: PALETTE.bone, weight: 0.25 },
    { color: PALETTE.ash, weight: 0.15 },
  ],
  [
    { color: PALETTE.plum, weight: 0.5 },
    { color: PALETTE.amber, weight: 0.3 },
    { color: PALETTE.lichen, weight: 0.2 },
  ],
  [
    { color: PALETTE.plum, weight: 0.55 },
    { color: PALETTE.lichen, weight: 0.25 },
    { color: PALETTE.bone, weight: 0.2 },
  ],
];

const MORPH_DURATION = 1800;
const REPEL_RADIUS = 120;
const REPEL_STRENGTH = 22;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function pickWeighted(rand, items) {
  let r = rand * items.reduce((sum, item) => sum + item.weight, 0);
  for (const item of items) {
    if (r < item.weight) return item;
    r -= item.weight;
  }
  return items[items.length - 1];
}

// Простой детерминированный псевдослучайный генератор по индексу — чтобы форма
// частицы/цвет/breathing-параметры были стабильны между перегенерациями (resize).
function seededRandom(seed) {
  let s = seed;
  return function next() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateSphere(count, width, height) {
  const cx = width * 0.62;
  const cy = height * 0.48;
  const radius = Math.min(width, height) * 0.38;
  const points = [];
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    points.push({ phi, theta, cx, cy, radius });
  }
  return points;
}

function sphereLivePosition(p, rotation) {
  const theta = p.theta + rotation;
  return {
    x: p.cx + p.radius * Math.sin(p.phi) * Math.cos(theta),
    y: p.cy + p.radius * Math.cos(p.phi) * 0.55,
  };
}

function generateBrain(count, width, height) {
  const cx = width * 0.58;
  const cy = height * 0.5;
  const scale = Math.min(width, height) * 0.3;
  const points = [];
  // Силуэт мозга — два налегающих эллипса-полушария, заполненные точками (rejection
  // sampling), с узкой щелью посередине (продольная борозда). Заполнение области, а не
  // тонкая параметрическая кривая, даёт читаемый плотный силуэт вместо спутанной "загогулины".
  const rand = seededRandom(7);
  const rx = scale * 0.42;
  const ry = scale * 0.34;
  const lobeOffset = scale * 0.24;
  const sulcusHalfWidth = scale * 0.025;
  const left = { x: cx - lobeOffset, y: cy };
  const right = { x: cx + lobeOffset, y: cy };

  function inLobe(x, y, lobe) {
    const dx = (x - lobe.x) / rx;
    const dy = (y - lobe.y) / ry;
    return dx * dx + dy * dy <= 1;
  }

  for (let i = 0; i < count; i++) {
    let x;
    let y;
    let attempts = 0;
    do {
      x = cx + (rand() * 2 - 1) * (rx + lobeOffset);
      y = cy + (rand() * 2 - 1) * ry;
      attempts++;
    } while (
      attempts < 12 &&
      (Math.abs(x - cx) < sulcusHalfWidth || !(inLobe(x, y, left) || inLobe(x, y, right)))
    );
    points.push({ x, y });
  }
  return points;
}

// Метафора партнёрства: две сферы, тянущиеся друг к другу и соприкасающиеся в центре.
// Заменяет исходную идею "рукопожатие" — параметрическая кривая ладони/пальцев
// давала нечитаемый спутанный силуэт; пара чётких сфер читается мгновенно.
function generateHandshake(count, width, height) {
  const cy = height * 0.5;
  const cx = width * 0.5;
  const r = Math.min(width, height) * 0.16;
  const leftCenter = { x: cx - r, y: cy };
  const rightCenter = { x: cx + r, y: cy };
  const rand = seededRandom(13);
  const points = [];
  const halfCount = Math.floor(count / 2);

  function fillDisk(count_, center) {
    const pts = [];
    for (let i = 0; i < count_; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = r * Math.sqrt(rand());
      pts.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      });
    }
    return pts;
  }

  points.push(...fillDisk(halfCount, leftCenter));
  points.push(...fillDisk(count - halfCount, rightCenter));
  return points;
}

const SHAPE_GENERATORS = [generateSphere, generateBrain, generateHandshake];

function getParticleCount(width) {
  return width <= 768 ? 1000 : 2000;
}

function HeroParticles({ activeIndex }) {
  const canvasRef = useRef(null);
  const activeIndexRef = useRef(activeIndex);
  const stateRef = useRef(null);
  const startMorphRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let rafId;
    const mouse = { x: null, y: null };

    function buildParticles() {
      const count = getParticleCount(width);
      const rand = seededRandom(42);
      const particles = [];
      const layouts = SHAPE_GENERATORS.map((gen) => gen(count, width, height));
      const sphereLayout = layouts[0].map((p) => sphereLivePosition(p, 0));

      for (let i = 0; i < count; i++) {
        const shapeDef = pickWeighted(rand(), SHAPE_WEIGHTS);
        const startColor = pickWeighted(rand(), SECTION_PALETTES[0]).color;
        const start = sphereLayout[i] || { x: width / 2, y: height / 2 };
        particles.push({
          x: start.x,
          y: start.y,
          fromX: start.x,
          fromY: start.y,
          toX: start.x,
          toY: start.y,
          color: [...startColor],
          fromColor: [...startColor],
          toColor: [...startColor],
          shape: shapeDef.shape,
          size: 2 + rand() * 3,
          opacity: 0.4 + rand() * 0.5,
          breathAmpX: 3 + rand() * 5,
          breathAmpY: 3 + rand() * 5,
          breathFreq: 0.5 + rand() * 1,
          breathPhase: rand() * Math.PI * 2,
          repelX: 0,
          repelY: 0,
        });
      }

      return { particles, layouts, sphereRotation: 0, morphStart: 0, morphing: false };
    }

    stateRef.current = buildParticles();

    function startMorph(targetIndex) {
      const state = stateRef.current;
      const targetLayout = state.layouts[targetIndex];
      const targetPalette = SECTION_PALETTES[targetIndex];
      const rand = seededRandom(100 + targetIndex);
      state.particles.forEach((particle, i) => {
        particle.fromX = particle.x;
        particle.fromY = particle.y;
        particle.fromColor = [...particle.color];
        if (targetIndex === 0) {
          const live = sphereLivePosition(state.layouts[0][i], state.sphereRotation);
          particle.toX = live.x;
          particle.toY = live.y;
        } else {
          const p = targetLayout[i];
          particle.toX = p.x;
          particle.toY = p.y;
        }
        particle.toColor = pickWeighted(rand(), targetPalette).color;
      });
      state.morphStart = performance.now();
      state.morphing = true;
      state.morphTarget = targetIndex;
    }

    startMorphRef.current = startMorph;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      stateRef.current = buildParticles();
      startMorph(activeIndexRef.current);
    }

    function drawParticle(p) {
      ctx.fillStyle = `rgba(${Math.round(p.color[0])},${Math.round(p.color[1])},${Math.round(
        p.color[2]
      )},${p.opacity})`;
      const x = p.x;
      const y = p.y;
      const s = p.size;
      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(x, y, s / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === "diamond") {
        ctx.beginPath();
        ctx.moveTo(x, y - s / 2);
        ctx.lineTo(x + s / 2, y);
        ctx.lineTo(x, y + s / 2);
        ctx.lineTo(x - s / 2, y);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(x, y - s / 2);
        ctx.lineTo(x + s / 2, y + s / 2);
        ctx.lineTo(x - s / 2, y + s / 2);
        ctx.closePath();
        ctx.fill();
      }
    }

    function draw(now) {
      const state = stateRef.current;
      state.sphereRotation += 0.003;

      let eased = 1;
      if (state.morphing) {
        const elapsed = now - state.morphStart;
        const progress = Math.min(1, elapsed / MORPH_DURATION);
        eased = easeInOutCubic(progress);
        if (progress >= 1) state.morphing = false;
      }

      // Во время морфинга в сферу цель сама вращается каждый кадр.
      if (state.morphing && state.morphTarget === 0) {
        state.particles.forEach((p, i) => {
          const live = sphereLivePosition(state.layouts[0][i], state.sphereRotation);
          p.toX = live.x;
          p.toY = live.y;
        });
      } else if (!state.morphing && activeIndexRef.current === 0) {
        state.particles.forEach((p, i) => {
          const live = sphereLivePosition(state.layouts[0][i], state.sphereRotation);
          p.toX = live.x;
          p.toY = live.y;
          p.fromX = live.x;
          p.fromY = live.y;
        });
      }

      ctx.clearRect(0, 0, width, height);

      state.particles.forEach((p) => {
        const baseX = lerp(p.fromX, p.toX, eased);
        const baseY = lerp(p.fromY, p.toY, eased);
        p.color = lerpColor(p.fromColor, p.toColor, eased);

        const breathX = Math.sin(now * 0.001 * p.breathFreq + p.breathPhase) * p.breathAmpX;
        const breathY = Math.cos(now * 0.0013 * p.breathFreq + p.breathPhase) * p.breathAmpY;

        let desiredRepelX = 0;
        let desiredRepelY = 0;
        if (mouse.x !== null) {
          const dx = baseX + breathX - mouse.x;
          const dy = baseY + breathY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < REPEL_RADIUS && dist > 0.01) {
            const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
            desiredRepelX = (dx / dist) * force;
            desiredRepelY = (dy / dist) * force;
          }
        }
        p.repelX = lerp(p.repelX, desiredRepelX, 0.15);
        p.repelY = lerp(p.repelY, desiredRepelY, 0.15);

        p.x = baseX + breathX + p.repelX;
        p.y = baseY + breathY + p.repelY;

        drawParticle(p);
      });

      rafId = requestAnimationFrame(draw);
    }

    function handleMouseMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }

    function handleMouseLeave() {
      mouse.x = null;
      mouse.y = null;
    }

    resize();
    rafId = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
    const state = stateRef.current;
    if (state && state.morphTarget !== activeIndex) {
      startMorphRef.current?.(activeIndex);
    }
  }, [activeIndex]);

  return <canvas ref={canvasRef} className="hero-particles" />;
}

export default HeroParticles;
