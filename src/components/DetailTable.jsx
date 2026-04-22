import React from 'react';

const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const MONTH_LABELS = {
  '01': 'janeiro', '02': 'fevereiro', '03': 'março', '04': 'abril',
  '05': 'maio', '06': 'junho', '07': 'julho', '08': 'agosto',
  '09': 'setembro', '10': 'outubro', '11': 'novembro', '12': 'dezembro'
};

const getMonthLabel = (ref) => {
  const mesNum = ref?.split('/')[0];
  return MONTH_LABELS[mesNum] || ref;
};

const DetailTable = ({ data, months = [] }) => {
    if (!data || data.length === 0) {
        return (
            <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
               <div className="bg-brand-100 dark:bg-brand-900/30 p-4 rounded-full text-brand-500 mb-4">
                  <span className="text-2xl">📊</span>
               </div>
               <h3 className="text-lg font-bold text-[var(--text-main)]">Sem dados disponíveis</h3>
               <p className="text-[var(--text-muted)] max-w-xs mt-1">Carregue arquivos de arrecadação na base de dados para visualizar o detalhamento.</p>
            </div>
        );
    }

    // Compute grand totals per month and overall
    const monthTotals = {};
    let grandTotal = 0;
    months.forEach(m => { monthTotals[m] = 0; });
    data.forEach(row => {
        months.forEach(m => {
            const val = row.months[m] || 0;
            monthTotals[m] += val;
        });
        grandTotal += row.total;
    });

    return (
        <div className="glass-panel w-full overflow-hidden border border-[var(--border-color)]">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-color)]">
                        <tr className="divide-x divide-[var(--border-color)]">
                            <th scope="col" className="px-6 py-4 font-bold heading-text text-[var(--text-main)] sticky left-0 bg-[var(--bg-surface)] z-10 min-w-[200px]">
                                Nome Localidade
                            </th>
                            {months.map(m => (
                                <th key={m} scope="col" className="px-6 py-4 font-bold heading-text text-[var(--text-main)] text-right capitalize min-w-[140px]">
                                    {getMonthLabel(m)}
                                </th>
                            ))}
                            <th scope="col" className="px-6 py-4 font-black heading-text text-[var(--text-main)] text-right min-w-[150px]">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]/50">
                        {data.map((row, index) => (
                            <tr key={index} className="hover:bg-brand-50/30 dark:hover:bg-slate-800/40 transition-colors divide-x divide-[var(--border-color)]/30">
                                <td className="px-6 py-4 font-semibold text-[var(--text-main)] sticky left-0 bg-[var(--bg-surface)] z-10 whitespace-nowrap">
                                    {row.municipio}
                                </td>
                                {months.map(m => (
                                    <td key={m} className="px-6 py-4 text-right tabular-nums text-[var(--text-muted)] font-medium whitespace-nowrap">
                                        {row.months[m] ? formatter.format(row.months[m]) : ''}
                                    </td>
                                ))}
                                <td className="px-6 py-4 text-right font-bold text-brand-700 dark:text-brand-400 tabular-nums whitespace-nowrap">
                                    {formatter.format(row.total)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-[var(--bg-surface)] border-t-2 border-[var(--border-color)]">
                        <tr className="divide-x divide-[var(--border-color)]">
                            <td className="px-6 py-4 font-black text-[var(--text-main)] sticky left-0 bg-[var(--bg-surface)] z-10">
                                Total
                            </td>
                            {months.map(m => (
                                <td key={m} className="px-6 py-4 text-right font-bold text-[var(--text-main)] tabular-nums whitespace-nowrap">
                                    {formatter.format(monthTotals[m] || 0)}
                                </td>
                            ))}
                            <td className="px-6 py-4 text-right font-black text-brand-700 dark:text-brand-400 tabular-nums whitespace-nowrap">
                                {formatter.format(grandTotal)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default DetailTable;
