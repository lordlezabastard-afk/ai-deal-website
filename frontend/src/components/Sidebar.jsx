import { Home, BookOpen, Users, Wrench, Wallet, User, Shield, Map, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const MENU_TOP = [
  { label: "Главная", icon: Home, to: "/" },
  { label: "AI School", icon: BookOpen, to: "/school" },
  { label: "Партнёрская программа", icon: Users, to: "/partners" },
];

const MENU_BOTTOM = [
  { label: "Финансы", icon: Wallet, to: "/finance" },
  { label: "Профиль", icon: User, to: "/profile" },
  { label: "Безопасность", icon: Shield, to: "/security" },
  { label: "Дорожная карта", icon: Map, to: "/roadmap" },
];

function Sidebar({ open, onClose }) {
  const navigate = useNavigate();

  function handleLogout() {
    onClose();
    navigate("/");
  }

  return (
    <>
      <div
        className={`sidebar__overlay ${open ? "sidebar__overlay--visible" : ""}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
        <nav className="sidebar__nav">
          {MENU_TOP.map(({ label, icon: Icon, to }) => (
            <Link key={to} to={to} className="sidebar__item" onClick={onClose}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}

          <span className="sidebar__item sidebar__item--disabled">
            <Wrench size={18} />
            <span>Наши сервисы</span>
          </span>

          <div className="sidebar__divider" />

          {MENU_BOTTOM.map(({ label, icon: Icon, to }) => (
            <Link key={to} to={to} className="sidebar__item" onClick={onClose}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}

          <div className="sidebar__divider" />

          <button type="button" className="sidebar__item sidebar__item--logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Выйти</span>
          </button>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
