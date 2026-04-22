import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 rounded-2xl shadow-2xl text-xs z-50 backdrop-blur-md">
        <p className="font-black text-[var(--text-main)] mb-2 uppercase tracking-widest border-b border-[var(--border-color)] pb-2">Dia {label}</p>
        <div className="pt-1">
            <span className="text-brand-600 dark:text-brand-400 font-black text-sm">{formatter.format(payload[0].value)}</span>
        </div>
      </div>
    );
  }
  return null;
};

const DailyPerformance = ({ data }) => {
  return (
    <div className="glass-panel p-6 flex flex-col h-full card-hover border border-[var(--border-color)]">
      <div className="mb-6">
          <h3 className="text-xs font-bold text-[var(--text-muted)] heading-text uppercase tracking-widest mb-1">Ritmo Mensal</h3>
          <p className="text-xl font-black text-[var(--text-main)]">Entradas Diárias</p>
      </div>
      
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
               <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="0%" stopColor="var(--brand-400)" stopOpacity={1} />
                 <stop offset="100%" stopColor="var(--brand-500)" stopOpacity={0.9} />
               </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
            <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--brand-500)', opacity: 0.05 }} />
            <Bar dataKey="realizado" radius={[4, 4, 0, 0]}>
               {data.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill="url(#barGradient)" />
               ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DailyPerformance;
