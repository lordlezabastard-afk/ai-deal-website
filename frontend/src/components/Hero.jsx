import { useEffect, useRef, useState } from "react";
import { useAuthModal } from "../context/AuthModalContext";
import { useAuth } from "../context/AuthContext";
import HeroParticles from "./HeroParticles";
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
    accent: "#8052ff",
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
    accent: "#8052ff",
    primaryBtn: { label: "Смотреть курсы" },
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
    accent: "#8052ff",
    primaryBtn: { label: "Начать зарабатывать" },
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

function Hero() {
  const sectionRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInHero, setIsInHero] = useState(true);

  // Следим за скроллом страницы (единый document-скролл, без вложенного scroll-контейнера),
  // чтобы знать какая Hero-секция активна — для индикатора-точек и для того, какую форму
  // должны принять частицы фонового canvas (сфера/мозг/рукопожатие).
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
      <HeroParticles activeIndex={activeIndex} />

      <div className="hero-scroll">
        {SECTIONS.map((section, i) => (
          <section
            key={section.id}
            ref={(el) => (sectionRefs.current[i] = el)}
            className="hero-section"
          >
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
                  <button className="btn btn--primary">{section.primaryBtn.label}</button>
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
