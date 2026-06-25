import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT_DESKTOP = 8000;
const PARTICLE_COUNT_MOBILE = 3000;
const MORPH_LERP = 0.8;
const REPEL_RADIUS = 2.5;      // было 0.8 — теперь охватывает большую зону
const REPEL_STRENGTH = 0.35;   // было 0.15 — сильнее толкает

// Параллакс камеры — насколько курсор смещает камеру
const CAMERA_PARALLAX_X = 0.6;
const CAMERA_PARALLAX_Y = 0.35;

// Points рендерят квадратные спрайты — форму (круг/треугольник) задаём
// alpha-текстурой на canvas, а не геометрией (геометрию пришлось бы менять
// через instancedMesh, который ломает instanceColor — см. комментарий ниже).
function createCircleTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

function createTriangleTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.moveTo(size / 2, 2);
  ctx.lineTo(size - 2, size - 2);
  ctx.lineTo(2, size - 2);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

function seededRandom(seed) {
  let s = seed;
  return function next() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function pickWeighted(rand, items) {
  let r = rand * items.reduce((sum, item) => sum + item.weight, 0);
  for (const item of items) {
    if (r < item.weight) return item;
    r -= item.weight;
  }
  return items[items.length - 1];
}

// Расширенные палитры — больше цветов, больше контраста
// Все 4 цвета присутствуют с заметным весом — фиолетовый, оранжевый, зелёный, белый
const SECTION_COLORS = [
  [
    { color: "#8052ff", weight: 0.28 },  // фиолетовый
    { color: "#ffb829", weight: 0.25 },  // оранжевый
    { color: "#ffffff", weight: 0.25 },  // белый
    { color: "#15846e", weight: 0.22 },  // зелёный
  ],
  [
    { color: "#8052ff", weight: 0.25 },
    { color: "#ffffff", weight: 0.28 },
    { color: "#ffb829", weight: 0.22 },
    { color: "#15846e", weight: 0.25 },
  ],
  [
    { color: "#15846e", weight: 0.28 },
    { color: "#8052ff", weight: 0.25 },
    { color: "#ffb829", weight: 0.25 },
    { color: "#ffffff", weight: 0.22 },
  ],
];

// Фоновые частицы — рассеяны по всему viewport
function generateBackground(count) {
  const rand = seededRandom(99);
  const positions = [];
  for (let i = 0; i < count; i++) {
    positions.push(
      new THREE.Vector3(
        (rand() - 0.5) * 14,
        (rand() - 0.5) * 9,
        -2 - rand() * 3
      )
    );
  }
  return positions;
}

function generateSphere(count) {
  const positions = [];
  const cx = 1.5;
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = phi * i;
    positions.push(
      new THREE.Vector3(
        cx + Math.cos(theta) * radius * 1.8,
        y * 1.8,
        Math.sin(theta) * radius * 1.8
      )
    );
  }
  return positions;
}

function generateBrain(count) {
  const positions = [];
  const rand = seededRandom(7);
  const cx = 1.8;
  const cy = 0.1;
  const bodyCount = Math.round(count * 0.75);
  const rayCount = count - bodyCount;

  let guard = 0;
  while (positions.length < bodyCount && guard < bodyCount * 6) {
    guard++;
    const u = rand() * Math.PI * 2;
    const v = Math.acos(2 * rand() - 1);
    let x = 1.4 * Math.sin(v) * Math.cos(u);
    let y = 1.0 * Math.cos(v);
    let z = 0.9 * Math.sin(v) * Math.sin(u);
    const gyrusFreq = 4;
    const gyrusAmp = 0.12;
    x += gyrusAmp * Math.sin(u * gyrusFreq) * Math.cos(v * 2);
    y += gyrusAmp * Math.cos(u * gyrusFreq * 0.7) * Math.sin(v * 3);
    z += gyrusAmp * Math.sin(u * gyrusFreq * 1.3 + 1) * Math.cos(v * 2.5);
    if (y < -0.75) continue;
    if (Math.abs(z) < 0.08 && y > -0.2) continue;
    positions.push(new THREE.Vector3(cx + x, cy + y, z));
  }

  guard = 0;
  while (positions.length < bodyCount + rayCount && guard < rayCount * 6) {
    guard++;
    const u = rand() * Math.PI * 2;
    const v = Math.acos(2 * rand() - 1);
    const surfaceR = 1.0 + rand() * 0.15;
    const nx = surfaceR * 1.4 * Math.sin(v) * Math.cos(u);
    const ny = surfaceR * 1.0 * Math.cos(v);
    const nz = surfaceR * 0.9 * Math.sin(v) * Math.sin(u);
    if (ny < -0.75) continue;
    const rayLength = 0.3 + rand() * 0.8;
    const rayX = nx + Math.sin(v) * Math.cos(u) * rayLength;
    const rayY = ny + Math.cos(v) * rayLength;
    const rayZ = nz + Math.sin(v) * Math.sin(u) * rayLength;
    positions.push(new THREE.Vector3(cx + rayX, cy + rayY, rayZ));
  }

  while (positions.length < count) {
    positions.push(positions[positions.length % Math.max(1, positions.length)].clone());
  }
  return positions.slice(0, count);
}

