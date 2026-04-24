import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  ClipboardList, 
  TrendingUp, 
  Search,
  Download,
  Clock,
  LayoutGrid,
  Building2,
  CalendarDays,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell
} from 'recharts';

import api from '../services/api.js';

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 rounded-2xl shadow-2xl min-w-[200px] z-50 backdrop-blur-md">
        <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3 mb-3">
          <p className="font-black text-[var(--text-muted)] uppercase tracking-widest text-[10px] flex items-center gap-1.5">
            <CalendarDays size={12} className="text-brand-500" />
            Data: {label && label !== 'S/D' ? label.split('-').reverse().join('/') : label}
          </p>
        </div>
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-brand-500"></div> Total Pendentes
            </span>
            <span className="font-black text-xl text-[var(--text-main)]">{d.value}</span>
        </div>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label, color, title }) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 rounded-2xl shadow-2xl min-w-[240px] z-50 backdrop-blur-md">
        <div className="border-b border-[var(--border-color)] pb-3 mb-3">
          <p className="font-black text-[var(--text-muted)] uppercase tracking-widest text-[10px] flex items-center gap-1.5 line-clamp-2">
            {title === 'setor' ? <Building2 size={12} style={{color}} /> : <LayoutGrid size={12} style={{color}} />}
            {label}
          </p>
        </div>
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{color}}>
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: color}}></div> Total Pendentes
            </span>
            <span className="font-black text-xl text-[var(--text-main)]">{d.value}</span>
        </div>
      </div>
    );
  }
  return null;
};

