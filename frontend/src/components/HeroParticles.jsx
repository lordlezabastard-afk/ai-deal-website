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

// Центр всех трёх форм смещён вправо — на десктопе текст занимает левую половину
// Hero, визуал (сфера/мозг/руки) — правую, центр формы садится на 73% ширины.
const SHAPE_CENTER_X_RATIO = 0.73;

function isPointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function generateSphere(count, width, height) {
  const cx = width * SHAPE_CENTER_X_RATIO;
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

// Нормализованные точки контура мозга (вид сбоку, 0..1 относительно bounding box).
const BRAIN_OUTLINE = [
  [0.15, 0.35], [0.18, 0.2], [0.25, 0.1], [0.35, 0.05],
  [0.45, 0.03], [0.55, 0.04], [0.63, 0.08], [0.7, 0.12],
  [0.76, 0.09], [0.82, 0.13], [0.87, 0.2], [0.9, 0.28],
  [0.92, 0.38], [0.91, 0.48],
  [0.88, 0.55], [0.85, 0.62], [0.8, 0.68],
  [0.72, 0.73], [0.62, 0.76], [0.55, 0.78],
  [0.48, 0.77], [0.4, 0.74],
  [0.3, 0.68], [0.22, 0.6], [0.16, 0.5], [0.13, 0.42],
];

function generateBrain(count, width, height) {
  const cx = width * SHAPE_CENTER_X_RATIO;
  const cy = height * 0.5;
  const scale = Math.min(width, height) * 0.62;
  const boxW = scale;
  const boxH = scale * 0.85;
  const originX = cx - boxW / 2;
  const originY = cy - boxH / 2;
  const rand = seededRandom(7);

  function toPixel([nx, ny]) {
    return [originX + nx * boxW, originY + ny * boxH];
  }
  const outlinePx = BRAIN_OUTLINE.map(toPixel);

  // Шаг 1 — плотная заливка силуэта (rejection sampling + ray casting).
  function fillSilhouette(n) {
    const pts = [];
    let guard = 0;
    while (pts.length < n && guard < n * 40) {
      guard++;
      const x = originX + rand() * boxW;
      const y = originY + rand() * boxH;
      if (isPointInPolygon(x, y, outlinePx)) pts.push({ x, y, emphasis: 0 });
    }
    return pts;
  }

  // Шаг 2 — извилины: частицы вдоль bezier-дуг внутри формы.
  function gyriPoints(n) {
    const arcs = 6;
    const perArc = Math.ceil(n / arcs);
    const pts = [];
    for (let a = 0; a < arcs && pts.length < n; a++) {
      const yLevel = 0.18 + (a / (arcs - 1)) * 0.55;
      const p0 = toPixel([0.18, yLevel]);
      const p1 = toPixel([0.4, yLevel - 0.06 + rand() * 0.05]);
      const p2 = toPixel([0.65, yLevel + 0.06 - rand() * 0.05]);
      const p3 = toPixel([0.85, yLevel]);
      for (let s = 0; s < perArc && pts.length < n; s++) {
        const t = s / perArc;
        const mt = 1 - t;
        const x =
          mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0];
        const y =
          mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1];
        if (isPointInPolygon(x, y, outlinePx)) pts.push({ x, y, emphasis: 0 });
      }
    }
    return pts;
  }

  // Шаг 3 — нейронные лучи: от границы формы наружу, с яркой конечной точкой.
  function rayPoints(n) {
    const pts = [];
    const avgPerRay = 5;
    const numRays = Math.max(1, Math.round(n / avgPerRay));
    for (let i = 0; i < numRays && pts.length < n; i++) {
      const angle = (i / numRays) * Math.PI * 2 + (rand() - 0.5) * 0.3;
      const startR = scale * (0.38 + rand() * 0.08);
      const endR = scale * (0.52 + rand() * 0.22);
      const startX = cx + Math.cos(angle) * startR * 0.85;
      const startY = cy + Math.sin(angle) * startR * 0.72;
      const endX = cx + Math.cos(angle) * endR * 0.85;
      const endY = cy + Math.sin(angle) * endR * 0.72;
      const segments = 3 + Math.floor(rand() * 3);
      for (let s = 0; s <= segments && pts.length < n; s++) {
        const t = s / segments;
        const isEndPoint = s === segments;
        pts.push({
          x: startX + (endX - startX) * t,
          y: startY + (endY - startY) * t,
          emphasis: isEndPoint ? 1 : t * 0.55,
        });
      }
    }
    return pts;
  }

  const rayCount = Math.round(count * 0.2);
  const gyriCount = Math.round(count * 0.1);
  const bodyCount = count - rayCount - gyriCount;

  const points = [...fillSilhouette(bodyCount), ...gyriPoints(gyriCount), ...rayPoints(rayCount)];
  while (points.length < count) points.push({ ...points[points.length % Math.max(1, points.length)] });
  return points.slice(0, count);
}

