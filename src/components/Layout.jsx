import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, Sun, Moon, Menu, Landmark, Mail, Code, Droplets, ClipboardCheck, Scissors, Banknote, ChevronDown, Settings, TrendingUp, Activity } from 'lucide-react';
import MonthYearSelector from './MonthYearSelector';
import RegionalSelector from './RegionalSelector';

import ErrorBoundary from './ErrorBoundary';

const Sidebar = ({ isOpen, toggleSidebar, theme, toggleTheme }) => {
  const [expandedMenu, setExpandedMenu] = useState(null);

  const navItems = [
    { 
      to: "/arrecadacao", 
      icon: <Banknote size={20} />, 
      label: "ARRECADAÇÃO",
      subItems: [
        { label: "Visão Geral", to: "/arrecadacao/resumo" },
        { label: "Comparativo Temporal", to: "/arrecadacao/comparativo" },
        { label: "Curva de Recebimento", to: "/arrecadacao/curva" }
      ]
    },
    { to: "/hidrometracao", icon: <Droplets size={20} />, label: "HIDROMETRAÇÃO" },
    { 
      to: "/os", 
      icon: <ClipboardCheck size={20} />, 
      label: "ORDENS DE SERVIÇOS",
      subItems: [
        { label: "Pendentes", to: "/os/pendentes" },
        { label: "Encerradas", to: "/os/encerradas" }
      ]
    },
    { to: "/cortes", icon: <Scissors size={20} />, label: "CORTES" },
    { to: "/configuracoes", icon: <Settings size={20} />, label: "Configurações" },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 
        bg-[var(--bg-surface)] border-r border-[var(--border-color)] 
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-8 border-b border-[var(--border-color)] flex items-center gap-3">
          <div className="bg-brand-500 p-2.5 rounded-2xl shadow-lg shadow-brand-500/20 text-white flex-shrink-0">
             <Landmark size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black text-brand-600 dark:text-white heading-text tracking-tight leading-none">
              DIRETORIA COMERCIAL
            </h1>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-3">
          {navItems.map((item) => {
            const hasSubMenu = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenu === item.to;
            const isDeveloped = item.to === "/" || item.to === "/cortes" || item.to === "/configuracoes" || item.to === "/os" || item.to === "/arrecadacao";

            const renderLinkContent = (isActive = false) => (
              <>
                <div className="flex items-center gap-4">
                  <span className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-brand-500/70 group-hover:text-brand-500'}`}>
                    {item.icon}
                  </span>
                  <span className="uppercase tracking-wider text-sm">{item.label}</span>
                </div>
                {hasSubMenu && (
                  <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} ${isActive ? 'text-white' : 'text-brand-500/70'}`} />
                )}
              </>
            );

            return (
              <div key={item.to} className="flex flex-col">
                {isDeveloped && !hasSubMenu ? (
                  <NavLink 
                    to={item.to}
                    onClick={() => window.innerWidth < 768 && toggleSidebar()}
                    className={({ isActive }) => 
                      `flex items-center gap-4 px-6 py-4 rounded-[2rem] font-bold transition-all duration-300 group ${
                        isActive 
                          ? 'bg-brand-500 text-white shadow-xl shadow-brand-500/30' 
                          : 'text-[var(--text-muted)] hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-800/50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-brand-500/70 group-hover:text-brand-500'}`}>
                          {item.icon}
                        </span>
                        <span className="uppercase tracking-wider text-sm">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ) : (
                  <div 
                    onClick={() => hasSubMenu && setExpandedMenu(isExpanded ? null : item.to)}
                    className={`flex items-center justify-between px-6 py-4 rounded-[2rem] font-bold transition-all duration-300 group select-none cursor-pointer ${
                      isExpanded && hasSubMenu
                        ? 'bg-brand-50/50 dark:bg-slate-800/30 text-brand-600' 
                        : 'text-[var(--text-muted)] hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {renderLinkContent()}
                  </div>
                )}
                
                {hasSubMenu && (
                  <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-40 opacity-100 mt-1 mb-2' : 'max-h-0 opacity-0'}`}>
                    <div className="flex flex-col gap-1 pl-14 pr-4 border-l-2 border-brand-500/20 ml-8 py-1">
                      {item.subItems.map((sub, idx) => {
                        const isSubDeveloped = sub.to.startsWith("/os/pendentes") || sub.to.startsWith("/arrecadacao");
                        
                        if (isSubDeveloped) {
                          return (
                            <NavLink 
                              key={idx}
                              to={sub.to}
                              className={({ isActive }) => 
                                `text-xs font-bold py-2 transition-colors uppercase tracking-wider flex items-center gap-2 ${
                                  isActive ? 'text-brand-600 dark:text-brand-400' : 'text-[var(--text-muted)] hover:text-brand-500'
                                }`
                              }
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-brand-500/50"></div>
                              {sub.label}
                            </NavLink>
                          );
                        }

                        return (
                          <div 
                            key={idx}
                            className="text-xs font-bold text-[var(--text-muted)] opacity-50 cursor-not-allowed py-2 transition-colors uppercase tracking-wider flex items-center gap-2"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-500/30"></div>
                            {sub.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-6 border-t border-[var(--border-color)] space-y-4">
           {/* Theme Toggle in Sidebar */}
           <button 
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-brand-50 hover:bg-brand-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400 transition-all border border-brand-100 dark:border-slate-700 group"
            >
              <div className="flex items-center gap-3">
                 {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                 <span className="text-sm font-bold uppercase tracking-wider">
                    {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                 </span>
              </div>
              <div className={`w-10 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-5' : 'left-1'}`} />
              </div>
           </button>

           <div className="glass-panel p-4 flex flex-col items-center gap-2 border border-[var(--border-color)]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Powered by</span>
              <p className="text-base font-black italic text-brand-500">CAEMA</p>
           </div>
           
           <div className="px-2 space-y-1 text-center">
              <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                 Desenvolvido por <span className="text-brand-500 font-bold">sistemaspsdev</span>
              </p>
              <a 
                 href="mailto:pasimplicio@gmail.com" 
                 className="text-[10px] font-medium text-[var(--text-muted)] hover:text-brand-500 transition-colors flex items-center justify-center gap-1.5"
              >
                 <Mail size={12} className="text-brand-500" />
                 pasimplicio@gmail.com
              </a>
           </div>
        </div>
      </aside>
    </>
  );
};

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  
  // State for reference month/year
  const [referencia, setReferencia] = useState(() => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${month}/${year}`;
  });

  const [regional, setRegional] = useState('TODAS');
  const [osFilters, setOsFilters] = useState({ responsavel: 'COMERCIAL', setor: '' });
  const [osOptions, setOsOptions] = useState({ responsaveis: [], setores: [] });
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/arrecadacao/resumo':
        return { title: 'Visão Geral Arrecadação', icon: <Banknote size={24} /> };
      case '/arrecadacao/comparativo':
        return { title: 'Comparativo YoY / MoM', icon: <TrendingUp size={24} /> };
      case '/arrecadacao/curva':
        return { title: 'Curva de Recebimento', icon: <Activity size={24} /> };
      case '/cortes':
        return { title: 'Acompanhamento de Cortes', icon: <Scissors size={24} /> };
      case '/os/pendentes':
        return { title: 'Acompanhamento O.S. Pendentes', icon: <ClipboardCheck size={24} /> };
      case '/importar':
        return { title: 'Gestão da Base de Dados', icon: <Database size={24} /> };
      case '/configuracoes':
        return { title: 'Configurações do Sistema', icon: <Settings size={24} /> };
      default:
        return { title: 'Diretoria Comercial', icon: <Landmark size={24} /> };
    }
  };

  const { title, icon } = getPageTitle();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        theme={theme}
        toggleTheme={toggleTheme}
      />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-main)]">
        {/* Top Header */}
        <header className="h-24 border-b border-[var(--border-color)] bg-[var(--bg-surface)]/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <button 
              className="p-3 rounded-xl hover:bg-[var(--bg-main)] transition-colors md:hidden text-[var(--text-main)]"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>

            <div className="hidden md:flex items-center gap-3">
              <div className="p-2 bg-brand-500/10 rounded-lg text-brand-500">
                {icon}
              </div>
              <h2 className="text-xl font-black text-[var(--text-main)] heading-text tracking-tight uppercase">{title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* OS Specific Filters */}
            {location.pathname === '/os/pendentes' && (
              <>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1 ml-1">Responsável</span>
                  <select 
                    value={osFilters.responsavel}
                    onChange={(e) => setOsFilters(prev => ({ ...prev, responsavel: e.target.value }))}
                    className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-brand-500 min-w-[150px]"
                  >
                    <option value="">Todos</option>
                    {osOptions.responsaveis.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1 ml-1">Setor Atual</span>
                  <select 
                    value={osFilters.setor}
                    onChange={(e) => setOsFilters(prev => ({ ...prev, setor: e.target.value }))}
                    className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-brand-500 min-w-[150px]"
                  >
                    <option value="">Todos os Setores</option>
                    {osOptions.setores.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Regional Filter in Header */}
            <div className="flex flex-col">
               <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1 ml-1 md:hidden">Regional</span>
               <RegionalSelector regional={regional} onChange={setRegional} />
            </div>

            {/* Month/Year Selector in Header */}
            <div className="flex flex-col">
               <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1 ml-1 md:hidden">Referência</span>
               <MonthYearSelector referencia={referencia} onChange={setReferencia} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
           <div className="max-w-7xl mx-auto">
              <ErrorBoundary>
                <Outlet context={{ 
                  referencia, setReferencia, 
                  regional, setRegional, 
                  osFilters, setOsFilters,
                  setOsOptions
                }} />
              </ErrorBoundary>
           </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
