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

export default router;
