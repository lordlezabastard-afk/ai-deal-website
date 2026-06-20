import { createContext, useContext, useState } from "react";
import RegisterModal from "../components/RegisterModal";

const RegisterModalContext = createContext(null);

export function RegisterModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openRegisterModal = () => setIsOpen(true);
  const closeRegisterModal = () => setIsOpen(false);

  return (
    <RegisterModalContext.Provider value={{ openRegisterModal }}>
      {children}
      <RegisterModal isOpen={isOpen} onClose={closeRegisterModal} />
    </RegisterModalContext.Provider>
  );
}

export function useRegisterModal() {
  const ctx = useContext(RegisterModalContext);
  if (!ctx) {
    throw new Error("useRegisterModal must be used within a RegisterModalProvider");
  }
  return ctx;
}
