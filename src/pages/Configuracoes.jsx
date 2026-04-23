import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Server, CheckCircle2, XCircle, RefreshCw, Wifi, WifiOff, ArrowRight, Info, Shield } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

const Configuracoes = () => {
  const navigate = useNavigate();
  const [activeSource, setActiveSource] = useState('sqlite');
  const [pgConfigured, setPgConfigured] = useState(false);
  const [pgHost, setPgHost] = useState(null);
  const [pgDatabase, setPgDatabase] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API_URL}/datasource/test`);
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ success: false, error: 'Falha ao conectar ao servidor local.' });
    } finally {
      setTesting(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/datasource`);
      const data = await res.json();
      setActiveSource(data.active);
      setPgConfigured(data.pgConfigured);
      setPgHost(data.pgHost);
      setPgDatabase(data.pgDatabase);
      
      if (data.pgConfigured && data.active === 'postgres') {
        handleTestConnection();
      }
    } catch (err) {
      console.error('Erro ao buscar status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleSwitch = async (source) => {
    setSwitching(true);
    try {
      const res = await fetch(`${API_URL}/datasource`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source })
      });
      const data = await res.json();
      if (data.success) {
        setActiveSource(data.active);
      } else {
        setTestResult({ success: false, error: data.error });
      }
    } catch (err) {
      setTestResult({ success: false, error: 'Falha ao alternar fonte de dados.' });
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[70vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-brand-200 dark:border-brand-900/30 border-t-brand-500 rounded-full animate-spin"></div>
        </div>
        <p className="mt-6 text-lg font-bold heading-text text-[var(--text-main)] animate-pulse">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="p-8 glass-panel border border-[var(--border-color)]">
        <h2 className="text-3xl font-black heading-text text-[var(--text-main)] tracking-tight">Configurações</h2>
        <p className="text-[var(--text-muted)] mt-2 max-w-xl font-medium">
          Configure a fonte de dados utilizada pelo dashboard. Escolha entre importação local (SQLite) ou consulta direta ao banco de produção (PostgreSQL).
        </p>
      </div>

      {/* Source Cards */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* SQLite Card */}
        <div 
          className={`glass-panel p-8 flex flex-col border-2 transition-all duration-300 ${
            activeSource === 'sqlite' 
              ? 'border-brand-500 shadow-xl shadow-brand-500/10' 
              : 'border-transparent'
          }`}
        >
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl transition-colors ${
                activeSource === 'sqlite' 
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' 
                  : 'bg-[var(--bg-main)] text-[var(--text-muted)] ring-1 ring-[var(--border-color)]'
              }`}>
                <Database size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--text-main)] heading-text">Importação Local</h3>
                <p className="text-sm text-[var(--text-muted)] font-medium">SQLite</p>
              </div>
            </div>
            <button
              onClick={() => handleSwitch('sqlite')}
              disabled={switching || activeSource === 'sqlite'}
              className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-80 flex-shrink-0 cursor-pointer disabled:cursor-default"
              style={{ backgroundColor: activeSource === 'sqlite' ? '#0ea5e9' : 'var(--border-color)' }}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                activeSource === 'sqlite' ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed mb-6">
            Utiliza dados importados via planilhas CSV. Os dados ficam armazenados localmente no banco SQLite. 
            Ideal para análises offline ou quando não há acesso ao banco de produção.
          </p>

          <div className="mt-auto pt-6 border-t border-[var(--border-color)] flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              <Info size={14} className="text-brand-500" />
              Requer importação manual dos CSVs
            </div>
            
            <button
              onClick={() => navigate('/importar')}
              className={`flex items-center justify-between w-full p-3 rounded-xl border transition-all duration-300 ${
                activeSource === 'sqlite'
                  ? 'bg-brand-500/10 border-brand-500/30 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20'
                  : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)] opacity-50 cursor-not-allowed'
              }`}
              disabled={activeSource !== 'sqlite'}
            >
              <div className="flex items-center gap-3">
                <Database size={18} />
                <span className="text-sm font-black uppercase tracking-tight">Área de Importação</span>
              </div>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* PostgreSQL Card */}
        <div 
          className={`glass-panel p-8 flex flex-col border-2 transition-all duration-300 ${
            activeSource === 'postgres' 
              ? 'border-emerald-500 shadow-xl shadow-emerald-500/10' 
              : 'border-transparent'
          }`}
        >
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl transition-colors ${
                activeSource === 'postgres' 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                  : 'bg-[var(--bg-main)] text-[var(--text-muted)] ring-1 ring-[var(--border-color)]'
              }`}>
                <Server size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--text-main)] heading-text">Consulta Direta</h3>
                <p className="text-sm text-[var(--text-muted)] font-medium">PostgreSQL (Produção)</p>
              </div>
            </div>
            <button
              onClick={() => pgConfigured && handleSwitch('postgres')}
              disabled={switching || !pgConfigured || activeSource === 'postgres'}
              className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-80 disabled:cursor-default flex-shrink-0 cursor-pointer"
              style={{ backgroundColor: activeSource === 'postgres' ? '#10b981' : 'var(--border-color)' }}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                activeSource === 'postgres' ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed mb-6">
            Consulta os dados diretamente do banco de produção da organização em tempo real. 
            Sem necessidade de importação manual — os dados são sempre atualizados.
          </p>

          <div className="mt-auto pt-4 border-t border-[var(--border-color)]">
            {pgConfigured ? (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-wider">
                <Shield size={14} />
                Credenciais configuradas via .env
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
                <WifiOff size={14} />
                Configure as credenciais no arquivo .env
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection Status Panel */}
      <div className="glass-panel p-8 border border-[var(--border-color)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
          <div>
            <h3 className="text-xl font-black heading-text text-[var(--text-main)] tracking-tight">Conexão PostgreSQL</h3>
            <p className="text-sm text-[var(--text-muted)] font-medium mt-1">
              Verifique a conectividade com o banco de produção antes de ativar.
            </p>
          </div>
          <button
            onClick={handleTestConnection}
            disabled={testing || !pgConfigured}
            className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <Wifi size={18} />
            )}
            {testing ? 'Testando...' : 'Testar Conexão'}
          </button>
        </div>

        {/* Connection Info */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-[var(--bg-main)] p-4 rounded-2xl border border-[var(--border-color)]">
            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Host</span>
            <p className="text-sm font-bold text-[var(--text-main)] mt-1 font-mono">{pgHost || '—'}</p>
          </div>
          <div className="bg-[var(--bg-main)] p-4 rounded-2xl border border-[var(--border-color)]">
            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Database</span>
            <p className="text-sm font-bold text-[var(--text-main)] mt-1 font-mono">{pgDatabase || '—'}</p>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`p-6 rounded-2xl border-2 flex items-start gap-4 ${
            testResult.success 
              ? 'bg-emerald-500/5 border-emerald-500/20' 
              : 'bg-red-500/5 border-red-500/20'
          }`}>
            {testResult.success ? (
              <CheckCircle2 size={24} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className={`font-black text-sm ${testResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {testResult.success ? 'Conexão bem-sucedida!' : 'Falha na conexão'}
              </h4>
              {testResult.success ? (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-mono text-[var(--text-muted)]">{testResult.version}</p>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)] font-medium mt-1">{testResult.error}</p>
              )}
            </div>
          </div>
        )}

        {!pgConfigured && (
          <div className="p-6 bg-amber-500/5 border-2 border-amber-500/20 rounded-2xl flex items-start gap-4">
            <Info size={24} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black text-sm text-amber-600 dark:text-amber-400">Configuração necessária</h4>
              <p className="text-sm text-[var(--text-muted)] font-medium mt-1">
                Edite o arquivo <code className="bg-[var(--bg-main)] px-2 py-0.5 rounded text-brand-500 font-mono text-xs">.env</code> na raiz do projeto com as credenciais do banco de produção e reinicie o servidor.
              </p>
              <div className="mt-3 bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)] font-mono text-xs text-[var(--text-muted)] leading-relaxed">
                PG_HOST=192.168.x.x<br/>
                PG_PORT=5432<br/>
                PG_DATABASE=nome_banco<br/>
                PG_USER=usuario<br/>
                PG_PASSWORD=senha
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Active Source Indicator */}
      <div className={`p-6 rounded-3xl border-2 flex items-center justify-between ${
        activeSource === 'sqlite' 
          ? 'bg-brand-500/5 border-brand-500/20' 
          : 'bg-emerald-500/5 border-emerald-500/20'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${
            activeSource === 'sqlite' ? 'bg-brand-500/10 text-brand-500' : 'bg-emerald-500/10 text-emerald-500'
          }`}>
            {activeSource === 'sqlite' ? <Database size={24} /> : <Server size={24} />}
          </div>
          <div>
            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Fonte de dados ativa</span>
            <p className="text-lg font-black heading-text text-[var(--text-main)]">
              {activeSource === 'sqlite' ? 'Importação Local (SQLite)' : 'Consulta Direta (PostgreSQL)'}
            </p>
          </div>
        </div>
        <ArrowRight size={20} className="text-[var(--text-muted)]" />
      </div>

    </div>
  );
};

export default Configuracoes;
