import { TrendingUp, Target } from 'lucide-react';
import GaugeChart from './GaugeChart';

const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const KpiCard = ({ title, data }) => {
  const { realizado = 0, previsto = 0 } = data;
  const porcentagem = previsto > 0 ? (realizado / previsto) * 100 : 0;

  return (
    <div className="bg-[var(--bg-surface)] dark:bg-slate-900/40 p-6 flex flex-col items-center rounded-3xl border border-[var(--border-color)] dark:border-brand-500/20 shadow-xl shadow-brand-500/5 transition-all card-hover">
      
      <div className="w-full text-center mb-4">
        <h3 className="text-sm font-bold text-[var(--text-muted)] italic heading-text uppercase tracking-tight">{title}</h3>
      </div>
      
      <div className="mb-4 drop-shadow-sm">
        <GaugeChart percent={porcentagem} size={150} strokeWidth={26} />
      </div>
      
      <div className="w-full flex flex-col items-center gap-2 mt-auto">
         <div className="flex items-center gap-2 text-[var(--text-main)]">
            <TrendingUp size={16} className="text-brand-500" />
            <span className="text-base font-black tabular-nums">
              {formatter.format(realizado)}
            </span>
         </div>
         <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Target size={16} className="opacity-70" />
            <span className="text-sm font-bold tabular-nums">
              {formatter.format(previsto)}
            </span>
         </div>
      </div>
    </div>
  );
};

export default KpiCard;
