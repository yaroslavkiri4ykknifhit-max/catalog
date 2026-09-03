import { HashRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Catalog from './pages/Catalog';
import Admin from './pages/Admin';

function App() {
  useEffect(() => {
    try {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
