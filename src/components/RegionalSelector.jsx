import { useState, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

const RegionalSelector = ({ regional, onChange }) => {
  const [regionais, setRegionais] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchRegionais = async () => {
    try {
      const res = await fetch(`${API_URL}/regionais`);
      if (!res.ok) throw new Error('Falha ao buscar regionais');
      const data = await res.json();
      setRegionais(['TODAS', ...data]);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch on mount
  useEffect(() => { fetchRegionais(); }, []);

  // Also re-fetch every time the dropdown is opened
  const handleToggle = () => {
    if (!isOpen) fetchRegionais();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button 
        onClick={handleToggle}
        className="flex items-center gap-3 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:border-brand-300 dark:hover:border-brand-500 transition-all group"
      >
        <MapPin size={18} className="text-brand-500 group-hover:scale-110 transition-transform" />
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Regional</span>
          <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase truncate max-w-[120px]">
            {regional === 'TODAS' ? 'Todas' : regional}
          </span>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl shadow-brand-500/10 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">Selecione a Regional</span>
            </div>
            <div className="max-h-80 overflow-y-auto py-2 custom-scrollbar">
              {regionais.map((reg) => (
                <button
                  key={reg}
                  onClick={() => {
                    onChange(reg);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-6 py-3 text-sm font-bold transition-colors flex items-center justify-between ${
                    regional === reg 
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-brand-600 dark:hover:text-brand-400'
                  }`}
                >
                  <span className="uppercase">{reg === 'TODAS' ? 'Todas as Regionais' : reg}</span>
                  {regional === reg && <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shadow-lg shadow-brand-500/50" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RegionalSelector;
