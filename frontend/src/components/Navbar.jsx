import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar({ sidebarOpen, onBurgerClick }) {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <button
          type="button"
          className="navbar__burger"
          onClick={onBurgerClick}
          aria-label={sidebarOpen ? "Закрыть меню" : "Открыть меню"}
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="navbar__right">
          <Link to="/" className="navbar__logo">
            AI Deal
          </Link>
          <button type="button" className="btn btn--ghost navbar__login">
            Войти
          </button>
          <button type="button" className="btn btn--primary">
            Регистрация
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
