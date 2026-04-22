import { TrendingUp, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 rounded-2xl shadow-2xl text-sm z-50 backdrop-blur-md">
        <p className="font-bold text-[var(--text-main)] mb-3 uppercase tracking-wider">{label}</p>
        <div className="space-y-2">
            <div className="flex justify-between items-center gap-4 border-b border-[var(--border-color)] pb-2 text-brand-600 dark:text-brand-400">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} />
                  <span className="font-medium">Realizado</span>
                </div>
                <span className="font-black">{formatter.format(data.realizado)}</span>
            </div>
            <div className="flex justify-between items-center gap-4 text-[var(--text-muted)] pt-1">
                <div className="flex items-center gap-2">
                  <Target size={16} className="opacity-70" />
                  <span className="font-medium">Meta</span>
                </div>
                <span className="font-bold">{formatter.format(data.previsto)}</span>
            </div>
        </div>
        {data.porcentagem !== null && (
            <div className={`mt-4 pt-3 border-t-2 border-[var(--border-color)] flex justify-between items-center ${data.porcentagem >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                <span className="font-bold uppercase text-[10px]">Aproveitamento</span>
                <span className="text-lg font-black">{data.porcentagem.toFixed(1)}%</span>
            </div>
        )}
      </div>
    );
  }
  return null;
};

const AnnualPerformance = ({ data }) => {
  return (
    <div className="glass-panel p-6 flex flex-col h-full card-hover border border-[var(--border-color)]">
      <div className="mb-6">
          <h3 className="text-xs font-bold text-[var(--text-muted)] heading-text uppercase tracking-widest mb-1">Evolução Temporal</h3>
          <p className="text-xl font-black text-[var(--text-main)]">Performance Anual</p>
      </div>
      
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--brand-500)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--brand-500)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area 
                type="monotone" 
                dataKey="realizado" 
                stroke="var(--brand-500)" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorRealizado)" 
            />
            <Area 
                type="monotone" 
                dataKey="previsto" 
                stroke="var(--text-muted)" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="transparent" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnnualPerformance;
