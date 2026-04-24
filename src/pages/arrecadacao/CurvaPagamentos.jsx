import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useArrecadacaoCurva, useMesesDisponiveis } from '../../hooks/useArrecadacaoCurva';
import { Activity, TrendingDown, TrendingUp, ChevronDown, Calculator } from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const formatCompact = (val) => {
  if (Math.abs(val) >= 1e6) return `R$${(val/1e6).toFixed(1)}M`;
  if (Math.abs(val) >= 1e3) return `R$${(val/1e3).toFixed(0)}K`;
  return `R$${val.toFixed(0)}`;
};

const CustomTooltip = ({ active, payload, mes1Label, mes2Label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] shadow-2xl min-w-[240px] z-50 backdrop-blur-md">
      <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3 mb-3">
        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
          <Activity size={12} className="text-brand-500" />
          Dia {d.dia}
        </p>
        {d.percentual > 0 && (
            <div className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500">
              {d.percentual.toFixed(1)}% Pag
            </div>
        )}
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">{mes1Label || 'Mês 1'}</span>
          <span className="text-sm font-black text-[var(--text-main)]">{formatCurrency(d.pagMes1)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{mes2Label || 'Mês 2'}</span>
          <span className="text-sm font-black text-[var(--text-main)]">{formatCurrency(d.pagMes2)}</span>
        </div>
        <div className="border-t border-[var(--border-color)] pt-2 flex justify-between items-center">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Gap</span>
          <span className={`text-sm font-black ${d.gap >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {d.gap > 0 ? '+' : ''}{formatCurrency(d.gap)}
          </span>
        </div>
      </div>
    </div>
  );
};

const CurvaPagamentos = () => {
  const { referencia, regional } = useOutletContext();
  const meses = useMesesDisponiveis();

  // Default mes1 = referencia do header, mes2 = mês anterior
  const [mes1, setMes1] = useState('');
  const [mes2, setMes2] = useState('');

  // Derive defaults from referencia
  const effectiveMes1 = mes1 || referencia;
  const effectiveMes2 = mes2 || (() => {
    if (!referencia) return '';
    const [m, y] = referencia.split('/');
    const mi = parseInt(m);
    const yi = parseInt(y);
    if (mi === 1) return `12/${yi - 1}`;
    return `${String(mi - 1).padStart(2, '0')}/${y}`;
  })();

  const { totalMes1, totalMes2, percentualGeral, gapTotal, curva, loading } = useArrecadacaoCurva(effectiveMes1, effectiveMes2, regional);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-200 dark:border-brand-900/30 border-t-brand-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm font-bold text-[var(--text-muted)] animate-pulse">Calculando curva de recebimento...</p>
        </div>
      </div>
    );
  }

  // Calculate Average Payment for Month 1 and Month 2
  const diasComPagamento = curva.filter(d => d.pagMes1 > 0).length || 1;
  const mediaDiariaMes1 = totalMes1 / diasComPagamento;
  
  const diasComPagamentoMes2 = curva.filter(d => d.pagMes2 > 0).length || 1;
  const mediaDiariaMes2 = totalMes2 / diasComPagamentoMes2;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header with Filters */}
      <div className="glass-panel p-5 border border-[var(--border-color)] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h3 className="text-xl font-black heading-text text-[var(--text-main)]">Curva de Recebimento</h3>
            <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">Comparativo diário de pagamentos entre dois meses</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Month 1 Selector */}
            <div className="relative">
              <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-brand-500 mb-1">Mês 1</label>
              <div className="relative">
                <select
                  value={mes1 || effectiveMes1}
                  onChange={(e) => setMes1(e.target.value)}
                  className="appearance-none bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2 pr-8 text-sm font-bold text-[var(--text-main)] cursor-pointer hover:border-brand-500/50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  {meses.map(m => <option key={m} value={m}>{m}</option>)}
                  {!meses.includes(effectiveMes1) && <option value={effectiveMes1}>{effectiveMes1}</option>}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              </div>
            </div>

            <span className="text-[var(--text-muted)] font-black text-lg mt-4">vs</span>

            {/* Month 2 Selector */}
            <div className="relative">
              <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1">Mês 2</label>
              <div className="relative">
                <select
                  value={mes2 || effectiveMes2}
                  onChange={(e) => setMes2(e.target.value)}
                  className="appearance-none bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2 pr-8 text-sm font-bold text-[var(--text-main)] cursor-pointer hover:border-emerald-500/50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {meses.map(m => <option key={m} value={m}>{m}</option>)}
                  {!meses.includes(effectiveMes2) && <option value={effectiveMes2}>{effectiveMes2}</option>}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Row - Adjusted to 6 columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-panel p-5 border border-brand-500/20 group hover:border-brand-500/50 transition-colors">
          <div className="flex items-center gap-2 text-brand-500 mb-2">
            <Activity size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Pag. ({effectiveMes1})</span>
          </div>
          <h4 className="text-xl font-black heading-text text-[var(--text-main)]">{formatCurrency(totalMes1)}</h4>
        </div>

        <div className="glass-panel p-5 border border-emerald-500/20 group hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <Activity size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Pag. ({effectiveMes2})</span>
          </div>
          <h4 className="text-xl font-black heading-text text-[var(--text-main)]">{formatCurrency(totalMes2)}</h4>
        </div>

        <div className="glass-panel p-5 border border-amber-500/20 group hover:border-amber-500/50 transition-colors">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <TrendingUp size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">% Pag {effectiveMes1} / {effectiveMes2}</span>
          </div>
          <h4 className="text-xl font-black heading-text text-[var(--text-main)]">{percentualGeral.toFixed(2)}%</h4>
        </div>

        <div className={`glass-panel p-5 border ${gapTotal >= 0 ? 'border-emerald-500/20 hover:border-emerald-500/50' : 'border-rose-500/20 hover:border-rose-500/50'} transition-colors`}>
          <div className={`flex items-center gap-2 ${gapTotal >= 0 ? 'text-emerald-500' : 'text-rose-500'} mb-2`}>
            {gapTotal >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span className="text-[9px] font-black uppercase tracking-widest">Gap Total</span>
          </div>
          <h4 className={`text-xl font-black heading-text ${gapTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(gapTotal)}
          </h4>
        </div>

        {/* New KPI: Média de Pagamento */}
        <div className="glass-panel p-5 border border-[var(--border-color)] group hover:border-brand-500/30 transition-colors">
          <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2 group-hover:text-brand-500 transition-colors">
            <Calculator size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Média {effectiveMes1}</span>
          </div>
          <h4 className="text-xl font-black heading-text text-[var(--text-main)]">{formatCurrency(mediaDiariaMes1)}</h4>
        </div>

        {/* New KPI: Média de Pagamento Mês 2 */}
        <div className="glass-panel p-5 border border-[var(--border-color)] group hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2 group-hover:text-emerald-500 transition-colors">
            <Calculator size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Média {effectiveMes2}</span>
          </div>
          <h4 className="text-xl font-black heading-text text-[var(--text-main)]">{formatCurrency(mediaDiariaMes2)}</h4>
        </div>
      </div>

      {/* Main Curve Chart - Accumulated */}
      <div className="glass-panel p-6 md:p-8 border border-[var(--border-color)] relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 relative z-10">
          <div>
            <h3 className="text-lg font-black heading-text text-[var(--text-main)]">Curva Acumulada de Pagamentos</h3>
            <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">Evolução diária acumulada</p>
          </div>
          <div className="flex items-center gap-6 bg-[var(--bg-main)] px-4 py-2 rounded-xl border border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
              <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-wider">{effectiveMes1}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">{effectiveMes2}</span>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={curva} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradMes1Premium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-500)" stopOpacity={0.3}/>
                  <stop offset="50%" stopColor="var(--brand-500)" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="var(--brand-500)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradMes2Premium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="50%" stopColor="#10b981" stopOpacity={0.05}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.4} />
              <XAxis 
                dataKey="dia" 
                axisLine={false} tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }}
                tickFormatter={(v) => `D${v}`}
                tickMargin={10}
              />
              <YAxis 
                axisLine={false} tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }}
                tickFormatter={formatCompact}
                tickMargin={10}
                width={45}
              />
              <Tooltip 
                content={<CustomTooltip mes1Label={effectiveMes1} mes2Label={effectiveMes2} />} 
                cursor={{ stroke: 'var(--brand-500)', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.3 }}
              />
              <Area 
                type="monotone" 
                dataKey="acumMes1" 
                stroke="var(--brand-500)" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#gradMes1Premium)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--brand-500)', className: "shadow-[0_0_10px_rgba(59,130,246,0.8)] drop-shadow-md" }}
                animationDuration={1500} 
              />
              <Area 
                type="monotone" 
                dataKey="acumMes2" 
                stroke="#10b981" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#gradMes2Premium)" 
                activeDot={false}
                animationDuration={1500} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gap Chart (Bar) */}
      <div className="glass-panel p-6 md:p-8 border border-[var(--border-color)] relative overflow-hidden">
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <h3 className="text-lg font-black heading-text text-[var(--text-main)] mb-8 relative z-10">Gap Diário de Pagamento</h3>
        <div className="h-[250px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={curva} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.4} />
              <XAxis 
                dataKey="dia" 
                axisLine={false} tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }}
                tickFormatter={(v) => `D${v}`}
                tickMargin={10}
              />
              <YAxis 
                axisLine={false} tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }}
                tickFormatter={formatCompact}
                tickMargin={10}
                width={45}
              />
              <Tooltip 
                 cursor={{ fill: 'var(--bg-main)', opacity: 0.4 }}
                 content={<CustomTooltip mes1Label={effectiveMes1} mes2Label={effectiveMes2} />} 
              />
              <Bar dataKey="gap" radius={[6, 6, 6, 6]} barSize={20} animationDuration={1500}>
                {curva.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.gap >= 0 ? '#10b981' : '#f43f5e'} className="hover:brightness-110 transition-all" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-panel border border-[var(--border-color)] overflow-hidden">
        <div className="p-6 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-black heading-text text-[var(--text-main)]">Detalhamento Diário</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--bg-main)]">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Dia</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-brand-500">Pag. {effectiveMes1}</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-emerald-500">Pag. {effectiveMes2}</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-amber-500">% Pag</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Gap</th>
              </tr>
            </thead>
            <tbody>
              {curva.map((row) => (
                <tr key={row.dia} className="border-t border-[var(--border-color)] hover:bg-brand-500/5 transition-colors">
                  <td className="px-6 py-3 font-black text-[var(--text-main)]">{row.dia}</td>
                  <td className="px-6 py-3 text-right font-bold text-[var(--text-main)] tabular-nums">{formatCurrency(row.pagMes1)}</td>
                  <td className="px-6 py-3 text-right font-bold text-[var(--text-main)] tabular-nums">{formatCurrency(row.pagMes2)}</td>
                  <td className="px-6 py-3 text-right font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {row.percentual > 0 ? `${row.percentual.toFixed(2)}%` : '—'}
                  </td>
                  <td className={`px-6 py-3 text-right font-black tabular-nums ${row.gap >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatCurrency(row.gap)}
                  </td>
                </tr>
              ))}
              {/* Totals Row */}
              <tr className="border-t-2 border-[var(--border-color)] bg-[var(--bg-main)] font-black">
                <td className="px-6 py-4 text-[var(--text-main)]">Total</td>
                <td className="px-6 py-4 text-right text-[var(--text-main)] tabular-nums">{formatCurrency(totalMes1)}</td>
                <td className="px-6 py-4 text-right text-[var(--text-main)] tabular-nums">{formatCurrency(totalMes2)}</td>
                <td className="px-6 py-4 text-right text-amber-600 dark:text-amber-400 tabular-nums">{percentualGeral.toFixed(2)}%</td>
                <td className={`px-6 py-4 text-right tabular-nums ${gapTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatCurrency(gapTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default CurvaPagamentos;