function generateHandshake(count) {
  const positions = [];
  const rand = seededRandom(13);

  const cx = 1.5;
  const cy = 0.0;

  const leftCount = Math.floor(count * 0.45);
  const rightCount = Math.floor(count * 0.45);
  const gripCount = count - leftCount - rightCount;

  // ─── ЛЕВАЯ РУКА (снизу-слева → вверх-вправо) ───
  const leftForearm = Math.floor(leftCount * 0.3);
  for (let i = 0; i < leftForearm; i++) {
    const t = i / leftForearm;
    const bx = -2.2 + t * 1.8;
    const by = -1.4 + t * 1.3;
    const angle = rand() * Math.PI * 2;
    const r = 0.10 + rand() * 0.07;
    positions.push(new THREE.Vector3(
      cx + bx + Math.cos(angle) * r,
      cy + by + Math.sin(angle) * r * 0.6,
      (rand() - 0.5) * 0.2
    ));
  }

  const leftPalm = Math.floor(leftCount * 0.35);
  for (let i = 0; i < leftPalm; i++) {
    const t = i / leftPalm;
    const bx = -0.4 + t * 0.35;
    const by = -0.1 + t * 0.1;
    const angle = rand() * Math.PI * 2;
    const r = 0.16 + rand() * 0.10;
    positions.push(new THREE.Vector3(
      cx + bx + Math.cos(angle) * r * 0.85,
      cy + by + Math.sin(angle) * r,
      (rand() - 0.5) * 0.25
    ));
  }

  const leftFingers = leftCount - leftForearm - leftPalm;
  const leftFingerOffsets = [
    { dx: 0.0, dy: 0.35, angle: -0.3 },
    { dx: 0.08, dy: 0.18, angle: -0.2 },
    { dx: 0.12, dy: 0.0, angle: -0.1 },
    { dx: 0.08, dy: -0.18, angle: 0.1 },
  ];
  const perFinger = Math.floor(leftFingers / 4);
  leftFingerOffsets.forEach(({ dx, dy, angle: fa }) => {
    for (let i = 0; i < perFinger; i++) {
      const t = i / perFinger;
      const length = 0.38 + rand() * 0.05;
      positions.push(new THREE.Vector3(
        cx - 0.05 + dx + Math.cos(fa) * t * length + (rand() - 0.5) * 0.04,
        cy + dy + Math.sin(fa) * t * length + (rand() - 0.5) * 0.04,
        (rand() - 0.5) * 0.12
      ));
    }
  });

  // ─── ПРАВАЯ РУКА (сверху-справа → вниз-влево) ───
  const rightForearm = Math.floor(rightCount * 0.3);
  for (let i = 0; i < rightForearm; i++) {
    const t = i / rightForearm;
    const bx = 2.2 - t * 1.8;
    const by = 1.4 - t * 1.3;
    const angle = rand() * Math.PI * 2;
    const r = 0.10 + rand() * 0.07;
    positions.push(new THREE.Vector3(
      cx + bx + Math.cos(angle) * r,
      cy + by + Math.sin(angle) * r * 0.6,
      (rand() - 0.5) * 0.2
    ));
  }

  const rightPalm = Math.floor(rightCount * 0.35);
  for (let i = 0; i < rightPalm; i++) {
    const t = i / rightPalm;
    const bx = 0.4 - t * 0.35;
    const by = 0.1 - t * 0.1;
    const angle = rand() * Math.PI * 2;
    const r = 0.16 + rand() * 0.10;
    positions.push(new THREE.Vector3(
      cx + bx + Math.cos(angle) * r * 0.85,
      cy + by + Math.sin(angle) * r,
      (rand() - 0.5) * 0.25
    ));
  }

  const rightFingers = rightCount - rightForearm - rightPalm;
  const rightFingerOffsets = [
    { dx: 0.0, dy: -0.35, angle: 0.3 },
    { dx: -0.08, dy: -0.18, angle: 0.2 },
    { dx: -0.12, dy: 0.0, angle: 0.1 },
    { dx: -0.08, dy: 0.18, angle: -0.1 },
  ];
  const perFingerR = Math.floor(rightFingers / 4);
  rightFingerOffsets.forEach(({ dx, dy, angle: fa }) => {
    for (let i = 0; i < perFingerR; i++) {
      const t = i / perFingerR;
      const length = 0.38 + rand() * 0.05;
      positions.push(new THREE.Vector3(
        cx + 0.05 + dx + Math.cos(fa + Math.PI) * t * length + (rand() - 0.5) * 0.04,
        cy + dy + Math.sin(fa + Math.PI) * t * length + (rand() - 0.5) * 0.04,
        (rand() - 0.5) * 0.12
      ));
    }
  });

  // ─── ЗОНА СЦЕПЛЕНИЯ (центр) ───
  for (let i = 0; i < gripCount; i++) {
    const angle = rand() * Math.PI * 2;
    const r = rand() * 0.22;
    positions.push(new THREE.Vector3(
      cx + Math.cos(angle) * r * 1.2,
      cy + Math.sin(angle) * r,
      (rand() - 0.5) * 0.18
    ));
  }

  while (positions.length < count) {
    positions.push(positions[positions.length % Math.max(1, positions.length - 1)].clone());
  }
  return positions.slice(0, count);
}

