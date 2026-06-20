import { useEffect, useRef, useState } from "react";
import { useRegisterModal } from "../context/RegisterModalContext";
import "./Hero.css";

// TODO: когда появятся реальные файлы — заменить на:
// import fone1 from "../assets/fone1.avif";
// import fone2 from "../assets/fone2.avif";
// и передать их в SECTIONS[1].sideImage.image / SECTIONS[2].sideImage.image
const fone1 = null;
const fone2 = null;

const SECTIONS = [
  {
    id: 0,
    icon: "rocket",
    badge: "AI Deal — платформа будущего",
    titleParts: [
      { text: "Обучайся " },
      { text: "нейросетям", highlight: true },
      { text: " и зарабатывай с нами" },
    ],
    subtitle:
      "Платформа для обучения AI-технологиям, автоматизации бизнеса и построения партнёрской сети с пожизненным доходом",
    accent: "#a78bfa",
    accentRgb: [167, 139, 250],
    primaryBtn: null,
    secondaryBtn: { label: "Узнать больше" },
    sideImage: null,
  },
  {
    id: 1,
    icon: "book",
    badge: "AI School",
    titleParts: [
      { text: "Обучайтесь легко работе с " },
      { text: "нейросетями", highlight: true },
      { text: " и современным " },
      { text: "технологиям", highlight: true },
      { text: "!" },
    ],
    subtitle:
      "Мощный набор средств для вашего бизнеса. Поможет внедрить нейросети и облачные сервисы. Автоматизирует задачи, улучшит процессы и увеличит производительность. Всё готово к использованию",
    accent: "#34d399",
    accentRgb: [52, 211, 153],
    primaryBtn: { label: "Смотреть курсы", bg: "#059669" },
    secondaryBtn: { label: "Как это работает" },
    sideImage: { position: "left", image: fone1, glow: "rgba(52, 211, 153, 0.3)" },
  },
  {
    id: 2,
    icon: "people",
    badge: "Партнёрская программа",
    titleParts: [
      { text: "Строй команду — получай " },
      { text: "пожизненный доход", highlight: true },
    ],
    subtitle:
      "Приглашай партнёров и зарабатывай с трёх уровней структуры. Чем больше команда — тем выше доход.",
    accent: "#fbbf24",
    accentRgb: [251, 191, 36],
    primaryBtn: { label: "Начать зарабатывать", bg: "#b45309" },
    secondaryBtn: { label: "Условия партнёрки" },
    sideImage: { position: "right", image: fone2, glow: "rgba(251, 191, 36, 0.3)" },
  },
];

const ICONS = {
  rocket: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 2c2.5 2 4 5.5 4 9 0 2-.5 4-1.2 5.6L12 19l-2.8-2.4C8.5 15 8 13 8 11c0-3.5 1.5-7 4-9z" />
      <circle cx="12" cy="10" r="1.6" />
      <path d="M8.5 16.5 6 21l3-1.2M15.5 16.5 18 21l-3-1.2" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
      <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" />
    </svg>
  ),
  people: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="8" cy="8" r="2.6" />
      <circle cx="16.5" cy="9.5" r="2.1" />
      <path d="M3 19c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      <path d="M14 19c0-2-1.6-3.6-3.6-3.6" />
    </svg>
  ),
};

function lerpColor(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function Hero() {
  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const canvasRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const targetColorRef = useRef(SECTIONS[0].accentRgb);
  const currentColorRef = useRef([...SECTIONS[0].accentRgb]);
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    targetColorRef.current = SECTIONS[activeIndex].accentRgb;
  }, [activeIndex]);

  // Следим за скроллом внутри scroll-snap контейнера: какая секция активна
  // и насколько мы продвинулись внутри неё (используется для лёгкого смещения частиц в canvas).
  useEffect(() => {
    const container = containerRef.current;
    let ticking = false;

    function update() {
      const vh = container.clientHeight;
      const scrollTop = container.scrollTop;
      const raw = scrollTop / vh;
      const idx = Math.min(Math.max(Math.round(raw), 0), SECTIONS.length - 1);

      setActiveIndex(idx);
      scrollProgressRef.current = raw - Math.floor(raw);

      ticking = false;
    }

    function handleScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    update();
    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Единый закреплённый (position: fixed) canvas-фон для всех 3 секций.
  // Сам canvas не двигается со скроллом — двигаются только частицы/орбы внутри него,
  // а цвет акцента плавно перетекает между секциями (фиолетовый → зелёный → жёлтый).
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

      // лёгкое смещение по вертикали в зависимости от прогресса скролла внутри текущей секции
      const offsetY = (scrollProgressRef.current - 0.5) * 40;

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

  function goToSection(index) {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const { openRegisterModal } = useRegisterModal();

  return (
    <>
      <canvas ref={canvasRef} className="hero-fixed-canvas" />

      <div className="hero-scroll" ref={containerRef}>
        {SECTIONS.map((section, i) => {
          const content = (
            <div className={`hero__content ${section.sideImage ? "hero__content--side" : ""}`}>
              <div className="hero__icon" style={{ color: section.accent }}>
                {ICONS[section.icon]}
              </div>
              <span
                className="hero__badge"
                style={{ color: section.accent, borderColor: section.accent }}
              >
                {section.badge}
              </span>
              <h1 className="hero__title">
                {section.titleParts.map((part, idx) =>
                  part.highlight ? (
                    <span key={idx} style={{ color: section.accent }}>
                      {part.text}
                    </span>
                  ) : (
                    <span key={idx}>{part.text}</span>
                  )
                )}
              </h1>
              <p className="hero__subtitle">{section.subtitle}</p>
              <div className="hero__buttons">
                {section.primaryBtn && (
                  <button
                    className="btn hero__btn-primary"
                    style={{ background: section.primaryBtn.bg }}
                  >
                    {section.primaryBtn.label}
                  </button>
                )}
                <button className="btn btn--ghost">{section.secondaryBtn.label}</button>
              </div>
              <div className="hero__cta">
                <button type="button" className="hero__cta-btn" onClick={openRegisterModal}>
                  РЕГИСТРАЦИЯ
                </button>
              </div>
            </div>
          );

          return (
            <section
              key={section.id}
              ref={(el) => (sectionRefs.current[i] = el)}
              className="hero-section"
            >
              {section.sideImage ? (
                <div className={`hero__layout hero__layout--${section.sideImage.position}`}>
                  <div className="hero__side-image">
                    {section.sideImage.image ? (
                      <img src={section.sideImage.image} alt="" className="hero__side-image-img" />
                    ) : (
                      <div
                        className="hero__side-image-placeholder"
                        style={{ background: `linear-gradient(145deg, ${section.sideImage.glow}, rgba(10,10,18,0.85))` }}
                      >
                        {ICONS[section.icon]}
                      </div>
                    )}
                  </div>
                  {content}
                </div>
              ) : (
                content
              )}
            </section>
          );
        })}

        <div className="hero__dots">
          {SECTIONS.map((section, i) => (
            <button
              key={section.id}
              type="button"
              className={`hero__dot ${i === activeIndex ? "hero__dot--active" : ""}`}
              style={i === activeIndex ? { background: section.accent } : undefined}
              onClick={() => goToSection(i)}
              aria-label={`Секция ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default Hero;
