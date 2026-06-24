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

// Контуры мозга и рукопожатия взяты из реальных SVG-иконок (Font Awesome Free,
// CC BY 4.0 — https://fontawesome.com/license/free), а не нарисованы вручную:
// точные path-данные дают анатомически узнаваемый силуэт с естественными
// извилинами/пальцами без подбора координат на глаз.
const BRAIN_VIEWBOX = { w: 512, h: 512 };
const BRAIN_PATH_D =
  "M184 0c30.9 0 56 25.1 56 56l0 400c0 30.9-25.1 56-56 56c-28.9 0-52.7-21.9-55.7-50.1c-5.2 1.4-10.7 2.1-16.3 2.1c-35.3 0-64-28.7-64-64c0-7.4 1.3-14.6 3.6-21.2C21.4 367.4 0 338.2 0 304c0-31.9 18.7-59.5 45.8-72.3C37.1 220.8 32 207 32 192c0-30.7 21.6-56.3 50.4-62.6C80.8 123.9 80 118 80 112c0-29.9 20.6-55.1 48.3-62.1C131.3 21.9 155.1 0 184 0zM328 0c28.9 0 52.6 21.9 55.7 49.9c27.8 7 48.3 32.1 48.3 62.1c0 6-.8 11.9-2.4 17.4c28.8 6.2 50.4 31.9 50.4 62.6c0 15-5.1 28.8-13.8 39.7C493.3 244.5 512 272.1 512 304c0 34.2-21.4 63.4-51.6 74.8c2.3 6.6 3.6 13.8 3.6 21.2c0 35.3-28.7 64-64 64c-5.6 0-11.1-.7-16.3-2.1c-3 28.2-26.8 50.1-55.7 50.1c-30.9 0-56-25.1-56-56l0-400c0-30.9 25.1-56 56-56z";

const HANDSHAKE_VIEWBOX = { w: 640, h: 512 };
const HANDSHAKE_PATH_D =
  "M323.4 85.2l-96.8 78.4c-16.1 13-19.2 36.4-7 53.1c12.9 17.8 38 21.3 55.3 7.8l99.3-77.2c7-5.4 17-4.2 22.5 2.8s4.2 17-2.8 22.5l-20.9 16.2L512 316.8 512 128l-.7 0-3.9-2.5L434.8 79c-15.3-9.8-33.2-15-51.4-15c-21.8 0-43 7.5-60 21.2zm22.8 124.4l-51.7 40.2C263 274.4 217.3 268 193.7 235.6c-22.2-30.5-16.6-73.1 12.7-96.8l83.2-67.3c-11.6-4.9-24.1-7.4-36.8-7.4C234 64 215.7 69.6 200 80l-72 48 0 224 28.2 0 91.4 83.4c19.6 17.9 49.9 16.5 67.8-3.1c5.5-6.1 9.2-13.2 11.1-20.6l17 15.6c19.5 17.9 49.9 16.6 67.8-2.9c4.5-4.9 7.8-10.6 9.9-16.5c19.4 13 45.8 10.3 62.1-7.5c17.9-19.5 16.6-49.9-2.9-67.8l-134.2-123zM16 128c-8.8 0-16 7.2-16 16L0 352c0 17.7 14.3 32 32 32l32 0c17.7 0 32-14.3 32-32l0-224-80 0zM48 320a16 16 0 1 1 0 32 16 16 0 1 1 0-32zM544 128l0 224c0 17.7 14.3 32 32 32l32 0c17.7 0 32-14.3 32-32l0-208c0-8.8-7.2-16-16-16l-80 0zm32 208a16 16 0 1 1 32 0 16 16 0 1 1 -32 0z";

// Скрытый <path> в DOM даёт доступ к точной геометрии SVG-контура без ручного
// подбора координат: isPointInFill() — авторитетный тест "точка внутри заливки"
// (с учётом fill-rule браузера, корректно обрабатывает вложенные subpath-ы —
// например "дырку" между пальцами в иконке handshake); getTotalLength()/
// getPointAtLength() — точные точки на самом контуре, для чёткой прорисовки края.
function createPathElement(d) {
  let pathEl = null;
  return function ensure() {
    if (!pathEl) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.style.position = "absolute";
      svg.style.width = "0";
      svg.style.height = "0";
      svg.style.overflow = "hidden";
      pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
      pathEl.setAttribute("d", d);
      svg.appendChild(pathEl);
      document.body.appendChild(svg);
    }
    return pathEl;
  };
}

const ensureBrainPath = createPathElement(BRAIN_PATH_D);
const ensureHandshakePath = createPathElement(HANDSHAKE_PATH_D);

function isInsidePath(ensurePath, x, y) {
  return ensurePath().isPointInFill(new DOMPoint(x, y));
}

