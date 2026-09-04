import { useEffect, useState } from 'react';
import Catalog from './pages/Catalog';
import Admin from './pages/Admin';

function App() {
  // Telegram injects data into the hash like #tgWebAppData=...
  // We just check if the hash explicitly contains "admin" to show the admin page.
  // Otherwise, we show the Catalog.
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }
    } catch (e) {
      console.error(e);
    }

    const checkHash = () => {
      setIsAdmin(window.location.hash.includes('admin'));
    };
    
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  return isAdmin ? <Admin /> : <Catalog />;
}

export default App;
