import fs from 'fs';
import Papa from 'papaparse';

const fileContent = fs.readFileSync('D:/dcmetas/csv/fArrecadacao.csv', 'utf8');

Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: 'greedy',
    delimiter: ';',
    complete: (results) => {
        const rows = results.data;
        console.log(`Linhas totais no CSV: ${rows.length}`);

        const uniqueByAll = new Set();
        const uniqueByDayLocCat = new Set();
        const uniqueByDayLocCatBank = new Set();

        rows.forEach(r => {
            const loc = r['LOCALIDADE'] || '';
            const data = r['DATA ARREC/FAT'] || '';
            const ref = r['REFERENCIA'] || '';
            const cat = r['CATEGORIA'] || '';
            const bank = r['BANCO'] || '';
            const perf = r['PERFIL'] || '';
            const form = r['FORMA DE ARRECADACAO'] || '';

            uniqueByAll.add(`${loc}|${data}|${ref}|${cat}|${perf}|${bank}|${form}`);
            uniqueByDayLocCat.add(`${loc}|${data}|${ref}|${cat}`);
            uniqueByDayLocCatBank.add(`${loc}|${data}|${ref}|${cat}|${bank}`);
        });

        console.log(`Registros Únicos (Dia+Loc+Cat+Per+Bank+Forma): ${uniqueByAll.size}`);
        console.log(`Registros Únicos (Só Dia+Loc+Cat): ${uniqueByDayLocCat.size}`);
        console.log(`Registros Únicos (Dia+Loc+Cat+Bank): ${uniqueByDayLocCatBank.size}`);
    }
});
