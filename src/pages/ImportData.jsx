import { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, RefreshCw, Trash2, Info, Landmark, Banknote, Target, MapPin, Scissors, ClipboardCheck, Receipt, Coins } from 'lucide-react';
import { parseCSV } from '../services/csvParser';
import api from '../services/api.js';

const BATCH_SIZE = 5000;

const config = [
  { id: 'localidade', title: '1. Localidades (Dimensão)', fileMatch: 'dLocalidade', desc: 'Mapeamento de localidades e regionais. Essencial para o ranking.', icon: <Landmark size={24} /> },
  { id: 'arrecadacao', title: '2. Arrecadação (Fato)', fileMatch: 'fArrecadacao', desc: 'Recebimentos diários. Alimenta as barras e cards de realizado.', icon: <Banknote size={24} /> },
  { id: 'meta_regional', title: '3. Metas Regionais', fileMatch: 'fMetaArrecRegional', desc: 'Metas globais e por categoria. Base para as porcentagens de 2026.', icon: <Target size={24} /> },
  { id: 'meta_localidade', title: '4. Metas Locais (Opcional)', fileMatch: 'fMetaArrecLocalidade', desc: 'Metas detalhadas por unidade. Atualmente desconsiderado no dashboard.', icon: <MapPin size={24} /> },
  { id: 'cortes', title: '5. Cortes (Fato)', fileMatch: 'fcorte', desc: 'Base de cortes e religações. Alimenta o painel de Acompanhamento de Cortes.', icon: <Scissors size={24} /> },
  { id: 'os', title: '6. Ordens de Serviço (Fato)', fileMatch: 'fordemservico', desc: 'Base completa de OS. Alimenta o painel de Acompanhamento de OS Pendentes.', icon: <ClipboardCheck size={24} /> },
  { id: 'faturamento', title: '7. Faturamento (Fato)', fileMatch: 'fFaturamento', desc: 'Base de faturamento mensal por localidade.', icon: <Receipt size={24} /> },
  { id: 'pagamentos', title: '8. Pagamentos 2026 (Fato)', fileMatch: 'fPagamento_2026', desc: 'Base detalhada de pagamentos por matrícula.', icon: <Coins size={24} /> }
];

