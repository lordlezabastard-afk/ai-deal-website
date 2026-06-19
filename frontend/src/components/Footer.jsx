import { Send, CircleHelp, FileText } from "lucide-react";
import "./Footer.css";

const FOOTER_LINKS = [
  { label: "Telegram", icon: Send },
  { label: "Поддержка", icon: CircleHelp },
  { label: "Правила", icon: FileText },
];

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__brand">
        <div className="footer__logo">AI Deal</div>
        <div className="footer__slogan">
          Платформа обучения нейросетям и партнёрского дохода
        </div>
      </div>
      <nav className="footer__links">
        {FOOTER_LINKS.map(({ label, icon: Icon }) => (
          <span key={label} className="footer__link">
            <Icon size={16} className="footer__link-icon" />
            {label}
          </span>
        ))}
      </nav>
      <div className="footer__copy">2026 © MPgroup</div>
    </footer>
  );
}

export default Footer;