const OSPendentes = () => {
  const { 
    referencia, 
    regional: globalRegional, 
    osFilters, 
    setOsOptions 
  } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [mes, ano] = referencia.split('/');

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await api.get('/os/pendentes', {
        regional: globalRegional,
        responsavel: osFilters.responsavel,
        setor: osFilters.setor,
        ano: ano,
        mes: mes,
        numero_os: searchTerm
      });
      setData(result);
      
      if (result.filterOptions) {
        setOsOptions({
          responsaveis: result.filterOptions.responsaveis,
          setores: result.filterOptions.setores
        });
      }
    } catch (err) {
      console.error('Erro ao buscar dados de OS:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    api.download('/os/pendentes/export', {
      regional: globalRegional,
      responsavel: osFilters.responsavel,
      setor: osFilters.setor,
      ano: ano,
      mes: mes,
      numero_os: searchTerm
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [globalRegional, osFilters, referencia, searchTerm]);

  if (!data && loading) return (
    <div className="flex h-[70vh] items-center justify-center flex-col">
       <div className="w-16 h-16 border-4 border-brand-200 dark:border-brand-900/30 border-t-brand-500 rounded-full animate-spin"></div>
       <p className="mt-6 text-lg font-bold heading-text text-[var(--text-main)] animate-pulse">Carregando O.S. Pendentes...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      {/* Header & Stats & Controls */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-4 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 hide-scrollbar">
          {/* KPI Card 1: Total */}
          <div className="glass-panel px-8 py-4 flex items-center gap-6 border-l-4 border-brand-500 min-w-[280px] group hover:border-brand-400 transition-colors">
            <div className="p-3 bg-brand-500/10 dark:bg-brand-500/20 rounded-2xl text-brand-500 group-hover:scale-110 transition-transform">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Total de O.S. Pendente</p>
              <h2 className="text-4xl font-black text-[var(--text-main)] tabular-nums leading-none mt-1">
                {(data?.totalPendentes || 0).toLocaleString('pt-BR')}
              </h2>
            </div>
          </div>

          {/* KPI Card 2: Tempo Médio */}
          <div className="glass-panel px-8 py-4 flex items-center gap-6 border-l-4 border-amber-500 min-w-[280px] group hover:border-amber-400 transition-colors">
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl text-amber-500 group-hover:scale-110 transition-transform">
              <CalendarDays size={28} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Tempo Médio Pendência</p>
              <div className="flex items-baseline gap-1 mt-1">
                <h2 className="text-3xl font-black text-[var(--text-main)] tabular-nums leading-none">
                  {Math.floor(data?.tempoMedio || 0)}
                </h2>
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-tighter mr-2">dias</span>
                <h2 className="text-3xl font-black text-[var(--text-main)] tabular-nums leading-none">
                  {Math.round(((data?.tempoMedio || 0) % 1) * 24)}
                </h2>
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-tighter">hrs</span>
              </div>
            </div>
          </div>

          {/* KPI Card 3: Alerta Cortes */}
          <div className="glass-panel px-8 py-4 flex items-center gap-6 border-l-4 border-rose-500 min-w-[280px] group hover:border-rose-400 transition-colors">
            <div className="p-3 bg-rose-500/10 dark:bg-rose-500/20 rounded-2xl text-rose-500 animate-pulse group-hover:animate-none group-hover:scale-110 transition-transform">
              <AlertCircle size={28} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Cortes por Débito</p>
              <h2 className="text-4xl font-black text-rose-600 dark:text-rose-400 tabular-nums leading-none mt-1">
                {(data?.totalCortesDebito || 0).toLocaleString('pt-BR')}
              </h2>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="glass-panel p-2 flex items-center gap-3 border border-[var(--border-color)] rounded-2xl bg-[var(--bg-surface)] dark:bg-white/5 shadow-xl w-full xl:w-auto">
          <div className="relative flex-1 xl:flex-none">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input 
              type="text"
              placeholder="Buscar Nº O.S..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] text-sm font-bold rounded-xl pl-10 pr-4 py-3 w-full md:w-64 outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
          
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            <Download size={18} />
            EXPORTAR
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Trend Chart */}
        <div className="glass-panel p-6 border border-[var(--border-color)] relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-500/10 rounded-lg text-brand-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-black text-sm uppercase tracking-wider text-[var(--text-main)]">Evolução de O.S. Pendentes por Dia</h3>
            </div>
          </div>
          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.dailyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotalPremium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-500)" stopOpacity={0.3}/>
                    <stop offset="50%" stopColor="var(--brand-500)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--brand-500)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.4} />
                <XAxis 
                  dataKey="data" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }}
                  tickFormatter={(val) => {
                    if (!val || val === 'S/D') return val;
                    const [y, m, d] = val.split('-');
                    return `${d}/${m}`;
                  }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }}
                />
                <Tooltip 
                  content={<CustomAreaTooltip />}
                  cursor={{ stroke: 'var(--brand-500)', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.3 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="var(--brand-500)" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorTotalPremium)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--brand-500)', className: "shadow-[0_0_10px_rgba(59,130,246,0.8)] drop-shadow-md" }}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Setores */}
          <div className="glass-panel p-6 border border-[var(--border-color)] relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                <Building2 size={20} />
              </div>
              <h3 className="font-black text-sm uppercase tracking-wider text-[var(--text-main)]">Top 10 Setores Mais Pendentes</h3>
            </div>
            <div className="h-[400px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.topSetores} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" opacity={0.4} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="nome" 
                    type="category" 
                    axisLine={false}
                    tickLine={false}
                    width={100}
                    tick={{ fill: 'var(--text-main)', fontSize: 10, fontWeight: 800 }}
                    tickFormatter={(val) => val.split(' - ')[0]}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--bg-main)', opacity: 0.4 }}
                    content={<CustomBarTooltip color="#f59e0b" title="setor" />}
                  />
                  <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={20} animationDuration={1500}>
                    {data?.topSetores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#f59e0b99'} className="hover:brightness-110 transition-all" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Servicos */}
          <div className="glass-panel p-6 border border-[var(--border-color)] relative overflow-hidden">
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                <LayoutGrid size={20} />
              </div>
              <h3 className="font-black text-sm uppercase tracking-wider text-[var(--text-main)]">Top 10 Serviços Mais Pendentes</h3>
            </div>
            <div className="h-[400px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.topServicos} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" opacity={0.4} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="nome" 
                    type="category" 
                    axisLine={false}
                    tickLine={false}
                    width={140}
                    tick={{ fill: 'var(--text-main)', fontSize: 9, fontWeight: 700 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--bg-main)', opacity: 0.4 }}
                    content={<CustomBarTooltip color="#10b981" title="servico" />}
                  />
                  <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={20} animationDuration={1500}>
                    {data?.topServicos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#10b98199'} className="hover:brightness-110 transition-all" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OSPendentes;
