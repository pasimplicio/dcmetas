const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

const queries = [
    { name: 'Geradas COMERCIAL Abril', sql: "SELECT COUNT(*) as total FROM ordens_servico WHERE responsavel = 'COMERCIAL' AND data_geracao LIKE '2026-04-%'" },
    { name: 'Encerradas COMERCIAL Abril (Data Enc)', sql: "SELECT COUNT(*) as total FROM ordens_servico WHERE responsavel = 'COMERCIAL' AND situacao_os = 'ENCERRADA' AND data_encerramento LIKE '%/04/2026'" },
    { name: 'No Prazo COMERCIAL Abril (Geradas em Abr)', sql: "SELECT COUNT(*) as total FROM ordens_servico WHERE responsavel = 'COMERCIAL' AND situacao_os = 'ENCERRADA' AND data_geracao LIKE '2026-04-%' AND data_encerramento IS NOT NULL" }
];

queries.forEach(q => {
    try {
        const res = db.prepare(q.sql).get();
        console.log(`${q.name}:`, res);
    } catch (e) {
        console.log(`${q.name} ERROR:`, e.message);
    }
});
