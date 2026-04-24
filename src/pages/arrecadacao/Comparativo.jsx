import { useOutletContext } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useArrecadacaoComparativo } from '../../hooks/useArrecadacaoComparativo';
import { TrendingUp, Calendar, TrendingDown } from 'lucide-react';

const CustomTooltipMonthly = ({ active, payload, label, currentYear, previousYear }) => {
  if (active && payload && payload.length) {
    const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const dataAtual = payload.find(p => p.dataKey === 'atual')?.value || 0;
    const dataAnterior = payload.find(p => p.dataKey === 'anterior')?.value || 0;
    const isGrowth = dataAtual >= dataAnterior;
    const variacao = dataAnterior > 0 ? ((dataAtual - dataAnterior) / dataAnterior) * 100 : 0;

    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 rounded-2xl shadow-2xl min-w-[220px] z-50 backdrop-blur-md">
        <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3 mb-3">
          <p className="font-black text-[var(--text-main)] uppercase tracking-widest text-[10px] flex items-center gap-1.5">
            <Calendar size={12} className="text-brand-500" />
            {label}
          </p>
          <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${isGrowth ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {isGrowth ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%
          </div>
        </div>
        <div className="space-y-3">
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">{currentYear}</span>
                <span className="font-black text-xl text-[var(--text-main)]">{formatter.format(dataAtual)}</span>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{previousYear}</span>
                <span className="font-black text-sm text-[var(--text-muted)]">{formatter.format(dataAnterior)}</span>
            </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomTooltipVariation = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const isGrowth = value >= 0;
    
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 rounded-2xl shadow-2xl min-w-[180px] z-50 backdrop-blur-md">
        <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3 mb-3">
          <p className="font-black text-[var(--text-main)] uppercase tracking-widest text-[10px]">
            {label}
          </p>
        </div>
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Variação YoY</span>
            <span className={`font-black text-2xl ${isGrowth ? 'text-emerald-500' : 'text-rose-500'}`}>
                {value > 0 ? '+' : ''}{value.toFixed(2)}%
            </span>
        </div>
      </div>
    );
  }
  return null;
};

const Comparativo = () => {
  const { referencia, regional } = useOutletContext();
  const { currentYear, previousYear, chartData, loading } = useArrecadacaoComparativo(referencia, regional);

  if (loading) {
    return <div className="h-96 flex items-center justify-center animate-pulse text-brand-500 font-bold">Carregando comparativo...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Cards de Resumo YoY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="glass-panel p-6 border border-brand-500/20 relative overflow-hidden group hover:border-brand-500/40 transition-colors">
            <div className="absolute -right-4 -bottom-4 text-brand-500/5 group-hover:scale-110 transition-transform duration-500">
               <TrendingUp size={120} />
            </div>
            <div className="relative z-10">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-500 mb-2 block">Crescimento Anual</span>
               <h3 className="text-3xl font-black heading-text text-[var(--text-main)]">Análise {currentYear} vs {previousYear}</h3>
               <p className="text-sm text-[var(--text-muted)] font-medium mt-2">Comparativo consolidado de arrecadação por mês de pagamento.</p>
            </div>
         </div>
         <div className="glass-panel p-6 border border-emerald-500/20 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2 block relative z-10">Referência Selecionada</span>
            <div className="flex items-center gap-4 relative z-10">
               <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <Calendar size={24} />
               </div>
               <div>
                  <h4 className="text-2xl font-black text-[var(--text-main)]">{referencia}</h4>
                  <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">{regional}</p>
               </div>
            </div>
         </div>
      </div>

      {/* Gráfico de Barras Lado a Lado */}
      <div className="glass-panel p-6 md:p-8 border border-[var(--border-color)] relative overflow-hidden">
         <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none"></div>
         <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 relative z-10">
            <div>
               <h3 className="text-lg font-black heading-text text-[var(--text-main)]">Comparativo Mensal Arrecadação</h3>
               <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">Valores em R$ (Milhões)</p>
            </div>
            <div className="flex items-center gap-6 bg-[var(--bg-main)] px-4 py-2 rounded-xl border border-[var(--border-color)]">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  <span className="text-[10px] font-black text-[var(--text-main)] uppercase">{currentYear}</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--border-color)]"></div>
                  <span className="text-[10px] font-black text-[var(--text-muted)] uppercase">{previousYear}</span>
               </div>
            </div>
         </div>

         <div className="h-[400px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="barBrandGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--brand-400)" stopOpacity={1} />
                      <stop offset="50%" stopColor="var(--brand-500)" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="var(--brand-600)" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.4} />
                  <XAxis 
                     dataKey="month" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }} 
                     tickMargin={10}
                  />
                  <YAxis 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }}
                     tickFormatter={(val) => `R$${(val/1000000).toFixed(0)}M`}
                     tickMargin={10}
                     width={45}
                  />
                  <Tooltip 
                     cursor={{ fill: 'var(--bg-main)', opacity: 0.4 }}
                     content={<CustomTooltipMonthly currentYear={currentYear} previousYear={previousYear} />}
                  />
                  <Bar dataKey="anterior" fill="var(--border-color)" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1500} />
                  <Bar dataKey="atual" fill="url(#barBrandGradient)" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1500} className="hover:brightness-110 transition-all" />
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Gráfico de Variação % */}
      <div className="glass-panel p-6 md:p-8 border border-[var(--border-color)] relative overflow-hidden">
         <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
         <h3 className="text-lg font-black heading-text text-[var(--text-main)] mb-8 relative z-10">Variação Percentual YoY (%)</h3>
         <div className="h-[250px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.4} />
                  <XAxis 
                     dataKey="month" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }} 
                     tickMargin={10}
                  />
                  <YAxis 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }}
                     tickFormatter={(val) => `${val}%`}
                     tickMargin={10}
                     width={45}
                  />
                  <Tooltip 
                     cursor={{ fill: 'var(--brand-500)', opacity: 0.05 }}
                     content={<CustomTooltipVariation />}
                  />
                  <Bar dataKey="variacao" radius={[6, 6, 6, 6]} barSize={30} animationDuration={1500}>
                     {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.variacao >= 0 ? '#10b981' : '#f43f5e'} className="hover:brightness-110 transition-all" />
                     ))}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

    </div>
  );
};

export default Comparativo;
