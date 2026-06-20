import { useEffect, useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { API_URL } from "../config";
import "./RegisterModal.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_FORM = { displayName: "", email: "", password: "", confirmPassword: "" };

function RegisterModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("email");
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab("email");
    setForm(EMPTY_FORM);
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setStatus("idle");
  }, [isOpen]);

  useEffect(() => {
    if (status !== "success") return;
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [status, onClose]);

  if (!isOpen) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.displayName.trim()) {
      nextErrors.displayName = "Введите имя";
    }
    if (!EMAIL_REGEX.test(form.email)) {
      nextErrors.email = "Введите корректный email";
    }
    if (form.password.length < 6) {
      nextErrors.password = "Пароль должен содержать минимум 6 символов";
    }
    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Пароли не совпадают";
    }
    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setStatus("loading");

    try {
      const response = await fetch(`${API_URL}/api/auth/register-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          displayName: form.displayName,
        }),
      });

      if (response.ok) {
        setStatus("success");
        return;
      }

      if (response.status === 409) {
        setErrors({ email: "Этот email уже зарегистрирован" });
      } else {
        setErrors({ general: "Что-то пошло не так, попробуйте позже" });
      }
      setStatus("idle");
    } catch {
      setErrors({ general: "Что-то пошло не так, попробуйте позже" });
      setStatus("idle");
    }
  };

  return (
    <div className="register-modal-overlay" onClick={onClose}>
      <div className="register-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="register-modal__close" onClick={onClose} aria-label="Закрыть">
          <X size={20} />
        </button>

        <h2 className="register-modal__title">Регистрация</h2>

        <div className="register-modal__tabs">
          <button
            type="button"
            className={`register-modal__tab ${activeTab === "email" ? "register-modal__tab--active" : ""}`}
            onClick={() => setActiveTab("email")}
          >
            Email
          </button>
          <button
            type="button"
            className={`register-modal__tab ${activeTab === "telegram" ? "register-modal__tab--active" : ""}`}
            onClick={() => setActiveTab("telegram")}
          >
            Telegram
          </button>
        </div>

        {activeTab === "email" ? (
          status === "success" ? (
            <p className="register-modal__success">Регистрация прошла успешно!</p>
          ) : (
            <form className="register-modal__form" onSubmit={handleSubmit}>
              <div className="register-modal__field">
                <label htmlFor="register-name">Имя</label>
                <input
                  id="register-name"
                  type="text"
                  value={form.displayName}
                  onChange={handleChange("displayName")}
                  autoComplete="name"
                />
                {errors.displayName && <span className="register-modal__error">{errors.displayName}</span>}
              </div>

              <div className="register-modal__field">
                <label htmlFor="register-email">Email</label>
                <input
                  id="register-email"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  autoComplete="email"
                />
                {errors.email && <span className="register-modal__error">{errors.email}</span>}
              </div>

              <div className="register-modal__field">
                <label htmlFor="register-password">Пароль</label>
                <div className="register-modal__password-wrap">
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange("password")}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="register-modal__eye"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className="register-modal__error">{errors.password}</span>}
              </div>

              <div className="register-modal__field">
                <label htmlFor="register-confirm-password">Повторите пароль</label>
                <div className="register-modal__password-wrap">
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="register-modal__eye"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "Скрыть пароль" : "Показать пароль"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="register-modal__error">{errors.confirmPassword}</span>
                )}
              </div>

              {errors.general && <span className="register-modal__error register-modal__error--general">{errors.general}</span>}

              <button type="submit" className="register-modal__submit-btn" disabled={status === "loading"}>
                {status === "loading" ? "Регистрация..." : "Зарегистрироваться"}
              </button>
            </form>
          )
        ) : (
          <p className="register-modal__telegram-placeholder">
            Вход через Telegram будет доступен в ближайшее время
          </p>
        )}
      </div>
    </div>
  );
}

export default RegisterModal;
