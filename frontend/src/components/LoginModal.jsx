import { useEffect, useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Modal.css";

function handleTelegramLogin() {
  console.log("Telegram login");
}

function handleForgot() {
  console.log("Forgot password");
}

function LoginModal({ isOpen, onClose, onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setLoading(false);
    setError("");
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      onClose();
    } catch (err) {
      setError(err.status === 401 ? "Неверный email или пароль" : "Что-то пошло не так, попробуйте позже");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Закрыть">
          <X size={18} />
        </button>

        <div className="modal-logo">AI</div>

        <div className="modal-badge">
          <span className="modal-badge-dot" />
          AI Deal
        </div>

        <h2 className="modal-title">Добро пожаловать</h2>
        <p className="modal-sub">Войдите в свой аккаунт</p>

        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label className="modal-label">Email</label>
            <input
              className="modal-inp"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="modal-field">
            <div className="modal-field-row">
              <label className="modal-label">Пароль</label>
              <button type="button" className="modal-forgot" onClick={handleForgot}>
                Забыли пароль?
              </button>
            </div>
            <div className="modal-pw-wrap">
              <input
                className="modal-inp"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="modal-pw-eye"
                onClick={() => setShowPassword((p) => !p)}
                aria-label="Показать пароль"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="modal-error">{error}</p>}

          <button type="submit" className="modal-btn-primary" disabled={loading}>
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>

        <div className="modal-divider">
          <span>или</span>
        </div>

        <button type="button" className="modal-btn-tg" onClick={handleTelegramLogin}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill="#29B6F6" />
            <path
              d="M5.5 11.8l2.9 1.1 1.1 3.6c.1.2.3.3.5.2l1.6-1.3 3.1 2.3c.3.2.7.1.8-.3l2.5-9.5c.1-.4-.3-.7-.6-.6L5.2 11c-.4.1-.4.7.3.8z"
              fill="white"
            />
          </svg>
          Войти через Telegram
        </button>

        <p className="modal-footer">
          Нет аккаунта?{" "}
          <button type="button" className="modal-link" onClick={onSwitchToRegister}>
            Зарегистрироваться
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginModal;
