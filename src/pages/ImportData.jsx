import { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, RefreshCw, Trash2, Info } from 'lucide-react';
import { parseCSV } from '../services/csvParser';

const API_URL = 'http://localhost:3001/api';

const BATCH_SIZE = 5000;

const config = [
  { id: 'localidade', title: '1. Localidades (Dimensão)', fileMatch: 'dLocalidade', desc: 'Mapeamento de localidades e regionais. Essencial para o ranking.' },
  { id: 'arrecadacao', title: '2. Arrecadação (Fato)', fileMatch: 'fArrecadacao', desc: 'Recebimentos diários. Alimenta as barras e cards de realizado. (Agrupado para performance)' },
  { id: 'meta_regional', title: '3. Metas Regionais', fileMatch: 'fMetaArrecRegional', desc: 'Metas globais e por categoria. Base para as porcentagens de 2026.' },
  { id: 'meta_localidade', title: '4. Metas Locais (Opcional)', fileMatch: 'fMetaArrecLocalidade', desc: 'Metas detalhadas por unidade. Atualmente desconsiderado no dashboard.' },
  { id: 'cortes', title: '5. Cortes (Fato)', fileMatch: 'fcorte', desc: 'Base de ordens de corte e execuções. Alimenta o painel de Cortes.' }
];

const ImportData = () => {
  const [loading, setLoading] = useState(null);
  const [loadingText, setLoadingText] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorParse, setErrorParse] = useState(null);
  const fileInputRefs = useRef({});

  const [stats, setStats] = useState({ localidade: 0, arrecadacao: 0, meta_localidade: 0, meta_regional: 0, cortes: 0 });

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/stats`);
      const data = await res.json();
      setStats({
        localidade: data.localidade,
        arrecadacao: data.arrecadacao,
        meta_localidade: data.meta_localidade || 0,
        meta_regional: data.meta_regional,
        cortes: data.cortes || 0
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

  const sendInBatches = async (type, rows, onBatchProgress) => {
    const totalBatches = Math.ceil(rows.length / BATCH_SIZE);
    
    for (let i = 0; i < totalBatches; i++) {
      const batch = rows.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
      const isFirst = i === 0;
      
      const response = await fetch(`${API_URL}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data: batch, clearFirst: isFirst })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Falha no batch ${i + 1}/${totalBatches}`);
      }

      onBatchProgress(Math.round(((i + 1) / totalBatches) * 100));
    }
  };

  const onFileChange = async (e, id) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(id);
    setLoadingText('Lendo arquivo...');
    setProgress(0);
    setErrorParse(null);
    
    try {
      // Phase 1: Parse CSV
      let rows = await parseCSV(file, id, (prog) => {
          const pct = Math.round((prog.loaded / prog.total) * 50); // 0-50% for parsing
          setProgress(pct);
      });
      
      console.log(`Parsed ${rows.length} rows for ${id}`);
      if (rows.length === 0) {
        throw new Error("O arquivo parece estar vazio ou com formato inválido.");
      }

      // Phase 2: Send in batches
      setLoadingText(`Enviando ${rows.length.toLocaleString('pt-BR')} registros...`);

      await sendInBatches(id, rows, (batchPct) => {
        // 50-100% for uploading
        setProgress(50 + Math.round(batchPct / 2));
        setLoadingText(`Gravando... ${50 + Math.round(batchPct / 2)}%`);
      });

      await fetchStats();
      setProgress(100);
      setLoadingText('Concluído!');
    } catch (err) {
      console.error("Local Upload Error:", err);
      setErrorParse(`Erro ao processar: ${err.message}`);
    } finally {
      setTimeout(() => {
        setLoading(null);
        setLoadingText('');
        setProgress(0);
      }, 1000);
      e.target.value = '';
    }
  };

  const executeClear = async () => {
      setConfirmClear(false);
      setLoading('clear');
      setLoadingText('Limpando...');
      setErrorParse(null);
      
      try {
          const res = await fetch(`${API_URL}/clear`, { method: 'POST' });
          if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.error || 'Falha ao limpar banco.');
          }
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

      {/* Modal de Confirmação */}
      {confirmClear && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setConfirmClear(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative glass-panel border border-[var(--border-color)] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--text-main)]">Limpar Base de Dados</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-[var(--text-muted)] font-medium mb-8">
              Todos os dados de <strong className="text-[var(--text-main)]">Localidades, Arrecadação, Metas, e Cortes</strong> serão apagados permanentemente.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmClear(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-color)] hover:bg-[var(--bg-main)] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={executeClear}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
              >
                Sim, Limpar Tudo
              </button>
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
                {isDone ? (
                    <div className="flex items-center justify-center bg-emerald-500/10 text-emerald-500 p-3 rounded-2xl ring-1 ring-emerald-500/20">
                        <CheckCircle2 size={24} />
                    </div>
                ) : (
                    <div className="flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-muted)] p-3 rounded-2xl ring-1 ring-[var(--border-color)]">
                        <UploadCloud size={24} />
                    </div>
                )}
              </div>
              
              <div className="mt-auto pt-6 flex flex-col gap-4">
                <input 
                  type="file" 
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => onFileChange(e, id)}
                  ref={(el) => fileInputRefs.current[id] = el}
                />
                
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
