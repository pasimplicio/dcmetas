import { TrendingUp, Target } from 'lucide-react';
import GaugeChart from './GaugeChart';

const formatterMoney = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatterNumber = new Intl.NumberFormat('pt-BR');

const KpiCard = ({ title, data, isCurrency = true }) => {
  const { realizado = 0, previsto = 0 } = data;
  const porcentagem = previsto > 0 ? (realizado / previsto) * 100 : 0;
  
  const format = (val) => isCurrency ? formatterMoney.format(val) : formatterNumber.format(val);

  return (
    <div className="bg-[var(--bg-surface)] dark:bg-slate-900/40 p-6 flex flex-col items-center rounded-3xl border border-[var(--border-color)] dark:border-brand-500/20 shadow-xl shadow-brand-500/5 transition-all card-hover group">
      
      <div className="w-full text-center mb-5">
        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 heading-text uppercase tracking-[0.1em]">{title}</h3>
      </div>
      
      <div className="mb-6 drop-shadow-md transform group-hover:scale-105 transition-transform duration-500">
        <GaugeChart percent={porcentagem} size={160} strokeWidth={24} />
      </div>
      
      <div className="w-full flex flex-col items-center gap-3 mt-auto">
          <div className="flex flex-col items-center">
             <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
                <TrendingUp size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Realizado</span>
             </div>
             <span className="text-xl font-black heading-text text-slate-800 dark:text-white tabular-nums leading-none mt-1">
               {format(realizado)}
             </span>
          </div>

          <div className="w-12 h-[1px] bg-slate-200 dark:bg-slate-800 my-1"></div>

          <div className="flex flex-col items-center opacity-70">
             <div className="flex items-center gap-1.5 text-slate-500">
                <Target size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Previsto</span>
             </div>
             <span className="text-sm font-bold text-slate-600 dark:text-slate-400 tabular-nums leading-none mt-1">
               {format(previsto)}
             </span>
          </div>
      </div>
    </div>
  );
};

export default KpiCard;
