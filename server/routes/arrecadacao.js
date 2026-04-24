import { Router } from 'express';
import db from '../config/db.js';

const router = Router();

// Helper para filtrar por regional
const getRegionalFilter = (regional) => {
    if (!regional || regional === 'TODAS') return '';
    return ' AND l.regional = ? ';
};

// 1. Endpoint: /api/arrecadacao/resumo
router.get('/resumo', (req, res) => {
    const { referencia, regional } = req.query;
    if (!referencia) return res.status(400).json({ error: 'Referência é obrigatória' });

    try {
        const regFilter = getRegionalFilter(regional);
        const params = regional && regional !== 'TODAS' ? [referencia, regional] : [referencia];

        // Total Faturado
        const faturamentoData = db.prepare(`
            SELECT SUM(f.valor_faturado) as total
            FROM faturamento f
            JOIN localidades l ON f.localidade = l.id
            WHERE f.referencia = ? ${regFilter}
        `).get(...params);

        // Total Pago
        const pagamentoData = db.prepare(`
            SELECT SUM(p.valor_pagamento) as total
            FROM pagamentos p
            JOIN localidades l ON p.localidade = l.id
            WHERE p.referencia_pagamento = ? ${regFilter}
        `).get(...params);

        const totalFaturado = faturamentoData?.total || 0;
        const totalPago = pagamentoData?.total || 0;
        const taxaInadimplencia = totalFaturado > 0 ? ((totalFaturado - totalPago) / totalFaturado) * 100 : 0;

        res.json({
            referencia,
            regional: regional || 'TODAS',
            totalFaturado,
            totalPago,
            taxaInadimplencia: Math.max(0, taxaInadimplencia) // Evitar negativo se pago > faturado
        });
    } catch (error) {
        console.error("Erro no /resumo:", error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Endpoint: /api/arrecadacao/comparativo
router.get('/comparativo', (req, res) => {
    const { year, regional } = req.query;
    if (!year) return res.status(400).json({ error: 'Ano é obrigatório' });

    try {
        const currentYear = parseInt(year);
        const previousYear = currentYear - 1;
        const regFilter = getRegionalFilter(regional);
        
        // Pega todos os pagamentos dos dois anos
        const queryParams = regional && regional !== 'TODAS' 
            ? [`%/${currentYear}`, `%/${previousYear}`, regional] 
            : [`%/${currentYear}`, `%/${previousYear}`];

        const dados = db.prepare(`
            SELECT 
                SUBSTR(a.mesPagamento, 1, 2) as mes,
                SUBSTR(a.mesPagamento, 4, 4) as ano,
                SUM(a.valorArrecadado) as total
            FROM arrecadacao a
            JOIN localidades l ON a.localidadeId = l.id
            WHERE (a.mesPagamento LIKE ? OR a.mesPagamento LIKE ?)
            ${regFilter ? 'AND l.regional = ?' : ''}
            GROUP BY ano, mes
            ORDER BY ano, mes
        `).all(...queryParams);

        res.json({
            currentYear,
            previousYear,
            dados
        });
    } catch (error) {
        console.error("Erro no /comparativo:", error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Endpoint: /api/arrecadacao/curva - Comparativo entre 2 meses (baseado em data_pagamento)
router.get('/curva', (req, res) => {
    const { mes1, mes2, regional } = req.query;
    if (!mes1) return res.status(400).json({ error: 'mes1 é obrigatório' });

    try {
        const regFilter = getRegionalFilter(regional);

        // Converte "MM/YYYY" para "YYYY-MM" para filtrar data_pagamento
        const toDbMonth = (mmyyyy) => {
            const [m, y] = mmyyyy.split('/');
            return `${y}-${m}`;
        };

        // Helper: busca pagamentos diários pelo mês da DATA DE PAGAMENTO
        const getDailyPayments = (mesRef) => {
            const dbMonth = toDbMonth(mesRef);
            const params = regional && regional !== 'TODAS' ? [dbMonth + '%', regional] : [dbMonth + '%'];
            return db.prepare(`
                SELECT 
                    CAST(SUBSTR(p.data_pagamento, 9, 2) AS INTEGER) as dia,
                    SUM(p.valor_pagamento) as total_dia
                FROM pagamentos p
                JOIN localidades l ON p.localidade = l.id
                WHERE p.data_pagamento LIKE ? ${regFilter}
                GROUP BY dia
                HAVING dia > 0 AND dia <= 31
                ORDER BY dia ASC
            `).all(...params);
        };

        const dailyMes1 = getDailyPayments(mes1);
        const dailyMes2 = mes2 ? getDailyPayments(mes2) : [];

        // Build a unified day-by-day table (1..31)
        const mes1Map = {};
        let totalMes1 = 0;
        dailyMes1.forEach(d => { mes1Map[d.dia] = d.total_dia; totalMes1 += d.total_dia; });

        const mes2Map = {};
        let totalMes2 = 0;
        dailyMes2.forEach(d => { mes2Map[d.dia] = d.total_dia; totalMes2 += d.total_dia; });

        const maxDay = Math.max(
            ...Object.keys(mes1Map).map(Number),
            ...Object.keys(mes2Map).map(Number),
            1
        );

        let acumMes1 = 0;
        let acumMes2 = 0;
        const curva = [];

        for (let dia = 1; dia <= maxDay; dia++) {
            const valMes1 = mes1Map[dia] || 0;
            const valMes2 = mes2Map[dia] || 0;
            acumMes1 += valMes1;
            acumMes2 += valMes2;
            const pctDia = valMes2 > 0 ? (valMes1 / valMes2) * 100 : 0;
            const gap = valMes1 - valMes2;

            curva.push({
                dia,
                pagMes1: valMes1,
                pagMes2: valMes2,
                acumMes1,
                acumMes2,
                percentual: pctDia,
                gap
            });
        }

        res.json({
            mes1,
            mes2: mes2 || null,
            totalMes1,
            totalMes2,
            percentualGeral: totalMes2 > 0 ? (totalMes1 / totalMes2) * 100 : 0,
            gapTotal: totalMes1 - totalMes2,
            curva
        });
    } catch (error) {
        console.error("Erro no /curva:", error);
        res.status(500).json({ error: error.message });
    }
});

// 4. Endpoint: /api/arrecadacao/curva/meses - Lista meses disponíveis baseado em data_pagamento
router.get('/curva/meses', (req, res) => {
    try {
        const meses = db.prepare(`
            SELECT DISTINCT 
                SUBSTR(data_pagamento, 6, 2) || '/' || SUBSTR(data_pagamento, 1, 4) as ref
            FROM pagamentos
            WHERE data_pagamento IS NOT NULL AND LENGTH(data_pagamento) >= 10
            ORDER BY SUBSTR(data_pagamento, 1, 7) DESC
        `).all();
        res.json(meses.map(m => m.ref));
    } catch (error) {
        console.error("Erro no /curva/meses:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
