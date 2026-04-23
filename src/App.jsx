import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ImportData from './pages/ImportData';
import Cortes from './pages/Cortes';
import OSPendentes from './pages/OSPendentes';
import Configuracoes from './pages/Configuracoes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="cortes" element={<Cortes />} />
          <Route path="os/pendentes" element={<OSPendentes />} />
          <Route path="importar" element={<ImportData />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
