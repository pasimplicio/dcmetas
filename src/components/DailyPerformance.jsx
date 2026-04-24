import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

const CustomTooltip = ({ active, payload, label, average }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const isAbove = value >= average;
    
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 rounded-2xl shadow-2xl min-w-[220px] z-50 backdrop-blur-md">
        <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3 mb-3">
          <p className="font-black text-[var(--text-muted)] uppercase tracking-widest text-[10px] flex items-center gap-1.5">
            <Activity size={12} className="text-brand-500" />
            Dia {label}
          </p>
          <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isAbove ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {isAbove ? 'Acima da Média' : 'Abaixo da Média'}
          </div>
        </div>
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Valor Arrecadado</span>
            <span className="font-black text-2xl text-[var(--text-main)]">{formatter.format(value)}</span>
        </div>
      </div>
    );
  }
  return null;
};

const DailyPerformance = ({ data }) => {
  const average = useMemo(() => {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, curr) => acc + curr.realizado, 0);
    return sum / data.length;
  }, [data]);

  return (
    <div className="glass-panel p-6 flex flex-col h-full card-hover border border-[var(--border-color)] relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-brand-500" />
                <h3 className="text-xs font-bold text-brand-500 uppercase tracking-widest">Ritmo Mensal</h3>
            </div>
            <p className="text-2xl font-black heading-text text-[var(--text-main)] tracking-tight">Entradas Diárias</p>
          </div>
          
          <div className="flex items-center gap-3 bg-[var(--bg-main)] px-4 py-2 rounded-xl border border-[var(--border-color)]">
             <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Média Diária</span>
                <span className="text-sm font-black text-[var(--text-main)]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(average)}
                </span>
             </div>
          </div>
      </div>
      
      <div className="flex-1 w-full min-h-[300px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 0, left: 10, bottom: 0 }}>
            <defs>
               <linearGradient id="barPremiumGradient" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="0%" stopColor="var(--brand-400)" stopOpacity={1} />
                 <stop offset="50%" stopColor="var(--brand-500)" stopOpacity={0.8} />
                 <stop offset="100%" stopColor="var(--brand-600)" stopOpacity={0.4} />
               </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.4} />
            
            <XAxis 
                dataKey="day" 
                stroke="var(--text-muted)" 
                fontSize={10} 
                fontWeight="bold"
                tickLine={false} 
                axisLine={false} 
                tickMargin={10}
            />
            
            <YAxis 
              stroke="var(--text-muted)" 
              fontSize={10} 
              fontWeight="bold"
              tickLine={false} 
              axisLine={false} 
              width={45}
              tickMargin={10}
              tickFormatter={(value) => 
                new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(value)
              }
            />
            
            <Tooltip 
                content={<CustomTooltip average={average} />} 
                cursor={{ fill: 'var(--brand-500)', opacity: 0.05 }} 
            />
            
            {average > 0 && (
                <ReferenceLine 
                    y={average} 
                    stroke="var(--brand-500)" 
                    strokeDasharray="4 4" 
                    opacity={0.5} 
                />
            )}
            
            <Bar dataKey="realizado" radius={[6, 6, 0, 0]} maxBarSize={40} animationDuration={1500}>
               {data.map((entry, index) => (
                 <Cell 
                    key={`cell-${index}`} 
                    fill="url(#barPremiumGradient)" 
                    className="hover:brightness-110 transition-all duration-300"
                 />
               ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DailyPerformance;
