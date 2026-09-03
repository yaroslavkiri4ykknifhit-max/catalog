import { HashRouter, Routes, Route } from 'react-router-dom';
import Catalog from './pages/Catalog';
import Admin from './pages/Admin';

function App() {
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
