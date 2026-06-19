import "./Stats.css";

const STATS = [
  { value: "10 000+", label: "Участников" },
  { value: "50+", label: "AI-курсов" },
  { value: "3 уровня", label: "Партнёрки" },
];

function Stats() {
  return (
    <section className="stats">
      {STATS.map((stat, i) => (
        <div key={stat.label} className={`stats__item ${i > 0 ? "stats__item--divided" : ""}`}>
          <span className="stats__value">{stat.value}</span>
          <span className="stats__label">{stat.label}</span>
        </div>
      ))}
    </section>
  );
}

export default Stats;
