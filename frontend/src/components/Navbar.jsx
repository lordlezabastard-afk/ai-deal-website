import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthModal } from "../context/AuthModalContext";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

function Navbar({ sidebarOpen, onBurgerClick }) {
  const { openRegisterModal, openLoginModal } = useAuthModal();
  const { isAuthenticated } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <div className="navbar__left">
          <Link to="/" className="navbar__logo">
            AI Deal
          </Link>
          <button
            type="button"
            className="navbar__burger"
            onClick={onBurgerClick}
            aria-label={sidebarOpen ? "Закрыть меню" : "Открыть меню"}
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {!isAuthenticated && (
          <div className="navbar__right">
            <button
              type="button"
              className="navbar__btn-login navbar__login"
              onClick={openLoginModal}
            >
              Войти
            </button>
            <button type="button" className="navbar__btn-register" onClick={openRegisterModal}>
              Регистрация
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
