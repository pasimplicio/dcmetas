import Papa from 'papaparse';


// Utils
const parseMonetary = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  // Remove "R$", ".", whitespace, and handle "," decimal
  const cleanStr = value.toString()
    .replace(/[R\$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
};

export const parseCSV = async (file, type, onProgress) => {
  let input = file;
  let totalSize = file.size;
  
  // Fix corrupted CSV format from system exports where fields with commas
  // trigger Excel/PowerBI to wrap the ENTIRE row in quotes instead of just the field.
  if (type === 'meta_regional' || type === 'meta_localidade') {
     const text = await file.text();
     input = text.split(/\r?\n/).map(line => {
        let clean = line.trim();
        // Detect whole-line quoting: starts with ", ends with ", and has internal structure
        if (clean.startsWith('"') && clean.endsWith('"')) {
           // Unwrap and unescape double quotes ("" -> ")
           const unwrapped = clean.substring(1, clean.length - 1).replace(/""/g, '"');
           // Simple heuristic: if it contains commas after unwrapping, it was likely a wrapped record
           if (unwrapped.includes(',') || unwrapped.includes(';')) return unwrapped;
        }
        return clean;
     }).join('\n');
     totalSize = input.length;
  }

  return new Promise((resolve, reject) => {
    const allRows = [];
    let globalRowIndex = 0;
    Papa.parse(input, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      chunkSize: 1024 * 1024,
      chunk: (results, parser) => {
        try {
          const transformed = transformData(results.data, type, globalRowIndex);
          allRows.push(...transformed);
          globalRowIndex += results.data.length;
          
          if (onProgress) {
            onProgress({
               loaded: results.meta.cursor || 0,
               total: totalSize || 1
            });
          }
        } catch (err) {
          parser.abort();
          reject(err);
        }
      },
      complete: () => {
        resolve(allRows);
      },
      error: (err) => {
        reject(err);
      }
    });
  });
};

const normalizeRef = (rawRef) => {
  if (!rawRef) return '';
  let ref = rawRef.toString().trim().toLowerCase();
  
  // Handle "YYYYMM" (e.g. 202604)
  if (ref.length === 6 && !isNaN(ref)) {
     return `${ref.substring(4, 6)}/${ref.substring(0, 4)}`;
  }
  
  // Handle "YYYY-MM-DD ..." (e.g. 2024-01-01 00:00:00)
  if (ref.includes('-') && ref.length >= 7) {
      const parts = ref.split('-');
      // ISO format YYYY-MM-...
      return `${parts[1]}/${parts[0]}`;
  }

  // Handle "abr/26" or "abr/2026" or "04/2026"
  if (ref.includes('/')) {
    const months = { 
      'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
      'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
    };
    const parts = ref.split('/');
    if (parts.length >= 2) {
       const m = months[parts[0].substring(0, 3)] || parts[0].padStart(2, '0');
       let y = parts[parts.length - 1].split(' ')[0]; // Handle "2026 00:00:00"
       if (y.length === 2) y = `20${y}`;
       return `${m}/${y}`;
    }
  }

  return ref;
};

