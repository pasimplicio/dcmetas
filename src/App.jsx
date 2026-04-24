import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Resumo from './pages/arrecadacao/Resumo';
import Comparativo from './pages/arrecadacao/Comparativo';
import CurvaPagamentos from './pages/arrecadacao/CurvaPagamentos';
import ImportData from './pages/ImportData';
import Cortes from './pages/Cortes';
import OSPendentes from './pages/OSPendentes';
import Configuracoes from './pages/Configuracoes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/arrecadacao/resumo" replace />} />
          <Route path="arrecadacao/resumo" element={<Resumo />} />
          <Route path="arrecadacao/comparativo" element={<Comparativo />} />
          <Route path="arrecadacao/curva" element={<CurvaPagamentos />} />
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
