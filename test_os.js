import db from './server/config/db.js';

const HOLIDAYS = [
  '2025-01-01', '2025-03-03', '2025-03-04', '2025-03-05', '2025-04-18',
  '2025-04-21', '2025-05-01', '2025-06-19', '2025-07-28', '2025-09-07',
  '2025-10-12', '2025-11-02', '2025-11-15', '2025-12-25',
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-04-03',
  '2026-04-21', '2026-05-01', '2026-06-04', '2026-07-28', '2026-09-07',
  '2026-10-12', '2026-11-02', '2026-11-15', '2026-12-25'
];

function getBusinessDaysDiff(startStr, endStr) {
  if (!startStr || !endStr) return -1;
  const [y1, m1, d1] = startStr.split('-');
  const [d2, m2, y2] = endStr.split('/');
  
  if (!y1 || !y2) return -1;

  let current = new Date(y1, m1 - 1, d1);
  const end = new Date(y2, m2 - 1, d2);
  
  let diff = 0;
  if (current > end) return 0; 

  while (current < end) {
      current.setDate(current.getDate() + 1);
      const dayOfWeek = current.getDay();
      const isoStr = current.toISOString().split('T')[0];
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !HOLIDAYS.includes(isoStr)) {
          diff++;
      }
  }
  return diff;
}

try {
    const ano = '2026';
    const allClosed = db.prepare(`
        SELECT 
            SUBSTR(os.data_encerramento, 4, 2) as mes_encerramento,
            os.data_geracao,
            os.data_encerramento
        FROM ordens_servico os
        LEFT JOIN localidades l ON os.localidade_id = l.id
        WHERE os.situacao_os = 'ENCERRADA'
        AND os.responsavel = 'COMERCIAL'
        AND os.data_encerramento LIKE ?
    `).all(`%/${ano}`);

    console.log(`Encontrou ${allClosed.length} OS encerradas no ano ${ano}.`);

    let crashCount = 0;
    allClosed.forEach((row, i) => {
        try {
            getBusinessDaysDiff(row.data_geracao, row.data_encerramento);
        } catch(e) {
            if(crashCount < 5) {
               console.error(`Crash na linha ${i}: geracao=${row.data_geracao}, encerramento=${row.data_encerramento}`, e.message);
               crashCount++;
            }
        }
    });

    console.log("Script finalizado!");
} catch (e) {
    console.error("Erro fatal:", e);
}