const SHAPE_GENERATORS = [generateSphere, generateBrain, generateHandshake];

// Процент частиц отведённых под фон (рассеяны по всему экрану)
const BG_RATIO = 0.25;

function ParticleMorphSystem({ activeSection, count }) {
  const bgPositionAttrRef = useRef(null);
  const bgColorAttrRef = useRef(null);
  const fgPositionAttrRef = useRef(null);
  const fgColorAttrRef = useRef(null);
  const groupRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0, active: false });
  const cameraTarget = useRef({ x: 0, y: 0 });
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const intersectPoint = useMemo(() => new THREE.Vector3(), []);
  const bgSpriteTexture = useMemo(() => createTriangleTexture(), []);
  const fgSpriteTexture = useMemo(() => createCircleTexture(), []);

  const bgCount = Math.floor(count * BG_RATIO);
  const fgCount = count - bgCount;

  // Points (а не instancedMesh) — у используемой версии Three.js/R3F instanceColor
  // на InstancedMesh рендерится чёрным независимо от заданных цветов (подтверждено
  // изолированным репро); обычный per-vertex color-атрибут BufferGeometry работает корректно.
  // Два отдельных Points-слоя (фон/модели) вместо одного буфера — чтобы у них были
  // разные size/opacity в pointsMaterial.
  const bgPositions = useMemo(() => new Float32Array(bgCount * 3), [bgCount]);
  const bgColors = useMemo(() => new Float32Array(bgCount * 3), [bgCount]);
  const fgPositions = useMemo(() => new Float32Array(fgCount * 3), [fgCount]);
  const fgColors = useMemo(() => new Float32Array(fgCount * 3), [fgCount]);

  const layouts = useMemo(() => SHAPE_GENERATORS.map((gen) => gen(fgCount)), [fgCount]);
  const bgLayout = useMemo(() => generateBackground(bgCount), [bgCount]);

  const particles = useMemo(() => {
    const rand = seededRandom(42);
    // Фоновые частицы
    const bg = Array.from({ length: bgCount }, (_, i) => ({
      isBg: true,
      current: bgLayout[i].clone(),
      target: bgLayout[i].clone(),
      from: new THREE.Color(),
      to: new THREE.Color(),
      color: new THREE.Color(),
      rotation: new THREE.Euler(rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2),
      speed: 0.1 + rand() * 0.3,
      phase: rand() * Math.PI * 2,
      scale: 0.3 + rand() * 0.5,
      repel: new THREE.Vector3(),
    }));
    // Основные (морфинг) частицы
    const fg = Array.from({ length: fgCount }, (_, i) => ({
      isBg: false,
      current: layouts[0][i] ? layouts[0][i].clone() : new THREE.Vector3(),
      target: new THREE.Vector3(),
      from: new THREE.Color(),
      to: new THREE.Color(),
      color: new THREE.Color(),
      rotation: new THREE.Euler(rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2),
      speed: 0.3 + rand() * 0.7,
      phase: rand() * Math.PI * 2,
      scale: 0.6 + rand() * 0.8,
      repel: new THREE.Vector3(),
    }));
    return [...bg, ...fg];
  }, [bgCount, fgCount, layouts, bgLayout]);

  useEffect(() => {
    const rand = seededRandom(42);
    // Инициализация цветов фоновых частиц
    particles.slice(0, bgCount).forEach((p) => {
      const allColors = SECTION_COLORS[0];
      const c = pickWeighted(rand(), allColors).color;
      p.from.set(c); p.to.set(c); p.color.set(c);
    });
    // Инициализация цветов основных частиц
    particles.slice(bgCount).forEach((p, i) => {
      const start = layouts[0][i] || new THREE.Vector3();
      p.current.copy(start);
      p.target.copy(start);
      const c = pickWeighted(rand(), SECTION_COLORS[0]).color;
      p.from.set(c); p.to.set(c); p.color.set(c);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const targetLayout = layouts[activeSection];
    const palette = SECTION_COLORS[activeSection];
    const rand = seededRandom(100 + activeSection);
    // Смена цветов фоновых частиц при смене секции
    particles.slice(0, bgCount).forEach((p) => {
      p.from.copy(p.color);
      const c = pickWeighted(rand(), palette).color;
      p.to.set(c);
    });
    // Морфинг основных частиц
    particles.slice(bgCount).forEach((p, i) => {
      p.from.copy(p.color);
      p.target.copy(targetLayout[i]);
      const c = pickWeighted(rand(), palette).color;
      p.to.set(c);
    });
  }, [activeSection, layouts, particles, bgCount]);

  useEffect(() => {
    function onMouseMove(e) {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      pointer.current.active = true;
    }
    function onMouseLeave() {
      pointer.current.active = false;
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  useFrame((state, delta) => {
    const bgPositionAttr = bgPositionAttrRef.current;
    const bgColorAttr = bgColorAttrRef.current;
    const fgPositionAttr = fgPositionAttrRef.current;
    const fgColorAttr = fgColorAttrRef.current;
    if (!bgPositionAttr || !bgColorAttr || !fgPositionAttr || !fgColorAttr) return;

    // Плавный параллакс камеры — следит за курсором с инерцией
    const targetCamX = pointer.current.active ? pointer.current.x * CAMERA_PARALLAX_X : 0;
    const targetCamY = pointer.current.active ? pointer.current.y * CAMERA_PARALLAX_Y : 0;
    cameraTarget.current.x += (targetCamX - cameraTarget.current.x) * 0.04;
    cameraTarget.current.y += (targetCamY - cameraTarget.current.y) * 0.04;
    state.camera.position.x = cameraTarget.current.x;
    state.camera.position.y = cameraTarget.current.y;
    state.camera.lookAt(cameraTarget.current.x * 0.3, cameraTarget.current.y * 0.3, 0);

    if (pointer.current.active) {
      raycaster.setFromCamera({ x: pointer.current.x, y: pointer.current.y }, state.camera);
      raycaster.ray.intersectPlane(plane, intersectPoint);
    }

    const t = state.clock.elapsedTime;
    const lerpT = Math.min(1, delta * MORPH_LERP * 6);
    const colorLerpT = Math.min(1, delta * 2);

    // Фоновые частицы (0..bgCount-1)
    for (let i = 0; i < bgCount; i++) {
      const p = particles[i];
      p.color.lerp(p.to, colorLerpT);

      bgPositions[i * 3] = p.current.x + Math.sin(t * p.speed + p.phase) * 0.03;
      bgPositions[i * 3 + 1] = p.current.y + Math.cos(t * p.speed * 0.7 + p.phase) * 0.03;
      bgPositions[i * 3 + 2] = p.current.z;

      bgColors[i * 3] = p.color.r;
      bgColors[i * 3 + 1] = p.color.g;
      bgColors[i * 3 + 2] = p.color.b;
    }
    bgPositionAttr.needsUpdate = true;
    bgColorAttr.needsUpdate = true;

    // Основные (морфинг) частицы (bgCount..end), локальный индекс j
    for (let i = bgCount; i < particles.length; i++) {
      const j = i - bgCount;
      const p = particles[i];
      p.current.lerp(p.target, lerpT);
      p.color.lerp(p.to, colorLerpT);

      let repelX = 0, repelY = 0, repelZ = 0;
      if (pointer.current.active) {
        const dx = p.current.x - intersectPoint.x;
        const dy = p.current.y - intersectPoint.y;
        const dz = p.current.z - intersectPoint.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < REPEL_RADIUS && dist > 0.001) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          repelX = (dx / dist) * force;
          repelY = (dy / dist) * force;
          repelZ = (dz / dist) * force;
        }
      }
      p.repel.x += (repelX - p.repel.x) * 0.15;
      p.repel.y += (repelY - p.repel.y) * 0.15;
      p.repel.z += (repelZ - p.repel.z) * 0.15;

      fgPositions[j * 3] = p.current.x + p.repel.x + Math.sin(t * p.speed + p.phase) * 0.015;
      fgPositions[j * 3 + 1] = p.current.y + p.repel.y + Math.cos(t * p.speed * 0.7 + p.phase) * 0.015;
      fgPositions[j * 3 + 2] = p.current.z + p.repel.z;

      fgColors[j * 3] = p.color.r;
      fgColors[j * 3 + 1] = p.color.g;
      fgColors[j * 3 + 2] = p.color.b;
    }
    fgPositionAttr.needsUpdate = true;
    fgColorAttr.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            ref={bgPositionAttrRef}
            attach="attributes-position"
            count={bgCount}
            array={bgPositions}
            itemSize={3}
          />
          <bufferAttribute
            ref={bgColorAttrRef}
            attach="attributes-color"
            count={bgCount}
            array={bgColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          transparent
          opacity={0.25}
          size={0.05}
          sizeAttenuation
          depthWrite={false}
          map={bgSpriteTexture}
          alphaTest={0.4}
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute
            ref={fgPositionAttrRef}
            attach="attributes-position"
            count={fgCount}
            array={fgPositions}
            itemSize={3}
          />
          <bufferAttribute
            ref={fgColorAttrRef}
            attach="attributes-color"
            count={fgCount}
            array={fgColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          transparent
          opacity={0.9}
          size={0.13}
          sizeAttenuation
          map={fgSpriteTexture}
          alphaTest={0.4}
        />
      </points>
    </group>
  );
}

function getParticleCount() {
  return window.innerWidth <= 768 ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;
}

export default function ParticleScene({ activeSection }) {
  const count = useMemo(() => getParticleCount(), []);

  return (
    <Canvas
      style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}
      camera={{ position: [0, 0, 5], fov: 60 }}
      gl={{ antialias: true, alpha: true }}
      dpr={Math.min(window.devicePixelRatio, 2)}
    >
      <ambientLight intensity={1} />
      <ParticleMorphSystem activeSection={activeSection} count={count} />
    </Canvas>
  );
}
