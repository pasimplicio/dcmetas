import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Landmark, CreditCard, Users } from 'lucide-react';

const COLORS = ['#0EA5E9', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-4 border border-[var(--border-color)] shadow-xl animate-in fade-in zoom-in duration-200">
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-500"></div>
          <p className="text-sm font-black text-[var(--text-main)]">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value)}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const DistributionChart = ({ data, title, icon: Icon, color = '#0EA5E9' }) => {
  return (
    <div className="glass-panel p-8 border border-[var(--border-color)] hover:border-brand-500/30 transition-all group h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-brand-500/10 p-3 rounded-2xl text-brand-600 dark:text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-all duration-500">
            <Icon size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-[var(--text-main)] heading-text tracking-tight uppercase">{title}</h3>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Distribuição por volume</p>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.slice(0, 8)}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={120}
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(14, 165, 233, 0.05)' }} />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DistributionChart;
