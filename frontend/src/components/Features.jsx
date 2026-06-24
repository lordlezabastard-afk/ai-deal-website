import { motion } from "framer-motion";
import "./Features.css";

const FEATURES = [
  {
    id: "school",
    title: "AI School",
    text: "Курсы по нейросетям для новичков и профи с практикой и сертификатами",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
        <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" />
      </svg>
    ),
  },
  {
    id: "tools",
    title: "AI-инструменты",
    text: "Облачные сервисы для автоматизации задач и создания контента",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M14.5 3.5 17 6l-7.5 7.5L7 11z" />
        <path d="M5 19l2.2-.6.6-2.2L17 6.9" />
        <path d="M16 4.5 19.5 8" />
      </svg>
    ),
  },
  {
    id: "network",
    title: "Партнёрская сеть",
    text: "Многоуровневый доход с каждого партнёра в твоей структуре",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="8" cy="8" r="2.6" />
        <circle cx="16.5" cy="9.5" r="2.1" />
        <path d="M3 19c0-2.8 2.2-5 5-5s5 2.2 5 5" />
        <path d="M14 19c0-2-1.6-3.6-3.6-3.6" />
      </svg>
    ),
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 32, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] },
  },
};

function trackMouse(e) {
  const card = e.currentTarget;
  const r = card.getBoundingClientRect();
  card.style.setProperty("--mouse-x", `${((e.clientX - r.left) / r.width) * 100}%`);
  card.style.setProperty("--mouse-y", `${((e.clientY - r.top) / r.height) * 100}%`);
}

function Features() {
  return (
    <motion.section
      className="features"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {FEATURES.map((feature) => (
        <motion.div
          key={feature.id}
          className="features__card feature-card"
          variants={itemVariants}
          onMouseMove={trackMouse}
        >
          <div className="features__icon">{feature.icon}</div>
          <h3 className="features__title">{feature.title}</h3>
          <p className="features__text">{feature.text}</p>
        </motion.div>
      ))}
    </motion.section>
  );
}

export default Features;