const transformData = (data, type, startIdx = 0) => {
  switch (type) {
    case 'localidade':
      return data.map(row => ({
        id: parseInt(row['Localidade'] || row['LOCALIDADE'] || row['ID LOCALIDADE']),
        superintendencia: row['Superintendencia'] || row['SUPERINTENDENCIA'],
        regional: row['Regional'] || row['REGIONAL'],
        nomeLocalidade: row['Nome Localidade'] || row['NOME LOCALIDADE'],
        municipio: row['Municipio'] || row['MUNICIPIO'],
        ibge: row['IBGE Local'] || row['IBGE']
      }));
    case 'arrecadacao':
      return data.map((row, idx) => {
        const dataRaw = row['DATA ARREC/FAT'] || row['DATA ARREC/PAG'] || row['DATA DE PAGAMENTO'] || row['DATA'] || '';
        let mesPagamento = '';
        
        if (dataRaw) {
            if (dataRaw.includes('/')) {
                const parts = dataRaw.split('/'); // DD/MM/YYYY
                if (parts.length >= 3) {
                    mesPagamento = `${parts[1].padStart(2, '0')}/${parts[2].substring(0, 4)}`;
                } else if (parts.length === 2) {
                    mesPagamento = `${parts[0].padStart(2, '0')}/${parts[1].substring(0, 4)}`;
                }
            } else if (dataRaw.includes('-')) {
                const parts = dataRaw.split('-'); // YYYY-MM-DD
                if (parts[0].length === 4) {
                    mesPagamento = `${parts[1].padStart(2, '0')}/${parts[0]}`;
                } else {
                    mesPagamento = `${parts[1].padStart(2, '0')}/${parts[2].substring(0, 4)}`;
                }
            }
        }

        const locId = parseInt(row['Localidade'] || row['LOCALIDADE'] || row['ID LOCALIDADE'] || 0);
        const cloudId = `arr_${locId}_${startIdx + idx}`;

        const rawArr = row['VALOR ARR'] || row['VALOR ARRECADADO'] || row['VALOR_ARRECADADO'];
        const vDev = parseMonetary(row['VALOR DEV'] || row['VALOR DEVOLUÇÃO'] || row['VALOR_DEVOLUCAO']);
        
        // VALOR ARR já vem com o sinal correto (negativo = devolução).
        // Só recalcula (VALOR - VALOR DEV) se VALOR ARR não existir no CSV.
        const valorArrecadado = rawArr 
          ? parseMonetary(rawArr) 
          : parseMonetary(row['VALOR'] || row['valor']) - vDev;

        return {
          cloudId,
          localidadeId: locId,
          referencia: normalizeRef(row['REFERENCIA'] || row['REFERÊNCIA']),
          mesPagamento: mesPagamento || normalizeRef(row['REFERENCIA'] || row['REFERÊNCIA']),
          categoria: row['CATEGORIA'],
          perfil: row['PERFIL'],
          banco: row['BANCO'],
          formaArrecadacao: row['FORMA DE ARRECADACAO'] || '',
          dataPagamento: dataRaw,
          valorPago: parseMonetary(row['VALOR PAG'] || row['VALOR PAGO'] || row['VALOR_PAGO'] || row['valor_pago']),
          valorDevolucao: vDev,
          valorArrecadado: valorArrecadado,
          valorFaturado: parseMonetary(row['VL FATURADO'] || row['VALOR FATURADO'] || row['VL_FATURADO'] || row['valor_faturado']),
          qtdDocumentos: parseInt(row['QTD'] || row['QTD DOCUMENTOS PAGOS'] || row['qtd_documentos'] || 0)
        };
      });
    case 'meta_localidade':
      return data.map(row => {
          const rawRef = row['referencia'] || row['Data'] || row['REFERENCIA'] || '';
          const ref = normalizeRef(rawRef);
          const locId = parseInt(row['Localidade'] || row['localidade'] || row['LOCALIDADE']);
          const valKey = Object.keys(row).find(k => k.toLowerCase().includes('valor') || k.toLowerCase().includes('previsto')) || 'valorPrevisto';
          
          return {
            referencia: ref,
            localidadeId: locId,
            valorPrevisto: parseMonetary(row[valKey]),
            cloudId: `met_loc_${locId}_${ref.replace(/\//g, '')}`
          }
      }).filter(r => r.referencia && !isNaN(r.localidadeId));

    case 'meta_regional':
      return data.map(row => {
          const rawRef = row['Data'] || row['referencia'] || row['DATA'] || '';
          const ref = normalizeRef(rawRef);
          const locId = parseInt(row['Localidade'] || row['LOCALIDADE']);
          const reg = row['Regional'] || row['REGIONAL'];
          const cat = row['Categoria'] || row['CATEGORIA'];
          const valKey = Object.keys(row).find(k => k.toLowerCase().includes('valor') || k.toLowerCase().includes('soma')) || 'Valor';

          return {
            referencia: ref,
            localidadeId: locId,
            regional: reg,
            categoria: cat,
            valorPrevisto: parseMonetary(row[valKey]),
            cloudId: `met_reg_${locId}_${ref.replace(/\//g, '')}_${(cat || '').substring(0,3)}`
          }
      }).filter(row => row.referencia);
      
    case 'cortes':
      return data.map(row => {
          const rawRef = row['data emissao'] || row['Data Emissao'] || '';
          let mesEmissao = '';
          if (rawRef) {
              if (rawRef.includes('-')) {
                  const parts = rawRef.split('-'); // YYYY-MM-DD
                  mesEmissao = `${parts[1].padStart(2, '0')}/${parts[0]}`;
              } else if (rawRef.includes('/')) {
                  const parts = rawRef.split('/'); // DD/MM/YYYY
                  if (parts.length >= 3) {
                      mesEmissao = `${parts[1].padStart(2, '0')}/${parts[2].substring(0, 4)}`;
                  }
              }
          }

          return {
            matricula: parseInt(row['matricula'] || row['Matricula'] || 0),
            categoria: row['Categoria Principal'] || row['categoria'],
            localidadeId: parseInt(row['Localidade'] || row['localidade'] || 0),
            situacaoAgua: row['Situacao da agua'] || row['situacao da agua'],
            dataEmissao: rawRef,
            mesEmissao: mesEmissao,
            tipoDocumento: row['tipo documento'] || row['Tipo Documento'],
            formaEmissao: row['forma emissao'] || row['Forma Emissao'],
            acaoCobranca: row['acao cobranca'] || row['Acao Cobranca'],
            valorDocumento: parseMonetary(row['valor documento'] || row['Valor Documento']),
            situacaoAcao: (row['situacao acao'] || row['Situacao Acao'] || '').toUpperCase(),
            dataAcao: row['data acao'] || row['Data Acao'],
            situacaoDebito: (row['situacao debito'] || row['Situacao Debito'] || '').toUpperCase(),
            motivoEncerramento: row['motivo encerramento'] || row['Motivo Encerramento']
          };
      });
    default:
      return [];
  }
};
