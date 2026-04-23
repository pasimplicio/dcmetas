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
  Calendar
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell
} from 'recharts';

const API_URL = 'http://localhost:3001/api';

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
      const params = new URLSearchParams({
        regional: globalRegional,
        responsavel: osFilters.responsavel,
        setor: osFilters.setor,
        ano: ano,
        mes: mes,
        numero_os: searchTerm
      });
      
      const res = await fetch(`${API_URL}/os/pendentes?${params.toString()}`);
      const result = await res.json();
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
    const params = new URLSearchParams({
      regional: globalRegional,
      responsavel: osFilters.responsavel,
      setor: osFilters.setor,
      ano: ano,
      mes: mes,
      numero_os: searchTerm
    });
    window.location.href = `${API_URL}/os/pendentes/export?${params.toString()}`;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [globalRegional, osFilters, referencia, searchTerm]);

  if (!data && loading) return (
    <div className="flex h-96 items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Stats & Controls */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-4">
          {/* KPI Card 1: Total */}
          <div className="glass-panel px-8 py-4 flex items-center gap-6 border-l-4 border-brand-500 min-w-[280px]">
            <div className="p-3 bg-brand-500/10 dark:bg-brand-500/20 rounded-2xl text-brand-500">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Total de O.S. Pendente</p>
              <h2 className="text-4xl font-black text-[var(--text-main)] tabular-nums leading-none">
                {data?.totalPendentes.toLocaleString('pt-BR')}
              </h2>
            </div>
          </div>

          {/* KPI Card 2: Tempo Médio */}
          <div className="glass-panel px-8 py-4 flex items-center gap-6 border-l-4 border-amber-500 min-w-[280px]">
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl text-amber-500">
              <Calendar size={28} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Tempo Médio Pendência</p>
              <div className="flex items-baseline gap-1">
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
        </div>

        {/* Global Controls */}
        <div className="glass-panel p-2 flex items-center gap-3 border border-[var(--border-color)] rounded-2xl bg-[var(--bg-surface)] dark:bg-white/5 shadow-xl">
          <div className="relative">
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
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download size={18} />
            EXPORTAR EXCEL
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Trend Chart */}
        <div className="glass-panel p-6 border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-500/10 rounded-lg text-brand-500">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-black text-sm uppercase tracking-wider text-[var(--text-main)]">Evolução de O.S. Pendentes por Dia</h3>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.dailyData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.3} />
                <XAxis 
                  dataKey="data" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(val) => {
                    if (!val || val === 'S/D') return val;
                    const [y, m, d] = val.split('-');
                    return `${d}/${m}`;
                  }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                  labelStyle={{ color: 'var(--text-main)', fontWeight: 900, marginBottom: '4px' }}
                  itemStyle={{ color: '#0ea5e9', fontWeight: 700 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#0ea5e9" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Setores */}
          <div className="glass-panel p-6 border border-[var(--border-color)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                <Building2 size={20} />
              </div>
              <h3 className="font-black text-sm uppercase tracking-wider text-[var(--text-main)]">Top 10 Setores Mais Pendentes</h3>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.topSetores} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="nome" 
                    type="category" 
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    tick={{ fill: 'var(--text-main)', fontSize: 10, fontWeight: 800 }}
                    tickFormatter={(val) => val.split(' - ')[0]}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--brand-500)', opacity: 0.05 }}
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                    labelStyle={{ color: 'var(--text-main)', fontWeight: 900, marginBottom: '4px' }}
                    itemStyle={{ color: '#f59e0b', fontWeight: 700 }}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {data?.topSetores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#f59e0b99'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Servicos */}
          <div className="glass-panel p-6 border border-[var(--border-color)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                <LayoutGrid size={20} />
              </div>
              <h3 className="font-black text-sm uppercase tracking-wider text-[var(--text-main)]">Top 10 Serviços Mais Pendentes</h3>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.topServicos} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="nome" 
                    type="category" 
                    axisLine={false}
                    tickLine={false}
                    width={120}
                    tick={{ fill: 'var(--text-main)', fontSize: 9, fontWeight: 700 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--brand-500)', opacity: 0.05 }}
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                    labelStyle={{ color: 'var(--text-main)', fontWeight: 900, marginBottom: '4px' }}
                    itemStyle={{ color: '#10b981', fontWeight: 700 }}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {data?.topServicos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#10b98199'} />
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
