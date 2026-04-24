import { useOutletContext, NavLink } from 'react-router-dom';
import { Database, Sparkles, AlertCircle, Calendar, Target, TrendingUp } from 'lucide-react';
import GaugeChart from '../components/GaugeChart';
import { useCortesData } from '../hooks/useCortesData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatterMoney = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatterNumber = new Intl.NumberFormat('pt-BR');

const OldKpiCard = ({ title, data, isCurrency = true }) => {
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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataEmitido = payload.find(p => p.dataKey === 'emitido')?.value || 0;
    const dataExecutado = payload.find(p => p.dataKey === 'executado')?.value || 0;
    const pct = dataEmitido > 0 ? (dataExecutado / dataEmitido) * 100 : 0;
    
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 rounded-2xl shadow-2xl min-w-[220px] z-50 backdrop-blur-md">
        <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3 mb-3">
          <p className="font-black text-[var(--text-muted)] uppercase tracking-widest text-[10px] flex items-center gap-1.5">
            <Calendar size={12} className="text-brand-500" />
            Data: {label ? label.split('-').reverse().join('/') : ''}
          </p>
          <div className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-brand-500/10 text-brand-500">
            {pct.toFixed(1)}% Exec
          </div>
        </div>
        
        <div className="space-y-3">
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-400"></div> Emitido
                </span>
                <span className="font-black text-lg text-[var(--text-main)]">{formatterNumber.format(dataEmitido)}</span>
            </div>
            
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-brand-500"></div> Executado
                </span>
                <span className="font-black text-xl text-brand-500">{formatterNumber.format(dataExecutado)}</span>
            </div>
        </div>
      </div>
    );
  }
  return null;
};

