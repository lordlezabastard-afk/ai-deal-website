import { useEffect, useRef, useState } from "react";
import slide2Background from "../assets/Fone2.webp";
import slide3Background from "../assets/Fone3.avif";
import "./Hero.css";

const SLIDE_DURATION = 4500;
const WHEEL_LOCK_MS = 700;

const SLIDES = [
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
    primaryBtn: { label: "Зарегистрироваться", bg: "#7c3aed" },
    secondaryBtn: { label: "Узнать больше" },
    background: null,
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
      { text: ", осваивая навыки для роста вашего бизнеса!" },
    ],
    subtitle:
      "Мощный набор средств для вашего бизнеса. Поможет внедрить нейросети и облачные сервисы. Автоматизирует задачи, улучшит процессы и увеличит производительность. Всё готово к использованию",
    accent: "#34d399",
    accentRgb: [52, 211, 153],
    primaryBtn: { label: "Смотреть курсы", bg: "#059669" },
    secondaryBtn: { label: "Как это работает" },
    background: slide2Background,
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
    background: slide3Background,
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroRef = useRef(null);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const targetColorRef = useRef(SLIDES[0].accentRgb);
  const currentColorRef = useRef([...SLIDES[0].accentRgb]);

  useEffect(() => {
    targetColorRef.current = SLIDES[currentSlide].accentRgb;
  }, [currentSlide]);

  const restartTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_DURATION);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    restartTimer();
  };

  useEffect(() => {
    restartTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  // Дополнительная навигация колесом мыши — только когда секция в зоне видимости и не на мобильных
  useEffect(() => {
    let locked = false;

    function handleWheel(e) {
      if (window.innerWidth <= 768) return;
      const el = heroRef.current;
      if (!el || locked) return;

      const rect = el.getBoundingClientRect();
      const viewportMid = window.innerHeight / 2;
      const inView = rect.top <= viewportMid && rect.bottom >= viewportMid;
      if (!inView) return;

      if (e.deltaY > 0) {
        setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
      } else if (e.deltaY < 0) {
        setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
      } else {
        return;
      }

      restartTimer();
      locked = true;
      setTimeout(() => {
        locked = false;
      }, WHEEL_LOCK_MS);
    }

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    let width = 0;
    let height = 0;
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
      const rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
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
        const y = (orb.baseY + Math.cos(now * orb.speed * 0.8 + orb.phase) * 0.06) * height;
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
        return { x: p.x * width, y: p.y * height };
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

  const slide = SLIDES[currentSlide];

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero__bg" style={{ opacity: currentSlide === 0 ? 1 : 0 }}>
        <canvas ref={canvasRef} className="hero__canvas" />
      </div>
      {SLIDES.map(
        (s, i) =>
          s.background && (
            <div
              key={s.id}
              className="hero__bg hero__bg--image"
              style={{
                backgroundImage: `url(${s.background})`,
                opacity: currentSlide === i ? 1 : 0,
              }}
            >
              <div className="hero__bg-overlay" />
            </div>
          )
      )}

      <div className="hero__progress">
        <div
          key={currentSlide}
          className="hero__progress-fill"
          style={{ background: slide.accent, animationDuration: `${SLIDE_DURATION}ms` }}
        />
      </div>

      <div className="hero__content">
        <div key={currentSlide} className="hero__slide">
          <div className="hero__icon" style={{ color: slide.accent }}>
            {ICONS[slide.icon]}
          </div>
          <span className="hero__badge" style={{ color: slide.accent, borderColor: slide.accent }}>
            {slide.badge}
          </span>
          <h1 className="hero__title">
            {slide.titleParts.map((part, i) =>
              part.highlight ? (
                <span key={i} style={{ color: slide.accent }}>
                  {part.text}
                </span>
              ) : (
                <span key={i}>{part.text}</span>
              )
            )}
          </h1>
          <p className="hero__subtitle">{slide.subtitle}</p>
          <div className="hero__buttons">
            <button className="btn hero__btn-primary" style={{ background: slide.primaryBtn.bg }}>
              {slide.primaryBtn.label}
            </button>
            <button className="btn btn--ghost">{slide.secondaryBtn.label}</button>
          </div>
          <div className="hero__cta">
            <button type="button" className="hero__cta-btn">
              РЕГИСТРАЦИЯ
            </button>
          </div>
        </div>
      </div>

      <div className="hero__dots">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`hero__dot ${i === currentSlide ? "hero__dot--active" : ""}`}
            style={i === currentSlide ? { background: s.accent } : undefined}
            onClick={() => goToSlide(i)}
            aria-label={`Слайд ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

export default Hero;