const ImportData = () => {
  const [loading, setLoading] = useState(null);
  const [loadingText, setLoadingText] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmClearTable, setConfirmClearTable] = useState(null); // stores the id of the table to clear
  const [clearOnImport, setClearOnImport] = useState({
    localidade: true, arrecadacao: true, meta_localidade: true, meta_regional: true, 
    cortes: true, os: true, faturamento: true, pagamentos: true 
  });
  const [progress, setProgress] = useState(0);
  const [errorParse, setErrorParse] = useState(null);
  const fileInputRefs = useRef({});

  const [stats, setStats] = useState({ localidade: 0, arrecadacao: 0, meta_localidade: 0, meta_regional: 0, cortes: 0, os: 0, faturamento: 0, pagamentos: 0 });

  const fetchStats = async () => {
    try {
      const data = await api.get('/stats');
      setStats({
        localidade: data.localidade,
        arrecadacao: data.arrecadacao,
        meta_localidade: data.meta_localidade || 0,
        meta_regional: data.meta_regional,
        cortes: data.cortes || 0,
        os: data.os || 0,
        faturamento: data.faturamento || 0,
        pagamentos: data.pagamentos || 0
      });
    } catch (err) {
      console.error("Error fetching project stats", err);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, []);

  const handleUploadClick = (id) => {
    fileInputRefs.current[id].click();
  };

  const toggleClearOnImport = (id) => {
    setClearOnImport(prev => ({ ...prev, [id]: !prev[id] }));
  };


  const onFileChange = async (e, id) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(id);
    setLoadingText('Lendo arquivo...');
    setProgress(0);
    setErrorParse(null);
    
    const BATCH = 50000;
    const shouldClear = clearOnImport[id];

    try {
      // Phase 1: Parse CSV (0-40%)
      let rows = await parseCSV(file, id, (prog) => {
          const pct = Math.round((prog.loaded / prog.total) * 40);
          setProgress(pct);
          setLoadingText(`Lendo ${Math.round(prog.loaded / 1024 / 1024)}MB...`);
      });
      
      console.log(`Parsed ${rows.length} rows for ${id}`);
      if (rows.length === 0) {
        throw new Error("O arquivo parece estar vazio ou com formato inválido.");
      }

      // Phase 2: Send in large batches (40-100%)
      const totalBatches = Math.ceil(rows.length / BATCH);
      
      for (let i = 0; i < totalBatches; i++) {
        const batch = rows.slice(i * BATCH, (i + 1) * BATCH);
        // Clear first batch only if shouldClear is true
        const isFirst = i === 0 && shouldClear;
        
        setLoadingText(`Gravando ${((i + 1) * BATCH > rows.length ? rows.length : (i + 1) * BATCH).toLocaleString('pt-BR')} / ${rows.length.toLocaleString('pt-BR')}`);
        await api.post('/import', { type: id, data: batch, clearFirst: isFirst });
        
        setProgress(40 + Math.round(((i + 1) / totalBatches) * 60));
      }

      // Free memory
      rows = null;

      await fetchStats();
      setProgress(100);
      setLoadingText('Concluído!');
    } catch (err) {
      console.error("Upload Error:", err);
      setErrorParse(`Erro ao processar: ${err.message}`);
    } finally {
      setTimeout(() => {
        setLoading(null);
        setLoadingText('');
        setProgress(0);
      }, 2000);
      e.target.value = '';
    }
  };

  const executeClearTable = async (id) => {
      setConfirmClearTable(null);
      setLoading(id);
      setLoadingText('Limpando tabela...');
      setErrorParse(null);
      
      try {
          await api.post('/clear-table', { type: id });
          // Ensure stats are fresh
          await fetchStats();
      } catch (err) {
          console.error("Clear Table Error:", err);
          setErrorParse(`Erro ao limpar tabela: ${err.message}`);
      } finally {
          setLoading(null);
          setLoadingText('');
      }
  };

  const executeClear = async () => {
      setConfirmClear(false);
      setLoading('clear');
      setLoadingText('Limpando...');
      setErrorParse(null);
      
      try {
          await api.post('/clear', {});
          await fetchStats();
      } catch (err) {
          console.error("Clear Error:", err);
          setErrorParse(`Erro ao limpar: ${err.message}`);
      } finally {
          setLoading(null);
          setLoadingText('');
      }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Modal de Confirmação - Limpar Tudo */}
      {confirmClear && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setConfirmClear(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative glass-panel border border-[var(--border-color)] p-8 rounded-3xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--text-main)]">Limpar Tudo</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">Esta ação apagará toda a base.</p>
              </div>
            </div>
            <p className="text-[var(--text-muted)] font-medium mb-8">
              Todos os dados de todas as tabelas serão removidos permanentemente. Deseja prosseguir?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmClear(false)} className="px-6 py-2.5 rounded-xl font-bold text-[var(--text-muted)] hover:bg-[var(--bg-main)] transition-all">Cancelar</button>
              <button onClick={executeClear} className="px-6 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all">Limpar Tudo</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação - Limpar Tabela Única */}
      {confirmClearTable && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setConfirmClearTable(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative glass-panel border border-[var(--border-color)] p-8 rounded-3xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-rose-500/10 rounded-2xl">
                <Trash2 size={28} className="text-rose-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--text-main)]">Limpar Tabela</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">{config.find(c => c.id === confirmClearTable)?.title}</p>
              </div>
            </div>
            <p className="text-[var(--text-muted)] font-medium mb-8">
              Deseja apagar permanentemente apenas os dados desta tabela? As outras tabelas permanecerão intactas.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmClearTable(null)} className="px-6 py-2.5 rounded-xl font-bold text-[var(--text-muted)] hover:bg-[var(--bg-main)] transition-all">Cancelar</button>
              <button onClick={() => executeClearTable(confirmClearTable)} className="px-6 py-2.5 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all">Limpar Tabela</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-8 glass-panel border border-[var(--border-color)] gap-6">
        <div>
          <h2 className="text-3xl font-black heading-text text-[var(--text-main)] tracking-tight">Gestão da Base de Dados</h2>
          <p className="text-[var(--text-muted)] mt-2 max-w-xl font-medium">Importe as planilhas CSV extraídas do sistema para atualizar os indicadores do dashboard.</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-brand-500 font-bold uppercase tracking-widest bg-brand-500/10 w-fit px-3 py-1 rounded-full">
             <Info size={14}/>
             Importe "Localidades" primeiro para garantir a integridade.
          </div>
        </div>
        <button 
          onClick={() => setConfirmClear(true)} 
          disabled={loading === 'clear'}
          className="group flex items-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 border border-red-200 dark:border-red-500/20 rounded-2xl hover:bg-red-600 hover:text-white transition-all font-bold disabled:opacity-50"
        >
           {loading === 'clear' ? <RefreshCw className="animate-spin" size={18} /> : <Trash2 size={18} className="group-hover:animate-bounce" />}
           {loading === 'clear' ? 'Limpando...' : 'Limpar Tudo'}
        </button>
      </div>

      {errorParse && (
        <div className="p-6 bg-red-500/10 border-2 border-red-500/20 rounded-2xl flex items-center gap-4 text-red-600 dark:text-red-400 font-bold">
           <AlertCircle size={24} />
           {errorParse}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {config.map(({ id, title, fileMatch, desc }) => {
          const count = stats ? stats[id] : 0;
          const isLoading = loading === id;
          const isDone = count > 0;

          return (
            <div key={id} className={`glass-panel p-8 flex flex-col border-2 transition-all duration-300 ${isDone ? 'border-brand-500/30' : 'border-transparent'} card-hover`}>
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-[var(--text-main)] heading-text tracking-tight">{title}</h3>
                  <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed">{desc}</p>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <div className={`flex items-center justify-center p-3 rounded-2xl ring-1 transition-all duration-500 ${
                      isDone 
                        ? 'bg-brand-500/10 text-brand-500 ring-brand-500/20' 
                        : 'bg-[var(--bg-main)] text-[var(--text-muted)] ring-[var(--border-color)]'
                    }`}>
                      {config.find(c => c.id === id).icon}
                    </div>
                    {isDone && (
                      <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg border-2 border-[var(--bg-surface)] animate-in zoom-in duration-300">
                        <CheckCircle2 size={12} />
                      </div>
                    )}
                  </div>
                  
                  {isDone && !isLoading && (
                    <button 
                      onClick={() => setConfirmClearTable(id)}
                      title="Limpar apenas esta tabela"
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all self-end"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-auto pt-6 flex flex-col gap-4">
                <input 
                  type="file" 
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => onFileChange(e, id)}
                  ref={(el) => fileInputRefs.current[id] = el}
                />
                
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-bold uppercase tracking-wider">
                           {isLoading ? (
                               <span className="text-brand-500 animate-pulse flex items-center gap-2">
                                  <RefreshCw className="animate-spin" size={16} /> {loadingText} {progress}%
                               </span>
                           ) : isDone ? (
                               <span className="text-[var(--text-main)]">
                                   {count.toLocaleString('pt-BR')} <span className="text-[var(--text-muted)] font-medium">registros</span>
                               </span>
                           ) : (
                               <span className="text-[var(--text-muted)] italic">Aguardando arquivo</span>
                           )}
                        </div>

                        <button 
                          onClick={() => handleUploadClick(id)}
                          disabled={isLoading}
                          className={`px-6 py-2.5 rounded-xl font-black transition-all disabled:opacity-50 ${
                            isDone 
                            ? 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-brand-50 dark:hover:bg-slate-800' 
                            : 'bg-brand-500 text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600'
                          }`}
                        >
                          {isDone ? 'Atualizar' : 'Importar CSV'}
                        </button>
                    </div>

                    {!isLoading && (
                      <label className="flex items-center gap-2 cursor-pointer group w-fit">
                        <div 
                          onClick={() => toggleClearOnImport(id)}
                          className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
                            clearOnImport[id] ? 'bg-brand-500 border-brand-500' : 'border-[var(--border-color)]'
                          }`}
                        >
                          {clearOnImport[id] && <CheckCircle2 size={10} className="text-white" />}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] group-hover:text-brand-500 transition-colors">
                          Limpar antes de importar
                        </span>
                      </label>
                    )}
                </div>

                {isLoading && (
                  <div className="w-full bg-[var(--bg-main)] h-2 rounded-full overflow-hidden ring-1 ring-[var(--border-color)]">
                      <div className="bg-brand-500 h-full transition-all duration-300 shadow-[0_0_8px_rgba(14,165,233,0.5)]" style={{ width: `${progress}%` }}></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ImportData;
