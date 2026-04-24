import { useOutletContext, NavLink } from 'react-router-dom';
import { Database, Sparkles, Receipt, Coins } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import AnnualPerformance from '../components/AnnualPerformance';
import DailyPerformance from '../components/DailyPerformance';
import RegionalRanking from '../components/RegionalRanking';
import DetailTable from '../components/DetailTable';
import { useDashboardData } from '../hooks/useDashboardData';

const Dashboard = () => {
  const { referencia, regional: selectedRegional } = useOutletContext();
  const { 
    kpis, daily, annual, regional, 
    bancoRanking, perfilDistribution, formaDistribution, 
    table, tableMonths, check, loading 
  } = useDashboardData(referencia, selectedRegional);

  if (loading) {
      return (
          <div className="w-full h-[70vh] flex flex-col items-center justify-center">
             <div className="relative">
                <div className="w-16 h-16 border-4 border-brand-200 dark:border-brand-900/30 border-t-brand-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-brand-500">
                    <Sparkles size={20} className="animate-pulse" />
                </div>
             </div>
             <p className="mt-6 text-lg font-bold heading-text text-[var(--text-main)] animate-pulse">Sincronizando dados...</p>
          </div>
      )
  }

  // Check if system is empty
  if (!loading && Object.keys(kpis).length > 0 && kpis.total.previsto === 0 && kpis.total.realizado === 0 && table.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[70vh] glass-panel p-12 max-w-2xl mx-auto text-center border border-[var(--border-color)]">
              <div className="bg-brand-500/10 p-6 rounded-3xl mb-8">
                <Database size={64} className="text-brand-500" />
              </div>
              <h2 className="text-3xl font-black heading-text text-[var(--text-main)] mb-3 tracking-tight">Base de dados vazia</h2>
              <p className="text-[var(--text-muted)] mb-10 max-w-md text-lg leading-relaxed">Para visualizar o dashboard financeiro, você precisa primeiro importar as planilhas CSV do sistema.</p>
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
        
      {/* 5 KPI Cards Row */}
      <div className="glass-panel p-4 md:p-6 mb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
           <KpiCard title="Total" data={kpis.total} />
           <KpiCard title="Residencial" data={kpis.residencial} />
           <KpiCard title="Comercial" data={kpis.comercial} />
           <KpiCard title="Industrial" data={kpis.industrial} />
           <KpiCard title="Público" data={kpis.publico} />
        </div>
      </div>

      {/* Visual Check Row (New) */}
      {check && (check.faturamento > 0 || check.pagamentos > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="glass-panel p-6 border border-brand-500/20 flex items-center justify-between group overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 text-brand-500/5 transition-transform group-hover:scale-110 duration-500">
                 <Receipt size={120} />
              </div>
              <div className="relative z-10">
                 <div className="flex items-center gap-2 text-brand-500 mb-2">
                    <Receipt size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">Faturamento</span>
                 </div>
                 <h4 className="text-2xl font-black text-[var(--text-main)] heading-text">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(check.faturamento)}
                 </h4>
                 <p className="text-xs text-[var(--text-muted)] font-bold mt-1 uppercase">Visual Check (Base fFaturamento)</p>
              </div>
           </div>

           <div className="glass-panel p-6 border-emerald-500/20 flex items-center justify-between group overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 text-emerald-500/5 transition-transform group-hover:scale-110 duration-500">
                 <Coins size={120} />
              </div>
              <div className="relative z-10">
                 <div className="flex items-center gap-2 text-emerald-500 mb-2">
                    <Coins size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">Pagamentos</span>
                 </div>
                 <h4 className="text-2xl font-black text-[var(--text-main)] heading-text">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(check.pagamentos)}
                 </h4>
                 <p className="text-xs text-[var(--text-muted)] font-bold mt-1 uppercase">Visual Check (Base fPagamento_2026)</p>
              </div>
           </div>
        </div>
      )}

      {/* Middle Grid - Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[400px]">
         <div className="lg:col-span-4 h-full"> 
             <AnnualPerformance data={annual} />
         </div>
         <div className="lg:col-span-5 h-full"> 
             <DailyPerformance data={daily} totalPrevistoMes={kpis.total.previsto} />
         </div>
         <div className="lg:col-span-3 h-full"> 
             <RegionalRanking data={regional} />
         </div>
      </div>

      {/* Bottom Table */}
      <div className="space-y-4">
         <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-brand-500 rounded-full"></div>
            <h3 className="text-lg font-black heading-text text-[var(--text-main)]">Detalhamento por Município</h3>
         </div>
         <DetailTable data={table} months={tableMonths} />
      </div>
    </div>
  );
};

export default Dashboard;
