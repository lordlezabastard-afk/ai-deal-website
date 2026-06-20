import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Placeholder from "./pages/Placeholder";
import { RegisterModalProvider } from "./context/RegisterModalContext";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RegisterModalProvider>
      <Navbar sidebarOpen={sidebarOpen} onBurgerClick={() => setSidebarOpen((open) => !open)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/school" element={<Placeholder title="AI School" />} />
          <Route path="/partners" element={<Placeholder title="Партнёрская программа" />} />
          <Route path="/finance" element={<Placeholder title="Финансы" />} />
          <Route path="/profile" element={<Placeholder title="Профиль" />} />
          <Route path="/security" element={<Placeholder title="Безопасность" />} />
          <Route path="/roadmap" element={<Placeholder title="Дорожная карта" />} />
        </Routes>
      </main>
      <Footer />
    </RegisterModalProvider>
  );
}

export default App;
