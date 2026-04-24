import { Router } from 'express';
import db from '../config/db.js';

const router = Router();

// Endpoint de Exportação CSV para Excel
router.get('/os/pendentes/export', (req, res) => {
    let { regional, responsavel, mes, ano, setor, numero_os } = req.query;

    try {
        let whereClause = `WHERE os.situacao_os = 'PENDENTE'`;
        const params = [];

        if (regional && regional !== 'TODAS') {
            whereClause += ` AND l.regional = ?`;
            params.push(regional);
        }
        if (responsavel) {
            whereClause += ` AND os.responsavel = ?`;
            params.push(responsavel);
        }
        if (setor) {
            whereClause += ` AND os.setor_atual = ?`;
            params.push(setor);
        }

        if (numero_os && numero_os.trim() !== '') {
            whereClause += ` AND os.nr_os LIKE ?`;
            params.push(`%${numero_os}%`);
        } else {
            if (ano && mes) {
                whereClause += ` AND os.data_geracao BETWEEN ? AND ?`;
                params.push(`${ano}-${mes.padStart(2, '0')}-01`, `${ano}-${mes.padStart(2, '0')}-31`);
            } else if (ano) {
                whereClause += ` AND os.data_geracao BETWEEN ? AND ?`;
                params.push(`${ano}-01-01`, `${ano}-12-31`);
            }
        }

        // Fetch ALL data for export
        const tableData = db.prepare(`
            SELECT 
                os.data_geracao as "Data Geração",
                os.nr_os as "Nº O.S.",
                os.tipo_servico as "Tipo de Serviço",
                os.setor_atual as "Setor Atual",
                os.dias_pendente as "Dias",
                os.equipe_programada as "Equipe",
                l.regional as "Regional",
                l.municipio as "Município"
            FROM ordens_servico os
            LEFT JOIN localidades l ON os.localidade_id = l.id
            ${whereClause}
            ORDER BY os.data_geracao DESC, os.nr_os DESC
        `).all(...params);

        if (tableData.length === 0) {
            return res.status(404).send('Nenhum dado encontrado para exportação.');
        }

        // Generate CSV content with semicolon for Excel compatibility
        const headers = Object.keys(tableData[0]).join(';');
        const rows = tableData.map(row => 
            Object.values(row).map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(';')
        ).join('\n');
        
        const csvContent = '\uFEFF' + headers + '\n' + rows; // Add BOM for Excel UTF-8 support

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=OS_Pendentes_${ano || 'Geral'}.csv`);
        res.send(csvContent);

    } catch (err) {
        console.error('Erro na exportação:', err);
        res.status(500).send('Erro interno ao gerar exportação.');
    }
});

router.get('/os/pendentes', (req, res) => {
    let { regional, responsavel, mes, ano, setor, numero_os } = req.query;

    try {
        // Base WHERE clause
        let whereClause = `WHERE os.situacao_os = 'PENDENTE'`;
        const params = [];

        if (regional && regional !== 'TODAS') {
            whereClause += ` AND l.regional = ?`;
            params.push(regional);
        }
        if (responsavel) {
            whereClause += ` AND os.responsavel = ?`;
            params.push(responsavel);
        }
        if (setor) {
            whereClause += ` AND os.setor_atual = ?`;
            params.push(setor);
        }
        if (numero_os && numero_os.trim() !== '') {
            whereClause += ` AND os.nr_os LIKE ?`;
            params.push(`%${numero_os}%`);
        } else {
            // Only apply date filters if NOT searching by OS number
            // Use BETWEEN for index optimization (SARGable)
            if (ano && mes) {
                const start = `${ano}-${mes.padStart(2, '0')}-01`;
                const end = `${ano}-${mes.padStart(2, '0')}-31`;
                whereClause += ` AND os.data_geracao BETWEEN ? AND ?`;
                params.push(start, end);
            } else if (ano) {
                const start = `${ano}-01-01`;
                const end = `${ano}-12-31`;
                whereClause += ` AND os.data_geracao BETWEEN ? AND ?`;
                params.push(start, end);
            }
        }

        // 1. Total Pendentes
        const totalResult = db.prepare(`
            SELECT COUNT(*) as total 
            FROM ordens_servico os
            LEFT JOIN localidades l ON os.localidade_id = l.id
            ${whereClause}
        `).get(...params);
        const totalPendentes = totalResult.total;

        // 2. Daily Trend
        const dailyData = db.prepare(`
            SELECT data_geracao as data, COUNT(*) as total
            FROM ordens_servico os
            LEFT JOIN localidades l ON os.localidade_id = l.id
            ${whereClause}
            GROUP BY data_geracao
            ORDER BY data_geracao ASC
        `).all(...params);

        // 3. Top Setores
        const topSetores = db.prepare(`
            SELECT setor_atual as nome, COUNT(*) as total
            FROM ordens_servico os
            LEFT JOIN localidades l ON os.localidade_id = l.id
            ${whereClause}
            GROUP BY setor_atual
            ORDER BY total DESC
            LIMIT 10
        `).all(...params);

        // 4. Top Servicos
        const topServicos = db.prepare(`
            SELECT tipo_servico as nome, COUNT(*) as total
            FROM ordens_servico os
            LEFT JOIN localidades l ON os.localidade_id = l.id
            ${whereClause}
            GROUP BY tipo_servico
            ORDER BY total DESC
            LIMIT 10
        `).all(...params);

        // 5. Table Data (Limited to 50)
        const tableData = db.prepare(`
            SELECT os.*, l.regional, l.municipio
            FROM ordens_servico os
            LEFT JOIN localidades l ON os.localidade_id = l.id
            ${whereClause}
            ORDER BY os.data_geracao DESC, os.nr_os DESC
            LIMIT 50
        `).all(...params);

        // 6. Filter Options (Cached or simplified if possible, but let's keep it consistent)
        // For performance, we'll only fetch options if no search is active
        let filterOptions = { responsaveis: [], setores: [], anos: [] };
        if (!numero_os) {
            filterOptions = {
                responsaveis: db.prepare(`SELECT DISTINCT responsavel FROM ordens_servico WHERE responsavel IS NOT NULL ORDER BY responsavel`).all().map(r => r.responsavel),
                setores: db.prepare(`SELECT DISTINCT setor_atual FROM ordens_servico WHERE setor_atual IS NOT NULL ORDER BY setor_atual`).all().map(s => s.setor_atual),
                anos: db.prepare(`SELECT DISTINCT strftime('%Y', data_geracao) as ano FROM ordens_servico WHERE data_geracao IS NOT NULL ORDER BY ano`).all().map(a => a.ano)
            };
        }

        // 7. Tempo Médio (Dias)
        const avgResult = db.prepare(`
            SELECT AVG(os.dias_pendente) as avgDays
            FROM ordens_servico os
            LEFT JOIN localidades l ON os.localidade_id = l.id
            ${whereClause}
        `).get(...params);
        const tempoMedio = avgResult.avgDays || 0;

        // 8. Total Corte por Débito
        const cortesDebitoResult = db.prepare(`
            SELECT COUNT(*) as total
            FROM ordens_servico os
            LEFT JOIN localidades l ON os.localidade_id = l.id
            ${whereClause} AND os.tipo_servico = 'CORTE POR DEBITO'
        `).get(...params);
        const totalCortesDebito = cortesDebitoResult.total;

        res.json({
            totalPendentes,
            tempoMedio,
            totalCortesDebito,
            dailyData,
            topSetores,
            topServicos,
            tableData,
            filterOptions
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Constantes para Feriados (2025 e 2026 - Nacionais e MA)
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
  if (current > end) return 0; // Fechou antes de gerar? Estranho, mas OK

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

router.get('/os/encerradas', (req, res) => {
    let { regional, ano, mes, responsavel } = req.query;
    if (!ano) return res.status(400).json({ error: 'Ano is required' });

    try {
        // Unified Filtering Logic (similar to pendentes)
        let whereBase = `WHERE os.data_geracao LIKE ?`;
        const paramsBase = [`${ano}-%`];

        if (regional && regional !== 'TODAS') {
            whereBase += ` AND l.regional = ?`;
            paramsBase.push(regional);
        }
        if (responsavel) {
            whereBase += ` AND os.responsavel = ?`;
            paramsBase.push(responsavel);
        }

        // 1. O.S. Geradas no Ano (Total Base)
        const allGenerated = db.prepare(`
            SELECT 
                SUBSTR(os.data_geracao, 6, 2) as mes_geracao,
                COUNT(*) as total
            FROM ordens_servico os
            LEFT JOIN localidades l ON os.localidade_id = l.id
            ${whereBase}
            GROUP BY mes_geracao
        `).all(...paramsBase);

        const generatedMap = {};
        let totalGeneratedYear = 0;
        allGenerated.forEach(row => {
            generatedMap[row.mes_geracao] = row.total;
            totalGeneratedYear += row.total;
        });

        // 2. O.S. Encerradas no Ano
        // Precisamos filtrar por data_encerramento para o total encerrado, 
        // mas mantendo os filtros de regional e responsavel.
        let whereClosed = `WHERE os.situacao_os = 'ENCERRADA' AND os.data_encerramento LIKE ?`;
        const paramsClosed = [`%/${ano}`];

        if (regional && regional !== 'TODAS') {
            whereClosed += ` AND l.regional = ?`;
            paramsClosed.push(regional);
        }
        if (responsavel) {
            whereClosed += ` AND os.responsavel = ?`;
            paramsClosed.push(responsavel);
        }

        const allClosed = db.prepare(`
            SELECT 
                SUBSTR(os.data_encerramento, 4, 2) as mes_encerramento,
                os.data_geracao,
                os.data_encerramento
            FROM ordens_servico os
            LEFT JOIN localidades l ON os.localidade_id = l.id
            ${whereClosed}
        `).all(...paramsClosed);

        const closedMap = {}; 
        const inSlaMap = {};  
        
        let totalClosedYear = 0;
        let totalInSlaYear = 0;

        allClosed.forEach(row => {
            const m = row.mes_encerramento;
            if (!closedMap[m]) closedMap[m] = 0;
            if (!inSlaMap[m]) inSlaMap[m] = 0;

            closedMap[m]++;
            totalClosedYear++;

            const diff = getBusinessDaysDiff(row.data_geracao, row.data_encerramento);
            if (diff >= 0 && diff <= 3) {
                inSlaMap[m]++;
                totalInSlaYear++;
            }
        });

        // Build Chart Data (1-12)
        const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        const chartData = [];
        
        for (let i = 1; i <= 12; i++) {
            const mStr = String(i).padStart(2, '0');
            const generated = generatedMap[mStr] || 0;
            const closed = closedMap[mStr] || 0;
            const inSla = inSlaMap[mStr] || 0;
            
            chartData.push({
                mes: MONTH_NAMES[i-1],
                geradas: generated,
                encerradas: closed,
                noPrazo: inSla,
                meta: Math.round(generated * 0.8)
            });
        }

        // Selected Month Metrics
        const selMesStr = mes ? mes.padStart(2, '0') : null;
        let mesPrevisto = 0;
        let mesRealizado = 0;

        if (selMesStr) {
            mesPrevisto = Math.round((generatedMap[selMesStr] || 0) * 0.8);
            mesRealizado = inSlaMap[selMesStr] || 0;
        } else {
            mesPrevisto = Math.round(totalGeneratedYear * 0.8);
            mesRealizado = totalInSlaYear;
        }

        // OS Pendentes Anos Anteriores
        const prevYear = parseInt(ano) - 1;
        let wherePend = `WHERE os.situacao_os = 'PENDENTE' AND os.data_geracao LIKE ?`;
        const paramsPend = [`${prevYear}-%`];
        if (regional && regional !== 'TODAS') {
            wherePend += ` AND l.regional = ?`;
            paramsPend.push(regional);
        }
        if (responsavel) {
            wherePend += ` AND os.responsavel = ?`;
            paramsPend.push(responsavel);
        }

        const pendentesAnterioresRow = db.prepare(`
            SELECT COUNT(*) as total
            FROM ordens_servico os
            LEFT JOIN localidades l ON os.localidade_id = l.id
            ${wherePend}
        `).get(...paramsPend);

        // 4. Ranking Regional (Baseado no Mês Selecionado)
        let regionalRanking = [];
        if (regional === 'TODAS' && mes && ano) {
            const mesFormatado = mes.padStart(2, '0');
            const patternGeracao = `${ano}-${mesFormatado}-%`;
            const patternEncerramento = `%/${mesFormatado}/${ano}`;

            const paramsRankGen = [patternGeracao];
            if (responsavel) paramsRankGen.push(responsavel);

            const genByReg = db.prepare(`
                SELECT l.regional as name, COUNT(*) as total
                FROM ordens_servico os
                LEFT JOIN localidades l ON os.localidade_id = l.id
                WHERE os.data_geracao LIKE ?
                ${responsavel ? 'AND os.responsavel = ?' : ''}
                GROUP BY l.regional
                HAVING name IS NOT NULL
            `).all(...paramsRankGen);

            const genRegMap = {};
            genByReg.forEach(r => genRegMap[r.name] = r.total);

            const paramsRankClosed = [patternEncerramento];
            if (responsavel) paramsRankClosed.push(responsavel);

            const closedByReg = db.prepare(`
                SELECT l.regional as name, os.data_geracao, os.data_encerramento
                FROM ordens_servico os
                LEFT JOIN localidades l ON os.localidade_id = l.id
                WHERE os.situacao_os = 'ENCERRADA'
                AND os.data_encerramento LIKE ?
                ${responsavel ? 'AND os.responsavel = ?' : ''}
            `).all(...paramsRankClosed);

            const regSlaCount = {};
            closedByReg.forEach(row => {
                if (!row.name) return;
                if (!regSlaCount[row.name]) regSlaCount[row.name] = 0;
                const diff = getBusinessDaysDiff(row.data_geracao, row.data_encerramento);
                if (diff >= 0 && diff <= 3) {
                    regSlaCount[row.name]++;
                }
            });

            regionalRanking = Object.keys(genRegMap).map(name => {
                const geradas = genRegMap[name] || 0;
                const noPrazo = regSlaCount[name] || 0;
                const meta = Math.round(geradas * 0.8);
                // Performance = % da Meta atingida (noPrazo / meta * 100)
                const porcentagem = meta > 0 ? (noPrazo / meta) * 100 : 0;

                return {
                    name,
                    realizado: noPrazo,
                    previsto: meta,
                    porcentagem
                };
            }).sort((a, b) => b.porcentagem - a.porcentagem);
        }

        // Fetch Responsáveis list for filtering
        const filterOptions = {
            responsaveis: db.prepare(`SELECT DISTINCT responsavel FROM ordens_servico WHERE responsavel IS NOT NULL ORDER BY responsavel`).all().map(r => r.responsavel)
        };

        res.json({
            gauge: {
                realizado: totalInSlaYear,
                totalPrevisto: Math.round(totalGeneratedYear * 0.8), // O previsto é 80% das geradas
                totalEncerradas: totalClosedYear,
                totalGeradas: totalGeneratedYear
            },
            mesPrevisto,
            mesRealizado,
            mesGeradas: selMesStr ? (generatedMap[selMesStr] || 0) : totalGeneratedYear,
            pendentesAnteriores: pendentesAnterioresRow?.total || 0,
            chartData,
            regionalRanking,
            filterOptions
        });

    } catch (err) {
        console.error("Erro no /os/encerradas:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
