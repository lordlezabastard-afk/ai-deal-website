import { createContext, useContext, useState } from "react";
import RegisterModal from "../components/RegisterModal";
import LoginModal from "../components/LoginModal";

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [activeModal, setActiveModal] = useState(null); // null | "register" | "login"

  const openRegisterModal = () => setActiveModal("register");
  const openLoginModal = () => setActiveModal("login");
  const closeModal = () => setActiveModal(null);

  return (
    <AuthModalContext.Provider value={{ openRegisterModal, openLoginModal, closeModal }}>
      {children}
      <RegisterModal
        isOpen={activeModal === "register"}
        onClose={closeModal}
        onSwitchToLogin={openLoginModal}
      />
      <LoginModal
        isOpen={activeModal === "login"}
        onClose={closeModal}
        onSwitchToRegister={openRegisterModal}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return ctx;
}
