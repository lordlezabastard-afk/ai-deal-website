import AnimatedBackground, { ACCENT_COLORS } from "../components/AnimatedBackground";
import "./Placeholder.css";

function Placeholder({ title, accent = "purple" }) {
  return (
    <div className="placeholder">
      <AnimatedBackground colorRgb={ACCENT_COLORS[accent]} />
      <h1 className="placeholder__title">{title} — страница в разработке</h1>
    </div>
  );
}

export default Placeholder;
