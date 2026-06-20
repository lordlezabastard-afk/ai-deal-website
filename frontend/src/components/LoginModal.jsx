import { useEffect, useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./LoginModal.css";

const EMPTY_FORM = { email: "", password: "" };

function LoginModal({ isOpen, onClose, onSwitchToRegister }) {
  const { login } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY_FORM);
    setErrors({});
    setShowPassword(false);
    setStatus("idle");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setStatus("loading");

    try {
      await login(form.email, form.password);
      onClose();
    } catch (error) {
      if (error.status === 401) {
        setErrors({ general: "Неверный email или пароль" });
      } else {
        setErrors({ general: "Что-то пошло не так, попробуйте позже" });
      }
      setStatus("idle");
    }
  };

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="login-modal__close" onClick={onClose} aria-label="Закрыть">
          <X size={20} />
        </button>

        <h2 className="login-modal__title">Вход</h2>

        <form className="login-modal__form" onSubmit={handleSubmit}>
          <div className="login-modal__field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              autoComplete="email"
            />
          </div>

          <div className="login-modal__field">
            <label htmlFor="login-password">Пароль</label>
            <div className="login-modal__password-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange("password")}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-modal__eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {errors.general && (
            <span className="login-modal__error login-modal__error--general">{errors.general}</span>
          )}

          <button type="submit" className="login-modal__submit-btn" disabled={status === "loading"}>
            {status === "loading" ? "Вход..." : "Войти"}
          </button>
        </form>

        <p className="login-modal__switch">
          Нет аккаунта?{" "}
          <button type="button" className="login-modal__switch-link" onClick={onSwitchToRegister}>
            Зарегистрироваться
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginModal;
