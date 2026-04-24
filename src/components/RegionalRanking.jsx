import { TrendingUp, Target, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList, Cell } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formatter = new Intl.NumberFormat('pt-BR');
    const isAboveTarget = data.porcentagem >= 80; // Meta is 80% for OS
    
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 rounded-2xl shadow-2xl min-w-[220px] z-50 backdrop-blur-md">
        <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3 mb-3">
          <p className="font-black text-[var(--text-main)] uppercase tracking-widest text-[10px] flex items-center gap-1.5">
            <MapPin size={12} className="text-brand-500" />
            {data.name}
          </p>
          <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isAboveTarget ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {data.porcentagem.toFixed(1)}% SLA
          </div>
        </div>
        
        <div className="space-y-3">
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                    <TrendingUp size={10} className="text-brand-500"/> Realizado
                </span>
                <span className="font-black text-xl text-[var(--text-main)]">{formatter.format(data.realizado)}</span>
            </div>
            
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                    <Target size={10} className="text-slate-400"/> Previsto (80%)
                </span>
                <span className="font-black text-sm text-[var(--text-muted)]">{formatter.format(data.previsto)}</span>
            </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomizedLabel = (props) => {
  const { x, y, width, height, value } = props;
  return (
    <text x={x + width + 8} y={y + height / 2} fill="var(--text-main)" fontSize={11} dy={4} fontWeight="black">
      {value.toFixed(1)}%
    </text>
  );
};

const RegionalRanking = ({ data = [] }) => {
  const chartData = (data || []).slice(0, 10);

  return (
    <div className="glass-panel p-6 flex flex-col h-full card-hover border border-[var(--border-color)] relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <Target size={14} className="text-brand-500" />
                <h3 className="text-xs font-bold text-brand-500 uppercase tracking-widest">Performance</h3>
            </div>
            <p className="text-2xl font-black heading-text text-[var(--text-main)] tracking-tight">Ranking Regional</p>
          </div>
      </div>
      
      <div className="flex-1 w-full min-h-[300px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 60, left: -20, bottom: 0 }}>
            <defs>
               <linearGradient id="rankingPremiumGradient" x1="0" y1="0" x2="1" y2="0">
                 <stop offset="0%" stopColor="var(--brand-600)" stopOpacity={0.6} />
                 <stop offset="50%" stopColor="var(--brand-500)" strokeOpacity={0.8} />
                 <stop offset="100%" stopColor="var(--brand-400)" stopOpacity={1} />
               </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} opacity={0.4} />
            <XAxis type="number" hide domain={[0, 'dataMax + 20']} />
            <YAxis 
                type="category" 
                dataKey="name" 
                stroke="var(--text-muted)" 
                fontSize={10} 
                fontWeight="bold"
                tickLine={false} 
                axisLine={false} 
                width={120} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--brand-500)', opacity: 0.05 }} />
            
            <Bar dataKey="porcentagem" radius={[0, 6, 6, 0]} barSize={24} animationDuration={1500}>
               {chartData.map((entry, index) => (
                 <Cell 
                    key={`cell-${index}`} 
                    fill="url(#rankingPremiumGradient)" 
                    className="hover:brightness-110 transition-all duration-300"
                 />
               ))}
               <LabelList dataKey="porcentagem" content={<CustomizedLabel />} />
            </Bar>

            <ReferenceLine x={100} stroke="var(--brand-500)" strokeDasharray="4 4" opacity={0.5} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RegionalRanking;