// Нормализованные точки контура руки относительно центра формы (запястье сверху-слева,
// пальцы тянутся к центру). Правая рука — зеркальное и перевёрнутое отражение левой,
// руки встречаются в центре.
const LEFT_HAND_POINTS = [
  [-0.42, -0.28], [-0.35, -0.25], [-0.28, -0.22], [-0.38, -0.18],
  [-0.25, -0.15], [-0.18, -0.1], [-0.12, -0.05],
  [-0.2, -0.08], [-0.15, -0.02], [-0.1, 0.03],
  [-0.22, -0.12], [-0.26, -0.06], [-0.24, 0.0],
  [-0.08, -0.08], [-0.04, -0.02], [-0.02, 0.04],
  [-0.05, -0.1], [0.0, -0.04], [0.02, 0.03], [0.03, 0.08],
  [-0.02, -0.08], [0.02, -0.02], [0.04, 0.04],
  [0.01, -0.06], [0.05, -0.01], [0.06, 0.04],
];
const RIGHT_HAND_POINTS = LEFT_HAND_POINTS.map(([x, y]) => [-x, -y]);

function generateHandshake(count, width, height) {
  const cx = width * SHAPE_CENTER_X_RATIO;
  const cy = height * 0.5;
  const scale = Math.min(width, height) * 1.15;
  const rand = seededRandom(13);

  function toPixel([nx, ny]) {
    return [cx + nx * scale, cy + ny * scale];
  }
  const leftPoly = LEFT_HAND_POINTS.map(toPixel);
  const rightPoly = RIGHT_HAND_POINTS.map(toPixel);

  function bbox(poly) {
    const xs = poly.map((p) => p[0]);
    const ys = poly.map((p) => p[1]);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  }

  function fillHand(n, poly) {
    const box = bbox(poly);
    const pts = [];
    let guard = 0;
    while (pts.length < n && guard < n * 40) {
      guard++;
      const x = box.minX + rand() * (box.maxX - box.minX);
      const y = box.minY + rand() * (box.maxY - box.minY);
      if (isPointInPolygon(x, y, poly)) {
        const dist = Math.hypot(x - cx, y - cy);
        const energy = dist < scale * 0.05 ? 1 : 0;
        pts.push({ x, y, emphasis: energy });
      }
    }
    return pts;
  }

  const halfCount = Math.floor(count / 2);
  const points = [...fillHand(halfCount, leftPoly), ...fillHand(count - halfCount, rightPoly)];
  while (points.length < count) points.push({ ...points[points.length % Math.max(1, points.length)] });
  return points.slice(0, count);
}

const CONNECTIONS_MAX_PARTICLES = 800;
const CONNECTIONS_MAX_DIST = 35;

function drawConnections(particles, ctx, maxDist, alphaScale) {
  if (alphaScale <= 0.01) return;
  ctx.lineWidth = 0.5;
  const n = Math.min(particles.length, CONNECTIONS_MAX_PARTICLES);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < maxDist) {
        const alpha = (1 - dist / maxDist) * 0.3 * alphaScale;
        ctx.strokeStyle = `rgba(128, 82, 255, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
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
          emphasis: 0,
          fromEmphasis: 0,
          toEmphasis: 0,
        });
      }

      return {
        particles,
        layouts,
        sphereRotation: 0,
        morphStart: 0,
        morphing: false,
        morphTarget: 0,
        handshakeFactor: 0,
      };
    }

    stateRef.current = buildParticles();

    function startMorph(targetIndex) {
      const state = stateRef.current;
      const targetLayout = state.layouts[targetIndex];
      const targetPalette = SECTION_PALETTES[targetIndex];
      const rand = seededRandom(100 + targetIndex);
      state.fromIndex = state.morphTarget;
      state.particles.forEach((particle, i) => {
        particle.fromX = particle.x;
        particle.fromY = particle.y;
        particle.fromColor = [...particle.color];
        particle.fromEmphasis = particle.emphasis;
        let targetEmphasis = 0;
        if (targetIndex === 0) {
          const live = sphereLivePosition(state.layouts[0][i], state.sphereRotation);
          particle.toX = live.x;
          particle.toY = live.y;
        } else {
          const p = targetLayout[i];
          particle.toX = p.x;
          particle.toY = p.y;
          targetEmphasis = p.emphasis || 0;
        }
        particle.toEmphasis = targetEmphasis;
        const emphasisColor =
          targetEmphasis > 0.5 ? PALETTE.bone : pickWeighted(rand(), targetPalette).color;
        particle.toColor = emphasisColor;
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
      const c = lerpColor(p.color, PALETTE.bone, p.emphasis * 0.8);
      const opacity = Math.min(1, p.opacity + p.emphasis * 0.5);
      ctx.fillStyle = `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(
        c[2]
      )},${opacity})`;
      const x = p.x;
      const y = p.y;
      const s = p.size * (1 + p.emphasis * 1.4);
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

      const desiredHandshakeFactor =
        state.morphing
          ? lerp(state.fromIndex === 2 ? 1 : 0, state.morphTarget === 2 ? 1 : 0, eased)
          : activeIndexRef.current === 2
          ? 1
          : 0;
      state.handshakeFactor = desiredHandshakeFactor;

      ctx.clearRect(0, 0, width, height);

      state.particles.forEach((p) => {
        const baseX = lerp(p.fromX, p.toX, eased);
        const baseY = lerp(p.fromY, p.toY, eased);
        p.color = lerpColor(p.fromColor, p.toColor, eased);
        p.emphasis = lerp(p.fromEmphasis, p.toEmphasis, eased);

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

      drawConnections(state.particles, ctx, CONNECTIONS_MAX_DIST, state.handshakeFactor);

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
