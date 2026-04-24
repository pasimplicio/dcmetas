const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

const counts = db.prepare(`
    SELECT 
        SUBSTR(data_geracao, 6, 2) as mes,
        COUNT(*) as total
    FROM ordens_servico
    WHERE data_geracao LIKE '2025-%'
    GROUP BY mes
    ORDER BY mes
`).all();

console.log('Contagem por Mês (2025):');
counts.forEach(c => {
    console.log(`${c.mes}: ${c.total}`);
});

const total = db.prepare("SELECT COUNT(*) as total FROM ordens_servico WHERE data_geracao LIKE '2025-%'").get().total;
console.log('Total Geral:', total);
