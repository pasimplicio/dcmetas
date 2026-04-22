import { TrendingUp, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 rounded-2xl shadow-2xl text-sm z-50 backdrop-blur-md">
        <p className="font-bold text-[var(--text-main)] mb-3 uppercase tracking-wider">{data.name}</p>
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
        <div className={`mt-4 pt-3 border-t-2 border-[var(--border-color)] flex justify-between items-center ${data.porcentagem >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
            <span className="font-bold uppercase text-[10px]">Aproveitamento</span>
            <span className="text-lg font-black">{data.porcentagem.toFixed(1)}%</span>
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

const RegionalRanking = ({ data }) => {
  const chartData = data.slice(0, 10);

  return (
    <div className="glass-panel p-6 flex flex-col h-full card-hover border border-[var(--border-color)]">
      <div className="mb-6">
          <h3 className="text-xs font-bold text-[var(--text-muted)] heading-text uppercase tracking-widest mb-1">Performance</h3>
          <p className="text-xl font-black text-[var(--text-main)]">Ranking Regional</p>
      </div>
      
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 60, left: -20, bottom: 0 }}>
            <defs>
               <linearGradient id="rankingGradient" x1="0" y1="0" x2="1" y2="0">
                 <stop offset="0%" stopColor="var(--brand-500)" stopOpacity={0.9} />
                 <stop offset="100%" stopColor="var(--brand-400)" stopOpacity={1} />
               </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} opacity={0.5} />
            <XAxis type="number" hide domain={[0, 'dataMax + 20']} />
            <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={120} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--brand-500)', opacity: 0.05 }} />
            
            <Bar dataKey="porcentagem" radius={[0, 6, 6, 0]} barSize={24}>
               {chartData.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill="url(#rankingGradient)" />
               ))}
               <LabelList dataKey="porcentagem" content={<CustomizedLabel />} />
            </Bar>

            <ReferenceLine x={100} stroke="var(--brand-500)" strokeDasharray="3 3" opacity={0.5} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RegionalRanking;
