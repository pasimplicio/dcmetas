import fs from 'fs';
import Papa from 'papaparse';

// Minimal version of the aggregation logic from the app
const normalizeRef = (rawRef) => {
  if (!rawRef) return '';
  let ref = rawRef.toString().trim().toLowerCase();
  
  if (ref.length === 6 && !isNaN(ref)) {
     return `${ref.substring(4, 6)}/${ref.substring(0, 4)}`;
  }
  if (ref.includes('-') && ref.length >= 7) {
      const parts = ref.split('-');
      return `${parts[1]}/${parts[0]}`;
  }
  if (ref.includes('/')) {
    const parts = ref.split('/');
    if (parts.length >= 2) {
       let m = parts[0].padStart(2, '0');
       let y = parts[parts.length - 1].split(' ')[0];
       if (y.length === 2) y = `20${y}`;
       return `${m}/${y}`;
    }
  }
  return ref;
};

const aggregateData = (rows) => {
  const map = {};
  rows.forEach(r => {
    const key = [
      r.localidadeId,
      r.dataPagamento,
      r.referencia,
      r.categoria,
      r.perfil,
      r.banco,
      r.formaArrecadacao
    ].join('|');

    if (!map[key]) {
      map[key] = true;
    }
  });
  return Object.keys(map).length;
};

const fileContent = fs.readFileSync('D:/dcmetas/csv/fArrecadacao.csv', 'utf8');

Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: 'greedy',
    delimiter: ';', // Explicitly use semicolon as seen in previous inspect
    complete: (results) => {
        console.log(`Total de linhas lidas: ${results.data.length}`);
        
        const transformed = results.data.map(row => {
            const dataArrec = row['DATA ARREC/FAT'] || row['DATA ARREC/PAG'] || row['DATA DE PAGAMENTO'] || '';
            let mesPagamento = '';
            if (dataArrec.includes('/') && dataArrec.length >= 7) {
                const parts = dataArrec.split('/');
                if (parts.length === 3) mesPagamento = `${parts[1]}/${parts[2]}`;
            }

            return {
                localidadeId: parseInt(row['Localidade'] || row['LOCALIDADE'] || row['ID LOCALIDADE']),
                referencia: normalizeRef(row['REFERENCIA'] || row['REFERÊNCIA']),
                mesPagamento: mesPagamento || normalizeRef(row['REFERENCIA'] || row['REFERÊNCIA']),
                categoria: row['CATEGORIA'],
                perfil: row['PERFIL'],
                banco: row['BANCO'],
                formaArrecadacao: row['FORMA DE ARRECADACAO'],
                dataPagamento: dataArrec,
                valorArrecadado: 1 // Dummy for counting
            };
        });

        const consolidatedCount = aggregateData(transformed);
        console.log(`Registros consolidados gerados: ${consolidatedCount}`);
    }
});
