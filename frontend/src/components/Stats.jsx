import { useEffect, useRef, useState } from "react";
import "./Stats.css";

const STATS = [
  { id: "users", target: 10000, suffix: "+", label: "Участников" },
  { id: "courses", target: 50, suffix: "+", label: "AI-курсов" },
  { id: "levels", staticValue: "3 уровня", label: "Партнёрки" },
];

function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

function Stats() {
  const sectionRef = useRef(null);
  const hasAnimatedRef = useRef(false);
  const [counts, setCounts] = useState({ users: 0, courses: 0 });
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimatedRef.current) return;
        hasAnimatedRef.current = true;
        observer.disconnect();

        const duration = 1800;
        const start = performance.now();

        function tick(now) {
          const t = Math.min((now - start) / duration, 1);
          const eased = easeOutQuad(t);
          setCounts({
            users: Math.round(eased * 10000),
            courses: Math.round(eased * 50),
          });
          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            setDone(true);
          }
        }

        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="stats" ref={sectionRef}>
      {STATS.map((stat, i) => (
        <div key={stat.id} className={`stats__item ${i > 0 ? "stats__item--divided" : ""}`}>
          <span className="stats__value">
            {stat.staticValue
              ? stat.staticValue
              : `${counts[stat.id].toLocaleString("ru-RU")}${done ? stat.suffix : ""}`}
          </span>
          <span className="stats__label">{stat.label}</span>
        </div>
      ))}
    </section>
  );
}

export default Stats;
