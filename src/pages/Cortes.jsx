import { useOutletContext, NavLink } from 'react-router-dom';
import { Database, Sparkles, AlertCircle } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import { useCortesData } from '../hooks/useCortesData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const formatterMoney = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatterNumber = new Intl.NumberFormat('pt-BR');

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
    <div className="flex flex-col gap-8 w-full pb-10">
      
      {/* KPI Cards Row */}
      <div className="glass-panel p-4 md:p-6 mb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <KpiCard 
             title="% Corte" 
             data={{ realizado: metrics.totalCorte, previsto: metrics.totalEmissao }} 
             isCurrency={false}
           />
           <KpiCard 
             title="% Recebido Antes" 
             data={{ realizado: metrics.valorPagoAntes, previsto: metrics.valorCobrado }} 
           />
           <KpiCard 
             title="% Recebido Pós Corte" 
             data={{ realizado: metrics.valorPagoApos, previsto: metrics.valorCobradoCortado }} 
           />
           <KpiCard 
             title="% Recebido Total" 
             data={{ realizado: metrics.valorPago, previsto: metrics.valorCobrado }} 
           />
        </div>
      </div>

      {/* Main Chart */}
      <div className="glass-panel p-6 border border-[var(--border-color)] min-h-[400px]">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h3 className="text-lg font-black heading-text text-[var(--text-main)] uppercase tracking-tight">Evolução Diária</h3>
               <p className="text-sm font-medium text-[var(--text-muted)]">Comparativo entre Ordens Emitidas e Cortes Executados.</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase">Emitido</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-brand-500"></div>
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase">Executado</span>
               </div>
            </div>
        </div>

        <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorEmitido" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorExecutado" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                 <XAxis 
                   dataKey="data" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}
                   tickFormatter={(val) => val ? val.split('-').reverse().slice(0,2).join('/') : ''}
                   dy={10}
                 />
                 <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}
                 />
                 <Tooltip 
                   contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: '1rem', color: 'var(--text-main)', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                   itemStyle={{ color: 'var(--text-main)' }}
                   labelFormatter={(val) => `Data: ${val ? val.split('-').reverse().join('/') : ''}`}
                 />
                 <Area type="monotone" dataKey="emitido" name="Emitido" stroke="#94a3b8" strokeWidth={3} fillOpacity={1} fill="url(#colorEmitido)" activeDot={{ r: 6, fill: '#94a3b8' }} />
                 <Area type="monotone" dataKey="executado" name="Executado" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorExecutado)" activeDot={{ r: 6, fill: '#0ea5e9', stroke: 'white', strokeWidth: 2 }} />
               </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Detail Table */}
      <div className="space-y-4">
         <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-brand-500 rounded-full"></div>
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
                         <tr key={i} className="hover:bg-[var(--bg-main)]/30 transition-colors group">
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