const Cortes = () => {
  const { referencia, regional: selectedRegional } = useOutletContext();
  const { metrics, dailyData, regionalData, loading, error } = useCortesData(referencia, selectedRegional);

  if (loading) {
      return (
          <div className="w-full h-[70vh] flex flex-col items-center justify-center">
             <div className="relative">
                <div className="w-16 h-16 border-4 border-brand-200 dark:border-brand-900/30 border-t-brand-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-brand-500">
                    <Sparkles size={20} className="animate-pulse" />
                </div>
             </div>
             <p className="mt-6 text-lg font-bold heading-text text-[var(--text-main)] animate-pulse">Calculando métricas de cortes...</p>
          </div>
      )
  }

  if (error) {
    return (
      <div className="w-full h-[70vh] flex flex-col items-center justify-center">
        <div className="bg-red-500/10 p-6 rounded-3xl mb-8">
            <AlertCircle size={64} className="text-red-500" />
        </div>
        <h2 className="text-3xl font-black heading-text text-[var(--text-main)] mb-3">Erro ao carregar dados</h2>
        <p className="text-[var(--text-muted)] text-lg">{error}</p>
      </div>
    );
  }

  // Check if system is empty
  if (metrics.totalEmissao === 0 && metrics.totalCorte === 0 && regionalData.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[70vh] glass-panel p-12 max-w-2xl mx-auto text-center border border-[var(--border-color)]">
              <div className="bg-brand-500/10 p-6 rounded-3xl mb-8">
                <Database size={64} className="text-brand-500" />
              </div>
              <h2 className="text-3xl font-black heading-text text-[var(--text-main)] mb-3 tracking-tight">Sem dados de Cortes</h2>
              <p className="text-[var(--text-muted)] mb-10 max-w-md text-lg leading-relaxed">Não há dados de cortes para o período selecionado ou a planilha fcorte.csv ainda não foi importada.</p>
              <NavLink 
                 to="/importar" 
                 className="px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black transition-all shadow-xl shadow-brand-500/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                  Ir para Importação de Dados
              </NavLink>
          </div>
      );
  }

  return (
    <div className="flex flex-col gap-8 w-full pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* KPI Cards Row */}
      <div className="glass-panel p-4 md:p-6 mb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <OldKpiCard 
             title="% Corte" 
             data={{ realizado: metrics.totalCorte, previsto: metrics.totalEmissao }} 
             isCurrency={false}
           />
           <OldKpiCard 
             title="% Recebido Antes" 
             data={{ realizado: metrics.valorPagoAntes, previsto: metrics.valorCobrado }} 
           />
           <OldKpiCard 
             title="% Recebido Pós Corte" 
             data={{ realizado: metrics.valorPagoApos, previsto: metrics.valorCobradoCortado }} 
           />
           <OldKpiCard 
             title="% Recebido Total" 
             data={{ realizado: metrics.valorPago, previsto: metrics.valorCobrado }} 
           />
        </div>
      </div>

      {/* Main Chart */}
      <div className="glass-panel p-6 border border-[var(--border-color)] min-h-[400px] relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
               <h3 className="text-lg font-black heading-text text-[var(--text-main)] uppercase tracking-tight">Evolução Diária</h3>
               <p className="text-sm font-medium text-[var(--text-muted)]">Comparativo entre Ordens Emitidas e Cortes Executados.</p>
            </div>
            <div className="flex items-center gap-6 bg-[var(--bg-main)] px-4 py-2 rounded-xl border border-[var(--border-color)]">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                  <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">Emitido</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-wider">Executado</span>
               </div>
            </div>
        </div>

        <div className="h-[320px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorEmitidoPremium" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                     <stop offset="50%" stopColor="#94a3b8" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorExecutadoPremium" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="var(--brand-500)" stopOpacity={0.4}/>
                     <stop offset="50%" stopColor="var(--brand-500)" stopOpacity={0.15}/>
                     <stop offset="95%" stopColor="var(--brand-500)" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.4} />
                 <XAxis 
                   dataKey="data" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }}
                   tickFormatter={(val) => val ? val.split('-').reverse().slice(0,2).join('/') : ''}
                   dy={10}
                 />
                 <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }}
                 />
                 <Tooltip 
                   content={<CustomTooltip />}
                   cursor={{ stroke: 'var(--brand-500)', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.3 }}
                 />
                 <Area 
                    type="monotone" 
                    dataKey="emitido" 
                    name="Emitido" 
                    stroke="#94a3b8" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorEmitidoPremium)" 
                    activeDot={false}
                    animationDuration={1500} 
                 />
                 <Area 
                    type="monotone" 
                    dataKey="executado" 
                    name="Executado" 
                    stroke="var(--brand-500)" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorExecutadoPremium)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--brand-500)', className: "shadow-[0_0_10px_rgba(59,130,246,0.8)] drop-shadow-md" }}
                    animationDuration={1500} 
                 />
               </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Detail Table */}
      <div className="space-y-4">
         <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-brand-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
            <h3 className="text-lg font-black heading-text text-[var(--text-main)]">Resumo por Regional</h3>
         </div>
         
         <div className="glass-panel border border-[var(--border-color)] overflow-hidden rounded-3xl">
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-[var(--bg-main)]/50 border-b border-[var(--border-color)]">
                      <th className="p-4 md:p-5 text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">Regional</th>
                      <th className="p-4 md:p-5 text-xs font-black text-[var(--text-muted)] uppercase tracking-wider text-right">Emitido</th>
                      <th className="p-4 md:p-5 text-xs font-black text-[var(--text-muted)] uppercase tracking-wider text-right">Cortado</th>
                      <th className="p-4 md:p-5 text-xs font-black text-[var(--text-muted)] uppercase tracking-wider text-right">% Corte</th>
                      <th className="p-4 md:p-5 text-xs font-black text-[var(--text-muted)] uppercase tracking-wider text-right">Valor Cobrado</th>
                      <th className="p-4 md:p-5 text-xs font-black text-[var(--text-muted)] uppercase tracking-wider text-right">Valor Pago</th>
                      <th className="p-4 md:p-5 text-xs font-black text-[var(--text-muted)] uppercase tracking-wider text-right">% Recebido</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                   {regionalData.map((row, i) => {
                      const pctCorte = row.emitido > 0 ? (row.executado / row.emitido) * 100 : 0;
                      const pctRecebido = row.valorCobrado > 0 ? (row.valorPago / row.valorCobrado) * 100 : 0;
                      
                      return (
                         <tr key={i} className="hover:bg-brand-500/5 transition-colors group">
                            <td className="p-4 md:p-5 font-bold text-[var(--text-main)]">{row.regional}</td>
                            <td className="p-4 md:p-5 font-bold text-slate-500 dark:text-slate-400 text-right">{formatterNumber.format(row.emitido)}</td>
                            <td className="p-4 md:p-5 font-black text-brand-600 dark:text-brand-400 text-right">{formatterNumber.format(row.executado)}</td>
                            <td className="p-4 md:p-5 font-bold text-[var(--text-main)] text-right">
                               <div className="flex items-center justify-end gap-2">
                                  <span>{pctCorte.toFixed(1)}%</span>
                                  <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
                                     <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(100, pctCorte)}%` }}></div>
                                  </div>
                               </div>
                            </td>
                            <td className="p-4 md:p-5 font-bold text-slate-500 dark:text-slate-400 text-right">{formatterMoney.format(row.valorCobrado)}</td>
                            <td className="p-4 md:p-5 font-black text-emerald-600 dark:text-emerald-400 text-right">{formatterMoney.format(row.valorPago)}</td>
                            <td className="p-4 md:p-5 font-bold text-[var(--text-main)] text-right">
                               <div className="flex items-center justify-end gap-2">
                                  <span>{pctRecebido.toFixed(1)}%</span>
                                  <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
                                     <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, pctRecebido)}%` }}></div>
                                  </div>
                               </div>
                            </td>
                         </tr>
                      );
                   })}
                   
                   {/* Total Row */}
                   {regionalData.length > 0 && (
                     <tr className="bg-[var(--bg-main)] border-t-2 border-[var(--border-color)]">
                        <td className="p-4 md:p-5 font-black text-[var(--text-main)] uppercase">Total</td>
                        <td className="p-4 md:p-5 font-bold text-[var(--text-main)] text-right">{formatterNumber.format(metrics.totalEmissao)}</td>
                        <td className="p-4 md:p-5 font-black text-brand-600 dark:text-brand-400 text-right">{formatterNumber.format(metrics.totalCorte)}</td>
                        <td className="p-4 md:p-5 font-black text-[var(--text-main)] text-right">{metrics.pctCorte.toFixed(1)}%</td>
                        <td className="p-4 md:p-5 font-bold text-[var(--text-main)] text-right">{formatterMoney.format(metrics.valorCobrado)}</td>
                        <td className="p-4 md:p-5 font-black text-emerald-600 dark:text-emerald-400 text-right">{formatterMoney.format(metrics.valorPago)}</td>
                        <td className="p-4 md:p-5 font-black text-[var(--text-main)] text-right">{metrics.pctRecebidoTotal.toFixed(1)}%</td>
                     </tr>
                   )}
                </tbody>
             </table>
           </div>
         </div>
      </div>
    </div>
  );
};

export default Cortes;
