import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { ClipboardCheck, Sparkles, Building2, TrendingUp, Scissors, Target, MapPin, Database } from 'lucide-react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { useOSEncerradasData } from '../hooks/useOSEncerradasData';
import GaugeChart from '../components/GaugeChart';
import RegionalRanking from '../components/RegionalRanking';

const OSEncerradas = () => {
  const { referencia, regional, osFilters, setOsOptions } = useOutletContext();
  const { gauge, mesPrevisto, mesRealizado, mesGeradas, pendentesAnteriores, chartData, regionalRanking = [], loading } = useOSEncerradasData(referencia, regional, osFilters.responsavel, setOsOptions);

  const [mes, ano] = referencia.split('/');
  const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const monthLabel = MONTH_NAMES[parseInt(mes) - 1];

  if (loading) {
    return (
      <div className="w-full h-[70vh] flex flex-col items-center justify-center">
         <div className="relative">
            <div className="w-16 h-16 border-4 border-brand-200 dark:border-brand-900/30 border-t-brand-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-brand-500">
                <Sparkles size={20} className="animate-pulse" />
            </div>
         </div>
         <p className="mt-6 text-lg font-bold heading-text text-[var(--text-main)] animate-pulse">Calculando SLA...</p>
      </div>
    );
  }

  // Gauge calculations
  const totalMetaAnual = gauge.totalPrevisto; // 80% das geradas
  const realizadoAnual = gauge.realizado;
  const gaugeMaxValue = gauge.totalGeradas; // Total geradas
  const gaugePercent = gaugeMaxValue > 0 ? (realizadoAnual / totalMetaAnual) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Gauge Section */}
          <div className="glass-panel lg:col-span-4 p-6 border border-[var(--border-color)] relative overflow-hidden flex flex-col items-center justify-center min-h-[350px]">
             <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)] mb-2 text-center">SLA Acumulado ({ano})</h3>
             
             <div className="flex flex-col items-center justify-center py-4 transform hover:scale-105 transition-transform duration-500">
                <GaugeChart percent={gaugePercent} size={180} strokeWidth={24} />
             </div>
             
             <div className="w-full flex flex-col items-center gap-3 mt-4">
                 <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5 text-brand-500">
                       <TrendingUp size={14} />
                       <span className="text-[10px] font-bold uppercase tracking-wider">Realizado</span>
                    </div>
                    <span className="text-2xl font-black heading-text text-[var(--text-main)] tabular-nums leading-none mt-1">
                      {realizadoAnual.toLocaleString('pt-BR')}
                    </span>
                 </div>

                 <div className="w-12 h-[1px] bg-[var(--border-color)] my-1"></div>

                 <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                       <Target size={14} />
                       <span className="text-[10px] font-bold uppercase tracking-wider">Meta (80% Geradas)</span>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-main)] opacity-80 tabular-nums leading-none mt-1">
                      {totalMetaAnual.toLocaleString('pt-BR')} / {gaugeMaxValue.toLocaleString('pt-BR')}
                    </span>
                 </div>
             </div>
          </div>

          {/* KPI Section */}
          <div className="glass-panel lg:col-span-4 p-6 border border-[var(--border-color)] flex flex-col justify-center gap-8 min-h-[350px]">
              <div className="flex flex-col gap-6">
                 <div className="flex items-center gap-4 border-b border-[var(--border-color)] pb-6">
                    <div className="p-4 bg-slate-500/10 rounded-2xl text-slate-500">
                       <Database size={32} />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold text-[var(--text-muted)] uppercase">Total Gerado {monthLabel}</h4>
                       <span className="text-3xl font-black text-[var(--text-main)]">{(mesGeradas || 0).toLocaleString('pt-BR')}</span>
                    </div>
                 </div>

                 <div className="flex items-center gap-4 border-b border-[var(--border-color)] pb-6">
                    <div className="p-4 bg-brand-500/10 rounded-2xl text-brand-500">
                       <TrendingUp size={32} />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-tight">Meta (80%) {monthLabel}</h4>
                       <span className="text-3xl font-black text-brand-500">{mesPrevisto.toLocaleString('pt-BR')}</span>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-4 border-b border-[var(--border-color)] pb-6">
                    <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500">
                       <ClipboardCheck size={32} />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-tight">Realizado {monthLabel}</h4>
                       <span className="text-3xl font-black text-emerald-500">{mesRealizado.toLocaleString('pt-BR')}</span>
                    </div>
                 </div>

                 <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">OS Pendentes Anos Anteriores:</span>
                    <span className="text-2xl font-black text-rose-500 bg-rose-500/10 px-6 py-2 rounded-2xl">
                        {pendentesAnteriores.toLocaleString('pt-BR')}
                    </span>
                 </div>
              </div>
          </div>

          {/* Regional Ranking */}
          <div className="lg:col-span-4 h-full min-h-[350px]">
             {regional === 'TODAS' ? (
                <RegionalRanking data={regionalRanking} />
             ) : (
                <div className="glass-panel h-full p-6 border border-[var(--border-color)] flex flex-col items-center justify-center text-center">
                    <MapPin size={48} className="text-[var(--text-muted)] opacity-20 mb-4" />
                    <h3 className="text-lg font-black text-[var(--text-main)] heading-text uppercase">{regional}</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-2 font-bold uppercase tracking-wider">Regional Selecionada</p>
                </div>
             )}
          </div>

      </div>

      {/* Bar Chart Section */}
      <div className="glass-panel p-6 border border-[var(--border-color)] relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-lg font-black uppercase tracking-widest text-[var(--text-main)]">
                Ordens de Serviços Geral ({ano})
             </h3>
             <div className="flex gap-4">
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 border-2 border-[var(--border-color)]"></div>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Geradas</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-emerald-500"></div>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">No Prazo (SLA)</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-4 border-t-2 border-dashed border-brand-500"></div>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Meta (80%)</span>
                </div>
             </div>
          </div>
          
          <div className="h-[400px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barGap={-40}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.4} />
                   <XAxis 
                      dataKey="mes" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }}
                      tickFormatter={(v) => v.substring(0, 3).toUpperCase()}
                   />
                   <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }}
                      tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(value)
                      }
                   />
                   <RechartsTooltip 
                      cursor={{ fill: 'var(--bg-main)', opacity: 0.4 }}
                      content={({ active, payload, label }) => {
                         if (active && payload && payload.length) {
                            return (
                               <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 rounded-2xl shadow-xl min-w-[200px] backdrop-blur-md">
                                  <p className="text-xs font-black uppercase tracking-widest text-[var(--text-main)] mb-3 border-b border-[var(--border-color)] pb-2">{label}</p>
                                  {payload.map((entry, idx) => {
                                      const labelText = entry.name === 'geradas' ? 'Total Geradas' : entry.name === 'noPrazo' ? 'Realizado (No Prazo)' : 'Meta (80%)';
                                      const textColor = entry.name === 'noPrazo' ? '#10b981' : entry.name === 'meta' ? 'var(--brand-500)' : 'var(--text-muted)';
                                      return (
                                         <div key={idx} className="flex justify-between items-center my-1 gap-4">
                                            <span className="text-[10px] font-bold uppercase" style={{ color: textColor }}>
                                               {labelText}
                                            </span>
                                            <span className="text-sm font-black tabular-nums text-[var(--text-main)]">
                                               {entry.value.toLocaleString('pt-BR')}
                                            </span>
                                         </div>
                                      );
                                  })}
                               </div>
                            );
                         }
                         return null;
                      }}
                   />
                   
                   {/* Background Bar representing Total OS Generated */}
                   <Bar 
                      dataKey="geradas" 
                      fill="transparent" 
                      stroke="var(--border-color)" 
                      strokeWidth={2}
                      radius={[4, 4, 0, 0]} 
                      barSize={40} 
                   />
                   
                   {/* Foreground Bar representing OS within SLA */}
                   <Bar 
                      dataKey="noPrazo" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]} 
                      barSize={40} 
                      animationDuration={1500}
                   />
                   
                   {/* Meta Line */}
                   <Line 
                      type="monotone" 
                      dataKey="meta" 
                      stroke="var(--brand-500)" 
                      strokeWidth={3} 
                      strokeDasharray="5 5" 
                      dot={false}
                   />
                </ComposedChart>
             </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};

export default OSEncerradas;
