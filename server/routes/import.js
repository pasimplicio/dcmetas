import { Router } from 'express';
import db from '../config/db.js';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();

// Prepared statements (created once, reused)
const stmts = {
  insertLoc: db.prepare('INSERT OR REPLACE INTO localidades (id, superintendencia, regional, nomeLocalidade, municipio, ibge) VALUES (?, ?, ?, ?, ?, ?)'),
  insertArr: db.prepare(`
    INSERT OR REPLACE INTO arrecadacao (
      id, localidadeId, mesPagamento, dataPagamento, referencia, categoria, perfil, banco, formaArrecadacao, 
      valorArrecadado, valorPago, valorDevolucao, valorFaturado, qtdDocumentos
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  insertMeta: db.prepare('INSERT OR REPLACE INTO metas_regional (id, referencia, localidadeId, regional, categoria, valorPrevisto) VALUES (?, ?, ?, ?, ?, ?)'),
  insertMetaLoc: db.prepare('INSERT OR REPLACE INTO metas_localidade (id, referencia, localidadeId, valorPrevisto) VALUES (?, ?, ?, ?)'),
  insertCorte: db.prepare(`
    INSERT INTO cortes (
      matricula, categoria, localidadeId, situacaoAgua, dataEmissao, mesEmissao, tipoDocumento, 
      formaEmissao, acaoCobranca, valorDocumento, situacaoAcao, dataAcao, situacaoDebito, motivoEncerramento
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  insertOS: db.prepare(`
    INSERT INTO ordens_servico (
      nr_os, tipo_servico, situacao_os, responsavel, data_geracao, dias_pendente, 
      data_encerramento, localidade_id, data_programada, equipe_programada, setor_atual, valor_cobranca, motivo_encerramento
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(nr_os) DO UPDATE SET
      tipo_servico = excluded.tipo_servico,
      situacao_os = excluded.situacao_os,
      responsavel = excluded.responsavel,
      data_geracao = excluded.data_geracao,
      dias_pendente = excluded.dias_pendente,
      data_encerramento = excluded.data_encerramento,
      localidade_id = excluded.localidade_id,
      data_programada = excluded.data_programada,
      equipe_programada = excluded.equipe_programada,
      setor_atual = excluded.setor_atual,
      valor_cobranca = excluded.valor_cobranca,
      motivo_encerramento = excluded.motivo_encerramento
    WHERE excluded.motivo_encerramento = 'CONCLUSAO DO SERVICO' 
       OR ordens_servico.motivo_encerramento IS NULL 
       OR ordens_servico.motivo_encerramento != 'CONCLUSAO DO SERVICO'
  `),
  insertFat: db.prepare(`
    INSERT INTO faturamento (
      localidade, referencia, data_faturamento, valor_faturado
    ) VALUES (?, ?, ?, ?)
  `),
  insertPag: db.prepare(`
    INSERT INTO pagamentos (
      matricula, localidade, numero_conta, referencia_pagamento, data_pagamento, valor_pagamento
    ) VALUES (?, ?, ?, ?, ?, ?)
  `)
};

// Transactions
const insertLocalidades = db.transaction((rows) => {
  for (const row of rows) stmts.insertLoc.run(row.id, row.superintendencia, row.regional, row.nomeLocalidade, row.municipio, row.ibge);
});

const insertArrecadacao = db.transaction((rows) => {
  for (const row of rows) {
    stmts.insertArr.run(
      row.cloudId, row.localidadeId, row.mesPagamento, row.dataPagamento, row.referencia,
      row.categoria, row.perfil, row.banco, row.formaArrecadacao,
      row.valorArrecadado, row.valorPago, row.valorDevolucao, row.valorFaturado, row.qtdDocumentos
    );
  }
});

const insertMetasRegional = db.transaction((rows) => {
  for (const row of rows) stmts.insertMeta.run(row.cloudId, row.referencia, row.localidadeId, row.regional, row.categoria, row.valorPrevisto);
});

const insertMetasLocalidade = db.transaction((rows) => {
  for (const row of rows) stmts.insertMetaLoc.run(row.cloudId, row.referencia, row.localidadeId, row.valorPrevisto);
});

const insertCortes = db.transaction((rows) => {
  for (const row of rows) {
    stmts.insertCorte.run(
      row.matricula, row.categoria, row.localidadeId, row.situacaoAgua, row.dataEmissao, row.mesEmissao, 
      row.tipoDocumento, row.formaEmissao, row.acaoCobranca, row.valorDocumento, 
      row.situacaoAcao, row.dataAcao, row.situacaoDebito, row.motivoEncerramento
    );
  }
});

const insertOS = db.transaction((rows) => {
  for (const row of rows) {
    stmts.insertOS.run(
      row.nr_os, row.tipo_servico, row.situacao_os, row.responsavel, row.data_geracao,
      row.dias_pendente, row.data_encerramento, row.localidade_id, row.data_programada,
      row.equipe_programada, row.setor_atual, row.valor_cobranca, row.motivo_encerramento
    );
  }
});

const insertFaturamento = db.transaction((rows) => {
  for (const row of rows) {
    stmts.insertFat.run(row.localidade, row.referencia, row.data_faturamento, row.valor_faturado);
  }
});

const insertPagamentos = db.transaction((rows) => {
  for (const row of rows) {
    stmts.insertPag.run(
      row.matricula, row.localidade, row.numero_conta, 
      row.referencia_pagamento, row.data_pagamento, row.valor_pagamento
    );
  }
});

router.post('/import', adminAuth, (req, res) => {
    const { type, data, clearFirst } = req.body;
    console.log(`Receiving import for: ${type} (${data.length} rows, clearFirst: ${!!clearFirst})`);

    try {
        if (type === 'localidade') {
            if (clearFirst) db.exec('DELETE FROM localidades');
            insertLocalidades(data);
        } else if (type === 'arrecadacao') {
            if (clearFirst) db.exec('DELETE FROM arrecadacao');
            insertArrecadacao(data);
        } else if (type === 'meta_regional') {
            if (clearFirst) db.exec('DELETE FROM metas_regional');
            insertMetasRegional(data);
        } else if (type === 'meta_localidade') {
            if (clearFirst) db.exec('DELETE FROM metas_localidade');
            insertMetasLocalidade(data);
        } else if (type === 'cortes') {
            if (clearFirst) db.exec('DELETE FROM cortes');
            insertCortes(data);
        } else if (type === 'os') {
            if (clearFirst) db.exec('DELETE FROM ordens_servico');
            insertOS(data);
        } else if (type === 'faturamento') {
            if (clearFirst) db.exec('DELETE FROM faturamento');
            insertFaturamento(data);
        } else if (type === 'pagamentos') {
            if (clearFirst) db.exec('DELETE FROM pagamentos');
            insertPagamentos(data);
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/clear-table', adminAuth, (req, res) => {
    const { type } = req.body;
    console.log(`POST /api/clear-table - Clearing table: ${type}`);
    
    const tables = {
        localidade: 'localidades',
        arrecadacao: 'arrecadacao',
        meta_regional: 'metas_regional',
        meta_localidade: 'metas_localidade',
        cortes: 'cortes',
        os: 'ordens_servico',
        faturamento: 'faturamento',
        pagamentos: 'pagamentos'
    };

    const tableName = tables[type];
    if (!tableName) return res.status(400).json({ error: 'Tipo de tabela inválido' });

    try {
        db.prepare(`DELETE FROM ${tableName}`).run();
        res.json({ success: true });
    } catch (err) {
        console.error("Error clearing table:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/clear', adminAuth, (req, res) => {
    console.log("POST /api/clear - Clearing all tables");
    try {
        db.prepare('DELETE FROM arrecadacao').run();
        db.prepare('DELETE FROM localidades').run();
        db.prepare('DELETE FROM metas_localidade').run();
        db.prepare('DELETE FROM metas_regional').run();
        db.prepare('DELETE FROM cortes').run();
        db.prepare('DELETE FROM ordens_servico').run();
        db.prepare('DELETE FROM faturamento').run();
        db.prepare('DELETE FROM pagamentos').run();
        
        console.log("Database cleared successfully");
        res.json({ success: true });
    } catch (err) {
        console.error("Error clearing database:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
