import { Router } from 'express';
import db from '../config/db.js';

const router = Router();

router.get('/cortes', (req, res) => {
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
        const regFilter = regional ? 'AND l.regional = ?' : '';
        const params = regional ? [referencia, regional] : [referencia];

        const baseQuery = `
            SELECT 
                c.situacaoAcao,
                c.situacaoDebito,
                c.valorDocumento,
                c.tipoDocumento,
                c.dataEmissao,
                c.dataAcao,
                l.regional
            FROM cortes c
            JOIN localidades l ON c.localidadeId = l.id
            WHERE c.mesEmissao = ? ${regFilter}
        `;

        const rows = db.prepare(baseQuery).all(...params);

        let totalEmissao = 0;
        let totalCorte = 0;
        let qtdePago = 0;
        let qtdePagoAntes = 0;
        
        let valorCobrado = 0;
        let valorPago = 0;
        let valorPagoAntes = 0;
        let valorPagoApos = 0;
        let valorCobradoCortado = 0;

        const dateMap = {}; // para graficos diarios
        const regionalMap = {}; // para tabela inferior

        rows.forEach(r => {
            const isOrdemCorte = r.tipoDocumento === 'ORDEM DE CORTE';
            if (isOrdemCorte) totalEmissao++;

            const isExecutada = r.situacaoAcao === 'EXECUTADA';
            if (isExecutada) {
                totalCorte++;
                valorCobradoCortado += r.valorDocumento;
            }

            const isPagoOuParcelado = r.situacaoDebito === 'PAGO' || r.situacaoDebito === 'PARCELADO';
            
            valorCobrado += r.valorDocumento;

            if (isPagoOuParcelado) {
                qtdePago++;
                valorPago += r.valorDocumento;

                if (!isExecutada) {
                    qtdePagoAntes++;
                    valorPagoAntes += r.valorDocumento;
                } else {
                    valorPagoApos += r.valorDocumento;
                }
            }

            // Agrupamento diario (usando data emissao como base)
            if (!dateMap[r.dataEmissao]) {
                dateMap[r.dataEmissao] = { data: r.dataEmissao, emitido: 0, executado: 0 };
            }
            if (isOrdemCorte) dateMap[r.dataEmissao].emitido++;
            if (isExecutada) dateMap[r.dataEmissao].executado++;

            // Agrupamento por Regional
            if (!regionalMap[r.regional]) {
                regionalMap[r.regional] = { regional: r.regional, emitido: 0, executado: 0, valorCobrado: 0, valorPago: 0 };
            }
            if (isOrdemCorte) regionalMap[r.regional].emitido++;
            if (isExecutada) regionalMap[r.regional].executado++;
            regionalMap[r.regional].valorCobrado += r.valorDocumento;
            if (isPagoOuParcelado) regionalMap[r.regional].valorPago += r.valorDocumento;
        });

        // Metricas finais
        const pctCorte = totalEmissao > 0 ? (totalCorte / totalEmissao) * 100 : 0;
        const pctRecebidoAntes = valorCobrado > 0 ? (valorPagoAntes / valorCobrado) * 100 : 0;
        const pctRecebidoPos = valorCobradoCortado > 0 ? (valorPagoApos / valorCobradoCortado) * 100 : 0;
        const pctRecebidoTotal = valorCobrado > 0 ? (valorPago / valorCobrado) * 100 : 0;

        const qtdePagoApos = qtdePago - qtdePagoAntes;

        const dailyData = Object.values(dateMap).sort((a, b) => a.data.localeCompare(b.data));
        const regionalData = Object.values(regionalMap).sort((a, b) => a.regional.localeCompare(b.regional));

        res.json({
            metrics: {
                totalEmissao,
                totalCorte,
                pctCorte,
                qtdePago,
                qtdePagoAntes,
                qtdePagoApos,
                valorCobrado,
                valorPago,
                valorPagoAntes,
                valorPagoApos,
                valorCobradoCortado,
                pctRecebidoAntes,
                pctRecebidoPos,
                pctRecebidoTotal
            },
            dailyData,
            regionalData
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
