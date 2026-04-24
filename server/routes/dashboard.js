import { Router } from 'express';
import db from '../config/db.js';

const router = Router();

router.get('/dashboard', (req, res) => {
    let { referencia, regional } = req.query;
    if (!referencia) return res.status(400).json({ error: 'Referencia is required' });

    // Normalize regional: if "TODAS", treat as null
    if (regional === 'TODAS' || !regional) regional = null;

    // Normalize referencia: YYYY-MM-DD -> MM/YYYY
    if (referencia.includes('-')) {
        const [y, m] = referencia.split('-');
        referencia = `${m}/${y}`;
    }

    try {
        // Query helpers for regional filtering (always via localidades.regional)
        const regFilter = regional ? 'AND l.regional = ?' : '';
        
        const params = regional ? [referencia, regional] : [referencia];

        // 1. Arrecadacao Mensal
        const arrecadacaoMes = db.prepare(`
            SELECT a.localidadeId, a.mesPagamento, a.dataPagamento, a.referencia, a.categoria, 
                   a.perfil, a.banco, a.formaArrecadacao, a.valorArrecadado, a.qtdDocumentos 
            FROM arrecadacao a
            JOIN localidades l ON a.localidadeId = l.id
            WHERE a.mesPagamento = ? ${regFilter}
        `).all(...params);

        // 2. Metas Regionais (filtro via localidades.regional)
        const metasRegMes = db.prepare(`
            SELECT mr.* FROM metas_regional mr
            JOIN localidades l ON mr.localidadeId = l.id
            WHERE mr.referencia = ? ${regFilter}
        `).all(...params);

        // 3. Metas Locais
        const metasLocMes = db.prepare(`
            SELECT ml.* FROM metas_localidade ml
            JOIN localidades l ON ml.localidadeId = l.id
            WHERE ml.referencia = ? ${regFilter}
        `).all(...params);

        const localidades = db.prepare('SELECT * FROM localidades').all();

        const [mActual, year] = referencia.split('/');
        
        // 4. Year data for Annual Chart
        const yearData = db.prepare(`
            SELECT a.mesPagamento, sum(a.valorArrecadado) as realizado 
            FROM arrecadacao a
            JOIN localidades l ON a.localidadeId = l.id
            WHERE a.mesPagamento LIKE ? ${regFilter}
            GROUP BY a.mesPagamento
        `).all(`%/${year}`, ...(regional ? [regional] : []));

        // 5. Year metas (filtro via localidades.regional)
        const yearMetas = db.prepare(`
            SELECT mr.referencia, sum(mr.valorPrevisto) as previsto 
            FROM metas_regional mr
            JOIN localidades l ON mr.localidadeId = l.id
            WHERE mr.referencia LIKE ? ${regFilter}
            GROUP BY mr.referencia
        `).all(`%/${year}`, ...(regional ? [regional] : []));

        // 5. Municipality x Month Matrix for the Detail Table
        const municipioMatrix = db.prepare(`
            SELECT 
                l.municipio, 
                a.mesPagamento, 
                SUM(a.valorArrecadado) as valor
            FROM arrecadacao a
            JOIN localidades l ON a.localidadeId = l.id
            WHERE a.mesPagamento LIKE ? ${regFilter}
            GROUP BY l.municipio, a.mesPagamento
            ORDER BY l.municipio
        `).all(`%/${year}`, ...(regional ? [regional] : []));

        // 6. Faturamento Total do Mês (Visual Check)
        const totalFaturamento = db.prepare(`
            SELECT SUM(f.valor_faturado) as total
            FROM faturamento f
            JOIN localidades l ON f.localidade_id = l.id
            WHERE f.referencia = ? ${regFilter}
        `).get(referencia, ...(regional ? [regional] : []))?.total || 0;

        // 7. Pagamentos Detalhados do Mês (Visual Check)
        const totalPagamentos = db.prepare(`
            SELECT SUM(p.valor_pagamento) as total
            FROM pagamentos p
            JOIN localidades l ON p.localidade_id = l.id
            WHERE p.referencia_pagamento = ? ${regFilter}
        `).get(referencia, ...(regional ? [regional] : []))?.total || 0;

        res.json({
            arrecadacaoMes,
            metasRegMes,
            metasLocMes,
            localidades,
            yearData,
            yearMetas,
            municipioMatrix,
            totalFaturamento,
            totalPagamentos
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
