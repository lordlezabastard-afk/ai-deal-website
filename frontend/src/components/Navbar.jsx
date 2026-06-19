import { useState } from "react";
import "./Navbar.css";

const NAV_LINKS = ["О платформе", "Курсы", "Партнёрка", "Контакты"];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <div className="navbar__logo">AI Deal</div>

        <nav className="navbar__links">
          {NAV_LINKS.map((link) => (
            <span key={link} className="navbar__link">
              {link}
            </span>
          ))}
        </nav>

        <div className="navbar__actions">
          <button type="button" className="btn btn--ghost navbar__login">
            Войти
          </button>
          <button type="button" className="btn btn--primary">
            Регистрация
          </button>
          <button
            type="button"
            className={`navbar__burger ${menuOpen ? "navbar__burger--open" : ""}`}
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Открыть меню"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="navbar__mobile-menu">
          {NAV_LINKS.map((link) => (
            <span key={link} className="navbar__link">
              {link}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}

export default Navbar;
