import React from 'react';

const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const DetailTable = ({ data }) => {
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

    return (
        <div className="glass-panel w-full overflow-hidden border border-[var(--border-color)]">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-color)]">
                        <tr className="divide-x divide-[var(--border-color)]">
                            <th scope="col" className="px-6 py-4 font-bold heading-text text-[var(--text-main)]">ID</th>
                            <th scope="col" className="px-6 py-4 font-bold heading-text text-[var(--text-main)]">Localidade</th>
                            <th scope="col" className="px-6 py-4 font-bold heading-text text-[var(--text-main)]">Regional</th>
                            <th scope="col" className="px-6 py-4 font-bold heading-text text-[var(--text-main)]">Banco</th>
                            <th scope="col" className="px-6 py-4 font-bold heading-text text-right text-[var(--text-main)]">Valor Arrecadado</th>
                            <th scope="col" className="px-6 py-4 font-bold heading-text text-center text-[var(--text-main)]">Qtd Docs</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]/50">
                        {data.map((row, index) => (
                            <tr key={index} className="hover:bg-brand-50/30 dark:hover:bg-slate-800/40 transition-colors divide-x divide-[var(--border-color)]/30">
                                <td className="px-6 py-4 font-medium text-[var(--text-muted)]">{row.id}</td>
                                <td className="px-6 py-4 font-semibold text-[var(--text-main)]">{row.nome}</td>
                                <td className="px-6 py-4 text-[var(--text-muted)]">{row.regional}</td>
                                <td className="px-6 py-4 text-[var(--text-muted)] uppercase text-[11px] font-bold">{row.banco}</td>
                                <td className="px-6 py-4 text-right font-bold text-brand-700 dark:text-brand-400 tabular-nums">
                                    {formatter.format(row.valor)}
                                </td>
                                <td className="px-6 py-4 text-center tabular-nums font-medium text-[var(--text-main)]">
                                    {row.qtd}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DetailTable;