let brainOutlineCache = null;
function getBrainOutline() {
  if (!brainOutlineCache) {
    const pathEl = ensureBrainPath();
    const length = pathEl.getTotalLength();
    const samples = 60;
    brainOutlineCache = Array.from({ length: samples }, (_, i) => {
      const pt = pathEl.getPointAtLength((i / samples) * length);
      return [pt.x / BRAIN_VIEWBOX.w, pt.y / BRAIN_VIEWBOX.h];
    });
  }
  return brainOutlineCache;
}
let handshakeOutlineCache = null;
function getHandshakeOutline() {
  if (!handshakeOutlineCache) {
    const pathEl = ensureHandshakePath();
    const length = pathEl.getTotalLength();
    const samples = 60;
    handshakeOutlineCache = Array.from({ length: samples }, (_, i) => {
      const pt = pathEl.getPointAtLength((i / samples) * length);
      return [pt.x / HANDSHAKE_VIEWBOX.w, pt.y / HANDSHAKE_VIEWBOX.h];
    });
  }
  return handshakeOutlineCache;
}

function generateBrain(count, width, height) {
  const cx = width * SHAPE_CENTER_X_RATIO;
  const cy = height * 0.5;
  const scale = Math.min(width, height) * 0.62;
  const boxW = scale;
  const boxH = scale * (BRAIN_VIEWBOX.h / BRAIN_VIEWBOX.w);
  const originX = cx - boxW / 2;
  const originY = cy - boxH / 2;
  const rand = seededRandom(7);

  // Шаг 1 — плотная заливка силуэта обоих полушарий (rejection sampling + isPointInFill).
  function fillSilhouette(n) {
    const pts = [];
    let guard = 0;
    while (pts.length < n && guard < n * 40) {
      guard++;
      const nx = rand();
      const ny = rand();
      if (isInsidePath(ensureBrainPath, nx * BRAIN_VIEWBOX.w, ny * BRAIN_VIEWBOX.h)) {
        pts.push({ x: originX + nx * boxW, y: originY + ny * boxH, emphasis: 0 });
      }
    }
    return pts;
  }

  // Шаг 1b — частицы прямо на контуре (getPointAtLength) для чёткого края силуэта.
  function outlinePoints(n) {
    const outline = getBrainOutline();
    const pts = [];
    for (let i = 0; i < n; i++) {
      const [nx, ny] = outline[i % outline.length];
      pts.push({ x: originX + nx * boxW, y: originY + ny * boxH, emphasis: 0 });
    }
    return pts;
  }

  // Шаг 2 — нейронные лучи: от границы формы наружу, с яркой конечной точкой.
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
  const outlineCount = Math.round(count * 0.16);
  const bodyCount = count - rayCount - outlineCount;

  const points = [...fillSilhouette(bodyCount), ...outlinePoints(outlineCount), ...rayPoints(rayCount)];
  while (points.length < count) points.push({ ...points[points.length % Math.max(1, points.length)] });
  return points.slice(0, count);
}

function generateHandshake(count, width, height) {
  const cx = width * SHAPE_CENTER_X_RATIO;
  const cy = height * 0.5;
  // Меньше масштаб, чем у силуэта-болванки раньше — на той же бюджетной численности
  // частиц это даёт заметно выше плотность на единицу площади, иначе мелкие детали
  // (пальцы, прорезь между ними) не читаются на фоне разреженного облака точек.
  const scale = Math.min(width, height) * 0.58;
  const boxW = scale;
  const boxH = scale * (HANDSHAKE_VIEWBOX.h / HANDSHAKE_VIEWBOX.w);
  const originX = cx - boxW / 2;
  const originY = cy - boxH / 2;
  const rand = seededRandom(13);

  // Шаг 1 — плотная заливка силуэта рук (rejection sampling + isPointInFill,
  // корректно учитывает "дырку" между сомкнутыми пальцами).
  function fillSilhouette(n) {
    const pts = [];
    let guard = 0;
    while (pts.length < n && guard < n * 40) {
      guard++;
      const nx = rand();
      const ny = rand();
      if (isInsidePath(ensureHandshakePath, nx * HANDSHAKE_VIEWBOX.w, ny * HANDSHAKE_VIEWBOX.h)) {
        pts.push({ x: originX + nx * boxW, y: originY + ny * boxH });
      }
    }
    return pts;
  }

  // Шаг 1b — частицы прямо на контуре, для чёткого края рук.
  function outlinePoints(n) {
    const outline = getHandshakeOutline();
    const pts = [];
    for (let i = 0; i < n; i++) {
      const [nx, ny] = outline[i % outline.length];
      pts.push({ x: originX + nx * boxW, y: originY + ny * boxH });
    }
    return pts;
  }

  const outlineCount = Math.round(count * 0.18);
  const points = [...fillSilhouette(count - outlineCount), ...outlinePoints(outlineCount)];
  while (points.length < count) points.push({ ...points[points.length % Math.max(1, points.length)] });

  // Зона соединения — центроид всей залитой формы (доминирует область сомкнутых
  // рук, манжеты по краям меньше и почти не сдвигают центр масс).
  const centroid = points
    .reduce((acc, p) => [acc[0] + p.x, acc[1] + p.y], [0, 0])
    .map((v) => v / points.length);
  const energyRadius = boxW * 0.07;
  points.forEach((p) => {
    const dist = Math.hypot(p.x - centroid[0], p.y - centroid[1]);
    p.emphasis = dist < energyRadius ? 1 : 0;
  });

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
