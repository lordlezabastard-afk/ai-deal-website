import { useEffect, useRef, useState } from "react";
import "./Stats.css";

function useCountUp(target, duration = 2000, suffix = "") {
  const [value, setValue] = useState("0" + suffix);
  const ref = useRef(null);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          const start = performance.now();
          const step = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            const val = Math.round(ease * target);
            setValue((val >= 1000 ? val.toLocaleString("ru") : String(val)) + suffix);
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, suffix]);

  return [value, ref];
}

const STATS = [
  { target: 10000, suffix: "+", duration: 2000, label: "участников платформы" },
  { target: 50, suffix: "", duration: 1500, label: "курсов по AI" },
  { target: 3, suffix: "", duration: 1000, label: "уровня партнёрки" },
];

export default function Stats() {
  const counters = [
    useCountUp(STATS[0].target, STATS[0].duration, STATS[0].suffix),
    useCountUp(STATS[1].target, STATS[1].duration, STATS[1].suffix),
    useCountUp(STATS[2].target, STATS[2].duration, STATS[2].suffix),
  ];

  return (
    <section className="stats">
      {STATS.map(({ label }, i) => {
        const [val, ref] = counters[i];
        return (
          <div key={label} className="stat" ref={ref}>
            <span className="stat__number">{val}</span>
            <span className="stat__label">{label}</span>
          </div>
        );
      })}
    </section>
  );
}
