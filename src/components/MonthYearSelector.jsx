import { CalendarDays, ChevronDown } from 'lucide-react';

const meses = [
    { num: '01', nome: 'Janeiro' }, { num: '02', nome: 'Fevereiro' }, { num: '03', nome: 'Março' },
    { num: '04', nome: 'Abril' }, { num: '05', nome: 'Maio' }, { num: '06', nome: 'Junho' },
    { num: '07', nome: 'Julho' }, { num: '08', nome: 'Agosto' }, { num: '09', nome: 'Setembro' },
    { num: '10', nome: 'Outubro' }, { num: '11', nome: 'Novembro' }, { num: '12', nome: 'Dezembro' }
];

const currentYear = new Date().getFullYear();
const anos = Array.from({ length: 5 }, (_, i) => String(2024 + i)); // 2024 to 2028

const MonthYearSelector = ({ referencia, onChange }) => {
    const [mes, ano] = referencia.split('/');

    const handleMesChange = (e) => {
        onChange(`${e.target.value}/${ano}`);
    };

    const handleAnoChange = (e) => {
        onChange(`${mes}/${e.target.value}`);
    };

    return (
        <div className="flex items-center gap-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-2 shadow-sm ring-1 ring-black/5 dark:ring-white/5 transition-all">
            <div className="flex items-center pl-3 pr-1 text-brand-500">
                <CalendarDays size={20} />
            </div>
            
            <div className="relative group">
                <select
                    value={mes}
                    onChange={handleMesChange}
                    className="bg-transparent text-[var(--text-main)] font-black heading-text text-sm focus:outline-none cursor-pointer appearance-none px-2 py-1.5 pr-8 hover:text-brand-500 transition-colors uppercase tracking-wider"
                >
                    {meses.map(m => (
                        <option key={m.num} value={m.num} className="bg-[var(--bg-surface)] text-[var(--text-main)]">
                            {m.nome}
                        </option>
                    ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)] group-hover:text-brand-500 transition-colors">
                    <ChevronDown size={14} />
                </div>
            </div>

            <div className="w-px h-6 bg-[var(--border-color)]"></div>

            <div className="relative group">
                <select
                    value={ano}
                    onChange={handleAnoChange}
                    className="bg-transparent text-[var(--text-main)] font-black heading-text text-sm focus:outline-none cursor-pointer appearance-none px-2 py-1.5 pr-8 hover:text-brand-500 transition-colors tracking-tight"
                >
                    {anos.map(a => (
                        <option key={a} value={a} className="bg-[var(--bg-surface)] text-[var(--text-main)]">
                            {a}
                        </option>
                    ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)] group-hover:text-brand-500 transition-colors">
                    <ChevronDown size={14} />
                </div>
            </div>
        </div>
    );
};

export default MonthYearSelector;
