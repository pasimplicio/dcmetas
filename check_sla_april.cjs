const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

function getBusinessDaysDiff(d1, d2) {
    if (!d1 || !d2) return -1;
    const date1 = new Date(d1);
    const date2 = new Date(d2.split('/').reverse().join('-'));
    if (isNaN(date1) || isNaN(date2)) return -1;
    let count = 0;
    let cur = new Date(date1);
    while (cur <= date2) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) count++;
        cur.setDate(cur.getDate() + 1);
    }
    return count - 1;
}

const allClosedInApril = db.prepare("SELECT data_geracao, data_encerramento FROM ordens_servico WHERE responsavel = 'COMERCIAL' AND situacao_os = 'ENCERRADA' AND data_encerramento LIKE '%/04/2026'").all();

let inSla = 0;
allClosedInApril.forEach(row => {
    const diff = getBusinessDaysDiff(row.data_geracao, row.data_encerramento);
    if (diff >= 0 && diff <= 3) inSla++;
});

console.log('No Prazo (Encerradas em Abril):', inSla);
