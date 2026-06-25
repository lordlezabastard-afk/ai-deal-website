import { useEffect, useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Modal.css";

function handleTelegramRegister() {
  console.log("Telegram register");
}

function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [matchOk, setMatchOk] = useState(false);
  const [strength, setStrength] = useState(0);
  const [strengthClass, setStrengthClass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setEmail("");
    setPassword("");
    setConfirm("");
    setShowPassword(false);
    setShowConfirm(false);
    setMatchOk(false);
    setStrength(0);
    setStrengthClass("");
    setLoading(false);
    setError("");
  }, [isOpen]);

  if (!isOpen) return null;

  function checkMatch(pw, conf) {
    setMatchOk(pw === conf && conf.length > 0);
    const score = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(
      Boolean
    ).length;
    setStrength(score);
    setStrengthClass(score <= 1 ? "modal-bar--weak" : score === 2 ? "modal-bar--mid" : "modal-bar--strong");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!matchOk) return;

    setError("");
    setLoading(true);

    try {
      await register(email, password, name);
      onClose();
    } catch (err) {
      setError(err.status === 409 ? "Этот email уже зарегистрирован" : "Что-то пошло не так, попробуйте позже");
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

        <h2 className="modal-title">Создать аккаунт</h2>
        <p className="modal-sub">Начните обучение бесплатно</p>

        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label className="modal-label">Имя</label>
            <input
              className="modal-inp"
              type="text"
              placeholder="Иван Иванов"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

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
            <label className="modal-label">Пароль</label>
            <div className="modal-pw-wrap">
              <input
                className="modal-inp"
                type={showPassword ? "text" : "password"}
                placeholder="Минимум 8 символов"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  checkMatch(e.target.value, confirm);
                }}
                autoComplete="new-password"
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
            <div className="modal-strength">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`modal-bar ${i < strength ? strengthClass : ""}`} />
              ))}
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-label">Подтверждение пароля</label>
            <div className="modal-pw-wrap">
              <input
                className={`modal-inp ${confirm ? (matchOk ? "modal-inp--ok" : "modal-inp--error") : ""}`}
                type={showConfirm ? "text" : "password"}
                placeholder="Повторите пароль"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  checkMatch(password, e.target.value);
                }}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="modal-pw-eye"
                onClick={() => setShowConfirm((p) => !p)}
                aria-label="Показать пароль"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirm && (
              <p className={`modal-match-hint ${matchOk ? "modal-match-hint--ok" : "modal-match-hint--error"}`}>
                {matchOk ? "✓ Пароли совпадают" : "Пароли не совпадают"}
              </p>
            )}
          </div>

          {error && <p className="modal-error">{error}</p>}

          <button type="submit" className="modal-btn-primary" disabled={loading || !matchOk}>
            {loading ? "Создаём..." : "Создать аккаунт"}
          </button>
        </form>

        <div className="modal-divider">
          <span>или</span>
        </div>

        <button type="button" className="modal-btn-tg" onClick={handleTelegramRegister}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill="#29B6F6" />
            <path
              d="M5.5 11.8l2.9 1.1 1.1 3.6c.1.2.3.3.5.2l1.6-1.3 3.1 2.3c.3.2.7.1.8-.3l2.5-9.5c.1-.4-.3-.7-.6-.6L5.2 11c-.4.1-.4.7.3.8z"
              fill="white"
            />
          </svg>
          Зарегистрироваться через Telegram
        </button>

        <p className="modal-footer">
          Уже есть аккаунт?{" "}
          <button type="button" className="modal-link" onClick={onSwitchToLogin}>
            Войти
          </button>
        </p>
      </div>
    </div>
  );
}

export default RegisterModal;
