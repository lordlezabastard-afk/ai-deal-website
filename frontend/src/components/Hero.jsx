import { useEffect, useRef, useState } from "react";
import { useAuthModal } from "../context/AuthModalContext";
import { useAuth } from "../context/AuthContext";
import foneStars from "../assets/fone-stars.avif";
import foneMountain from "../assets/fone-mountain.avif";
import foneParticles from "../assets/fone-particles.avif";
import "./Hero.css";

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
    bg: foneStars,
    primaryBtn: null,
    secondaryBtn: { label: "Узнать больше" },
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
    bg: foneMountain,
    primaryBtn: { label: "Смотреть курсы", bg: "#059669" },
    secondaryBtn: { label: "Как это работает" },
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
    bg: foneParticles,
    primaryBtn: { label: "Начать зарабатывать", bg: "#b45309" },
    secondaryBtn: { label: "Условия партнёрки" },
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

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInCubic(t) {
  return t * t * t;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Фазовый эффект "погружения" горы → частицы:
// фаза 1 (0–60% t1) — быстрое заметное приближение (zoom-in) с лёгким нарастанием затемнения;
// фаза 2 (60–75% t1) — резкий пик затемнения/блюра, момент "ныряния" (крутой ease-in);
// фаза 3 (75–100% t1) — плавный cross-fade к частицам, затемнение и блюр спадают к 0.
const DIVE_PHASE1_END = 0.6;
const DIVE_PHASE2_END = 0.75;
const SCALE_BASE = 1;
const SCALE_AFTER_PHASE1 = 1.8;
const SCALE_AFTER_PHASE2 = 2.0;
const DARKEN_BASE = 0.3;
const DARKEN_AFTER_PHASE1 = 0.5;
const DARKEN_PEAK = 0.85;
const BLUR_PEAK = 4;

function computeDiveEffect(t1) {
  if (t1 <= DIVE_PHASE1_END) {
    const p = t1 / DIVE_PHASE1_END;
    return {
      mountainScale: SCALE_BASE + (SCALE_AFTER_PHASE1 - SCALE_BASE) * easeOutCubic(p),
      mountainDarken: DARKEN_BASE + (DARKEN_AFTER_PHASE1 - DARKEN_BASE) * p,
      mountainBlur: 0,
      mountainOpacity: 1,
      particlesOpacity: 0,
    };
  }

  if (t1 <= DIVE_PHASE2_END) {
    const p = (t1 - DIVE_PHASE1_END) / (DIVE_PHASE2_END - DIVE_PHASE1_END);
    const pe = easeInCubic(p);
    return {
      mountainScale: SCALE_AFTER_PHASE1 + (SCALE_AFTER_PHASE2 - SCALE_AFTER_PHASE1) * pe,
      mountainDarken: DARKEN_AFTER_PHASE1 + (DARKEN_PEAK - DARKEN_AFTER_PHASE1) * pe,
      mountainBlur: BLUR_PEAK * pe,
      mountainOpacity: 1,
      particlesOpacity: 0,
    };
  }

  const p = (t1 - DIVE_PHASE2_END) / (1 - DIVE_PHASE2_END);
  const pe = easeInOutCubic(p);
  return {
    mountainScale: SCALE_AFTER_PHASE2,
    mountainDarken: DARKEN_PEAK * (1 - pe),
    mountainBlur: BLUR_PEAK * (1 - pe),
    mountainOpacity: 1 - pe,
    particlesOpacity: pe,
  };
}

function Hero() {
  const sectionRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInHero, setIsInHero] = useState(true);

  const mountainLayerRef = useRef(null);
  const overlayRef = useRef(null);
  const particlesLayerRef = useRef(null);

  // Следим за скроллом страницы (единый document-скролл, без вложенного scroll-контейнера):
  // какая Hero-секция активна (для индикатора-точек), и считаем прогресс эффекта "погружения"
  // между секцией 2 (горы) и секцией 3 (частицы) — это единственный спецэффект перехода.
  // Между секцией 1 и секцией 2 никакой анимации фона нет: это просто два обычных
  // последовательных scroll-snap экрана со своими картинками-фонами.
  useEffect(() => {
    let ticking = false;

    function getDocTop(el) {
      return el ? el.getBoundingClientRect().top + window.scrollY : 0;
    }

    function update() {
      const vh = window.innerHeight;
      const scrollTop = window.scrollY;
      const raw = scrollTop / vh;
      const idx = Math.min(Math.max(Math.round(raw), 0), SECTIONS.length - 1);

      setActiveIndex(idx);
      setIsInHero(scrollTop < SECTIONS.length * vh);

      const lastSectionTop = getDocTop(sectionRefs.current[SECTIONS.length - 1]) || Infinity;
      document.documentElement.classList.toggle("hero-snap-active", scrollTop < lastSectionTop - 2);

      // Прогресс погружения считаем от ТОЧНЫХ границ секции 2 и секции 3 (через
      // getBoundingClientRect), а не от scrollY/vh — иначе из-за высоты navbar (84px)
      // эффект (затемнение/zoom) активировался на ~84px раньше реальной границы секций
      // и "подсвечивал" затемнением хвост секции 1, создавая видимость анимации на стыке 1→2.
      const section1Top = getDocTop(sectionRefs.current[1]);
      const section2Top = getDocTop(sectionRefs.current[2]);
      const t1 = clamp01((scrollTop - section1Top) / (section2Top - section1Top || 1));

      // Слои погружения (mountain/overlay/particles) — это фиксированный поверх-документа
      // оверлей, который имеет смысл ТОЛЬКО начиная с секции 2 (горы). Пока пользователь
      // находится в секции 1 (звёзды), он полностью невидим — у секции 1 свой обычный фон.
      const isPastSection1 = scrollTop >= section1Top;
      const dive = computeDiveEffect(t1);

      const mountainOpacity = isPastSection1 ? dive.mountainOpacity : 0;
      const overlayOpacity = isPastSection1 ? dive.mountainDarken * dive.mountainOpacity : 0;
      const particlesOpacity = dive.particlesOpacity;
      const particlesScale = 1.08 - 0.08 * particlesOpacity;
      const particlesBrightness = 0.7 + 0.3 * particlesOpacity;

      if (mountainLayerRef.current) {
        mountainLayerRef.current.style.opacity = String(mountainOpacity);
        mountainLayerRef.current.style.transform = `scale(${dive.mountainScale})`;
        mountainLayerRef.current.style.filter = `blur(${dive.mountainBlur}px)`;
      }
      if (overlayRef.current) {
        overlayRef.current.style.opacity = String(overlayOpacity);
      }
      if (particlesLayerRef.current) {
        particlesLayerRef.current.style.opacity = String(particlesOpacity);
        particlesLayerRef.current.style.transform = `scale(${particlesScale})`;
        particlesLayerRef.current.style.filter = `brightness(${particlesBrightness})`;
      }

      ticking = false;
    }

    function handleScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", update);
      document.documentElement.classList.remove("hero-snap-active");
    };
  }, []);

  function goToSection(index) {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const { openRegisterModal } = useAuthModal();
  const { isAuthenticated } = useAuth();

  return (
    <>
      <div className="hero-bg">
        <div
          ref={mountainLayerRef}
          className="hero-bg__layer hero-bg__layer--mountain"
          style={{ backgroundImage: `url(${foneMountain})` }}
        />
        <div ref={overlayRef} className="hero-bg__overlay" />
        <div
          ref={particlesLayerRef}
          className="hero-bg__layer"
          style={{ backgroundImage: `url(${foneParticles})` }}
        />
        <div className="hero-bg__vignette" />
      </div>

      <div className="hero-scroll">
        {SECTIONS.map((section, i) => (
          <section
            key={section.id}
            ref={(el) => (sectionRefs.current[i] = el)}
            className="hero-section"
          >
            <div
              className={`hero-section__bg ${i === 0 ? "hero-section__bg--fade-bottom" : ""} ${
                i === 1 ? "hero-section__bg--fade-top" : ""
              }`}
              style={{ backgroundImage: `url(${section.bg})` }}
            />
            <div className="hero__content">
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
              {!isAuthenticated && (
                <div className="hero__cta">
                  <button
                    type="button"
                    className="hero__cta-btn beam-btn"
                    onClick={openRegisterModal}
                  >
                    РЕГИСТРАЦИЯ
                  </button>
                </div>
              )}
            </div>
          </section>
        ))}

        <div className={`hero__dots ${isInHero ? "" : "hero__dots--hidden"}`}>
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
