import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT_DESKTOP = 8000;
const PARTICLE_COUNT_MOBILE = 3000;
const MORPH_LERP = 0.8;
const REPEL_RADIUS = 0.8;
const REPEL_STRENGTH = 0.15;

// Детерминированный псевдослучайный генератор по индексу — чтобы цвет/фаза/скорость
// частицы были стабильны между ререндерами, а не дёргались на каждый кадр.
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

const SECTION_COLORS = [
  [
    { color: "#8052ff", weight: 0.7 },
    { color: "#ffffff", weight: 0.2 },
    { color: "#bdbdbd", weight: 0.1 },
  ],
  [
    { color: "#8052ff", weight: 0.6 },
    { color: "#ffffff", weight: 0.25 },
    { color: "#6040cc", weight: 0.15 },
  ],
  [
    { color: "#8052ff", weight: 0.65 },
    { color: "#15846e", weight: 0.2 },
    { color: "#ffffff", weight: 0.15 },
  ],
];

// Форма 0 — сфера (fibonacci sphere), смещена в правую половину секции.
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

// Форма 1 — анатомический 3D мозг: деформированный эллипсоид (извилины) с
// продольной щелью между полушариями + нейронные лучи, уходящие наружу по нормали.
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

// Форма 2 — рукопожатие: две руки (предплечье → ладонь → пальцы) идущие
// диагонально друг к другу, со светящейся зоной соединения в центре.
function generateHandshake(count) {
  const positions = [];
  const rand = seededRandom(13);
  const cx = 1.5;
  const half = Math.floor((count - 120) / 2);

  function generateHand(sign, n) {
    const pts = [];

    const forearmCount = Math.round(n * 0.25);
    for (let i = 0; i < forearmCount; i++) {
      const t = i / forearmCount;
      const x = sign * (2.5 - t * 1.8);
      const y = sign * (-1.2 + t * 0.9);
      const z = (rand() - 0.5) * 0.25;
      const angle = rand() * Math.PI * 2;
      const r = 0.12 + rand() * 0.08;
      pts.push(new THREE.Vector3(x + Math.cos(angle) * r, y + Math.sin(angle) * r * 0.7, z));
    }

    const palmCount = Math.round(n * 0.35);
    for (let i = 0; i < palmCount; i++) {
      const t = i / palmCount;
      const x = sign * (0.7 - t * 0.5);
      const y = sign * (-0.3 + t * 0.15);
      const angle = rand() * Math.PI * 2;
      const r = 0.18 + rand() * 0.12;
      pts.push(
        new THREE.Vector3(
          x + Math.cos(angle) * r * 0.9,
          y + Math.sin(angle) * r,
          (rand() - 0.5) * 0.3
        )
      );
    }

    const fingerOffsets = [-0.22, -0.07, 0.08, 0.22];
    const fingerLengths = [0.45, 0.52, 0.5, 0.4];
    fingerOffsets.forEach((offset, fi) => {
      const fCount = Math.floor(n * 0.1);
      for (let i = 0; i < fCount; i++) {
        const t = i / fCount;
        const angle = rand() * Math.PI * 2;
        const r = 0.055;
        pts.push(
          new THREE.Vector3(
            sign * (0.2 - t * fingerLengths[fi]),
            offset + (rand() - 0.5) * 0.04,
            (rand() - 0.5) * 0.15 + Math.cos(angle) * r
          )
        );
      }
    });

    return pts;
  }

  generateHand(1, half).forEach((p) => positions.push(p.add(new THREE.Vector3(cx, 0, 0))));
  generateHand(-1, count - 120 - half).forEach((p) =>
    positions.push(p.add(new THREE.Vector3(cx, 0, 0)))
  );

  for (let i = 0; i < 120; i++) {
    positions.push(
      new THREE.Vector3(
        cx + (rand() - 0.5) * 0.3,
        (rand() - 0.5) * 0.2,
        (rand() - 0.5) * 0.25
      )
    );
  }

  while (positions.length < count) {
    positions.push(positions[positions.length % Math.max(1, positions.length)].clone());
  }
  return positions.slice(0, count);
}

const SHAPE_GENERATORS = [generateSphere, generateBrain, generateHandshake];

function ParticleMorphSystem({ activeSection, count }) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0, active: false });
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const intersectPoint = useMemo(() => new THREE.Vector3(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const layouts = useMemo(() => SHAPE_GENERATORS.map((gen) => gen(count)), [count]);

  const particles = useMemo(() => {
    const rand = seededRandom(42);
    return Array.from({ length: count }, () => ({
      current: layouts[0][0] ? layouts[0][Math.floor(rand() * layouts[0].length)].clone() : new THREE.Vector3(),
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
  }, [count, layouts]);

  // Реальное начальное положение — точки сферы (форма 0), а не случайные точки из layouts[0].
  useEffect(() => {
    const rand = seededRandom(42);
    particles.forEach((p, i) => {
      const start = layouts[0][i] || new THREE.Vector3();
      p.current.copy(start);
      p.target.copy(start);
      const c = pickWeighted(rand(), SECTION_COLORS[0]).color;
      p.from.set(c);
      p.to.set(c);
      p.color.set(c);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const targetLayout = layouts[activeSection];
    const palette = SECTION_COLORS[activeSection];
    const rand = seededRandom(100 + activeSection);
    particles.forEach((p, i) => {
      p.from.copy(p.color);
      p.target.copy(targetLayout[i]);
      const c = pickWeighted(rand(), palette).color;
      p.to.set(c);
    });
  }, [activeSection, layouts, particles]);

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
    const mesh = meshRef.current;
    if (!mesh) return;

    if (pointer.current.active) {
      raycaster.setFromCamera({ x: pointer.current.x, y: pointer.current.y }, state.camera);
      raycaster.ray.intersectPlane(plane, intersectPoint);
    }

    const t = state.clock.elapsedTime;
    const lerpT = Math.min(1, delta * MORPH_LERP * 6);
    const colorLerpT = Math.min(1, delta * 2);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.current.lerp(p.target, lerpT);
      p.color.lerp(p.to, colorLerpT);

      let repelX = 0;
      let repelY = 0;
      let repelZ = 0;
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

      dummy.position.set(
        p.current.x + p.repel.x + Math.sin(t * p.speed + p.phase) * 0.015,
        p.current.y + p.repel.y + Math.cos(t * p.speed * 0.7 + p.phase) * 0.015,
        p.current.z + p.repel.z
      );

      dummy.rotation.set(
        p.rotation.x + t * p.speed * 0.3,
        p.rotation.y + t * p.speed * 0.5,
        p.rotation.z
      );

      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, p.color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    if (groupRef.current && activeSection === 1) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <tetrahedronGeometry args={[0.025, 0]} />
        <meshStandardMaterial
          color="#8052ff"
          emissive="#8052ff"
          emissiveIntensity={0.4}
          transparent
          opacity={0.85}
        />
      </instancedMesh>
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
      <ambientLight intensity={0.15} />
      <pointLight position={[2, 3, 4]} intensity={1.2} color="#8052ff" />
      <pointLight position={[-3, -2, 2]} intensity={0.6} color="#ffffff" />
      <ParticleMorphSystem activeSection={activeSection} count={count} />
    </Canvas>
  );
}
