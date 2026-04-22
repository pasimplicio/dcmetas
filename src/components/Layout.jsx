import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, Sun, Moon, Menu, Landmark, Mail, Code, Droplets, ClipboardCheck, Scissors, Banknote } from 'lucide-react';
import MonthYearSelector from './MonthYearSelector';

import ErrorBoundary from './ErrorBoundary';

const Sidebar = ({ isOpen, toggleSidebar, theme, toggleTheme }) => {
  const navItems = [
    { to: "/", icon: <Banknote size={20} />, label: "ARRECADAÇÃO" },
    { to: "/hidrometracao", icon: <Droplets size={20} />, label: "HIDROMETRAÇÃO" },
    { to: "/os", icon: <ClipboardCheck size={20} />, label: "ORDENS DE SERVIÇOS" },
    { to: "/cortes", icon: <Scissors size={20} />, label: "CORTES" },
    { to: "/importar", icon: <Database size={20} />, label: "Base de Dados" },
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
            const isDeveloped = item.to === "/" || item.to === "/importar";
            
            if (isDeveloped) {
              return (
                <NavLink 
                  key={item.to}
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
              );
            }

            // Undeveloped items - Visual only, no navigation
            return (
              <div 
                key={item.to}
                className="flex items-center gap-4 px-6 py-4 rounded-[2rem] font-bold text-[var(--text-muted)] hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-800/50 cursor-pointer transition-all duration-300 group select-none"
              >
                <span className="text-brand-500/70 group-hover:text-brand-500 transition-transform duration-300 group-hover:scale-110">
                  {item.icon}
                </span>
                <span className="uppercase tracking-wider text-sm">{item.label}</span>
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

            <div className="hidden md:block">
              <h2 className="text-xl font-black text-[var(--text-main)] heading-text tracking-tight uppercase">DIRETORIA COMERCIAL</h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Month/Year Selector in Header */}
            <MonthYearSelector referencia={referencia} onChange={setReferencia} />
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
           <div className="max-w-7xl mx-auto">
              <ErrorBoundary>
                <Outlet context={{ referencia, setReferencia }} />
              </ErrorBoundary>
           </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
