import { useState, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import api from '../services/api.js';

const RegionalSelector = ({ regional, onChange }) => {
  const [regionais, setRegionais] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchRegionais = async () => {
    try {
      const data = await api.get('/regionais');
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
        className="flex items-center gap-3 px-5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/5 hover:border-brand-500 transition-all group"
      >
        <MapPin size={18} className="text-brand-500 group-hover:scale-110 transition-transform" />
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Regional</span>
          <span className="text-sm font-black text-[var(--text-main)] uppercase truncate max-w-[120px]">
            {regional === 'TODAS' ? 'Todas' : regional}
          </span>
        </div>
        <ChevronDown size={16} className={`text-[var(--text-muted)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-64 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl shadow-2xl shadow-brand-500/10 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-3 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
              <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-3">Selecione a Regional</span>
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
                      ? 'bg-brand-500/10 text-brand-500' 
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-brand-500'
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
