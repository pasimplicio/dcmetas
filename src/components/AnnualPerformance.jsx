import { TrendingUp, Target, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const isAboveTarget = data.porcentagem >= 100;
    
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 rounded-2xl shadow-2xl min-w-[220px] z-50 backdrop-blur-md">
        <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3 mb-3">
          <p className="font-black text-[var(--text-muted)] uppercase tracking-widest text-[10px] flex items-center gap-1.5">
            <Calendar size={12} className="text-brand-500" />
            {label}
          </p>
          {data.porcentagem !== null && data.previsto > 0 && (
              <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isAboveTarget ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {data.porcentagem.toFixed(1)}% Atingido
              </div>
          )}
        </div>
        
        <div className="space-y-3">
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                    <TrendingUp size={10} className="text-brand-500"/> Realizado
                </span>
                <span className="font-black text-xl text-[var(--text-main)]">{formatter.format(data.realizado)}</span>
            </div>
            
            {data.previsto > 0 && (
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                        <Target size={10} className="text-slate-400"/> Meta
                    </span>
                    <span className="font-black text-sm text-[var(--text-muted)]">{formatter.format(data.previsto)}</span>
                </div>
            )}
        </div>
      </div>
    );
  }
  return null;
};

const AnnualPerformance = ({ data }) => {
  return (
    <div className="glass-panel p-6 flex flex-col h-full card-hover border border-[var(--border-color)] relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <Calendar size={14} className="text-brand-500" />
                <h3 className="text-xs font-bold text-brand-500 uppercase tracking-widest">Evolução Temporal</h3>
            </div>
            <p className="text-2xl font-black heading-text text-[var(--text-main)] tracking-tight">Performance Anual</p>
          </div>
          
          {/* Custom Legend */}
          <div className="flex items-center gap-4 bg-[var(--bg-main)] px-4 py-2 rounded-xl border border-[var(--border-color)]">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-main)]">Realizado</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 border-t-2 border-dashed border-[var(--text-muted)] opacity-70"></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Meta</span>
             </div>
          </div>
      </div>
      
      <div className="flex-1 w-full min-h-[300px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRealizadoPremium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--brand-500)" stopOpacity={0.5}/>
                <stop offset="50%" stopColor="var(--brand-500)" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="var(--brand-500)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.4} />
            
            <XAxis 
                dataKey="month" 
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
                content={<CustomTooltip />} 
                cursor={{ stroke: 'var(--brand-500)', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.3 }} 
            />
            
            <Area 
                type="monotone" 
                dataKey="realizado" 
                stroke="var(--brand-500)" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorRealizadoPremium)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--brand-500)', className: "shadow-[0_0_10px_rgba(59,130,246,0.8)] drop-shadow-md" }}
                animationDuration={1500}
            />
            
            <Area 
                type="monotone" 
                dataKey="previsto" 
                stroke="var(--text-muted)" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="transparent" 
                activeDot={false}
                animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnnualPerformance;
