import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ImportData from './pages/ImportData';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="importar" element={<ImportData />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
