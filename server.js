import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ========== Active Data Source ==========
let activeDataSource = process.env.DATA_SOURCE || 'sqlite';

// ========== SQLite Initialization ==========
const db = new Database('database.sqlite');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

// ========== PostgreSQL Pool (lazy, somente leitura) ==========
let pgPool = null;

const getPgPool = () => {
    if (!pgPool) {
        pgPool = new pg.Pool({
            host: process.env.PG_HOST,
            port: parseInt(process.env.PG_PORT || '5432'),
            database: process.env.PG_DATABASE,
            user: process.env.PG_USER,
            password: process.env.PG_PASSWORD,
            max: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });
        pgPool.on('error', (err) => {
            console.error('PostgreSQL pool error:', err.message);
        });
    }
    return pgPool;
};

db.exec(`
  CREATE TABLE IF NOT EXISTS localidades (
    id INTEGER PRIMARY KEY,
    superintendencia TEXT,
    regional TEXT,
    nomeLocalidade TEXT,
    municipio TEXT,
    ibge TEXT
  );

  CREATE TABLE IF NOT EXISTS arrecadacao (
    id TEXT PRIMARY KEY,
    localidadeId INTEGER,
    mesPagamento TEXT,
    dataPagamento TEXT,
    referencia TEXT,
    categoria TEXT,
    perfil TEXT,
    banco TEXT,
    formaArrecadacao TEXT,
    valorArrecadado REAL,
    valorPago REAL,
    valorDevolucao REAL,
    valorFaturado REAL,
    qtdDocumentos INTEGER
  );

  CREATE TABLE IF NOT EXISTS metas_regional (
    id TEXT PRIMARY KEY,
    referencia TEXT,
    localidadeId INTEGER,
    regional TEXT,
    categoria TEXT,
    valorPrevisto REAL
  );

  CREATE TABLE IF NOT EXISTS metas_localidade (
    id TEXT PRIMARY KEY,
    referencia TEXT,
    localidadeId INTEGER,
    valorPrevisto REAL
  );

  CREATE TABLE IF NOT EXISTS cortes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matricula INTEGER,
    categoria TEXT,
    localidadeId INTEGER,
    situacaoAgua TEXT,
    dataEmissao TEXT,
    mesEmissao TEXT,
    tipoDocumento TEXT,
    formaEmissao TEXT,
    acaoCobranca TEXT,
    valorDocumento REAL,
    situacaoAcao TEXT,
    dataAcao TEXT,
    situacaoDebito TEXT,
    motivoEncerramento TEXT
  );

  CREATE TABLE IF NOT EXISTS ordens_servico (
    nr_os TEXT PRIMARY KEY,
    tipo_servico TEXT,
    situacao_os TEXT,
    responsavel TEXT,
    data_geracao TEXT,
    dias_pendente INTEGER,
    data_encerramento TEXT,
    localidade_id INTEGER,
    data_programada TEXT,
    equipe_programada TEXT,
    setor_atual TEXT,
    valor_cobranca REAL
  );

  CREATE INDEX IF NOT EXISTS idx_arrec_mes ON arrecadacao(mesPagamento);
  CREATE INDEX IF NOT EXISTS idx_arrec_loc ON arrecadacao(localidadeId);
  CREATE INDEX IF NOT EXISTS idx_metas_ref ON metas_regional(referencia);
  CREATE INDEX IF NOT EXISTS idx_metas_loc_ref ON metas_localidade(referencia);
  CREATE INDEX IF NOT EXISTS idx_cortes_mes ON cortes(mesEmissao);
  CREATE INDEX IF NOT EXISTS idx_cortes_loc ON cortes(localidadeId);
  CREATE INDEX IF NOT EXISTS idx_os_situacao ON ordens_servico(situacao_os);
  CREATE INDEX IF NOT EXISTS idx_os_data ON ordens_servico(data_geracao);
`);

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
    INSERT OR REPLACE INTO ordens_servico (
      nr_os, tipo_servico, situacao_os, responsavel, data_geracao, dias_pendente, 
      data_encerramento, localidade_id, data_programada, equipe_programada, setor_atual, valor_cobranca
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      row.equipe_programada, row.setor_atual, row.valor_cobranca
    );
  }
});

// API Endpoints
app.get('/api/stats', (req, res) => {
    const locCount = db.prepare('SELECT count(*) as count FROM localidades').get().count;
    const arrCount = db.prepare('SELECT count(*) as count FROM arrecadacao').get().count;
    const metCount = db.prepare('SELECT count(*) as count FROM metas_regional').get().count;
    const metLocCount = db.prepare('SELECT count(*) as count FROM metas_localidade').get().count;
    const cortesCount = db.prepare('SELECT count(*) as count FROM cortes').get().count;
    const osCount = db.prepare('SELECT count(*) as count FROM ordens_servico').get().count;
    res.json({ 
      localidade: locCount, 
      arrecadacao: arrCount, 
      meta_regional: metCount, 
      meta_localidade: metLocCount, 
      cortes: cortesCount,
      os: osCount
    });
});

app.post('/api/import', (req, res) => {
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
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/clear', (req, res) => {
    console.log("POST /api/clear - Clearing all tables");
    try {
        db.prepare('DELETE FROM arrecadacao').run();
        db.prepare('DELETE FROM localidades').run();
        db.prepare('DELETE FROM metas_regional').run();
        db.prepare('DELETE FROM metas_localidade').run();
        db.prepare('DELETE FROM cortes').run();
        
        console.log("Database cleared successfully");
        res.json({ success: true });
    } catch (err) {
        console.error("Error clearing database:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/regionais', (req, res) => {
    try {
        const rows = db.prepare("SELECT DISTINCT regional FROM localidades WHERE regional IS NOT NULL AND regional != '' ORDER BY regional").all();
        res.json(rows.map(r => r.regional));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/dashboard', (req, res) => {
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

        res.json({
            arrecadacaoMes,
            metasRegMes,
            metasLocMes,
            localidades,
            yearData,
            yearMetas,
            municipioMatrix
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/cortes', (req, res) => {
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

// Endpoint de Exportação CSV para Excel
app.get('/api/os/pendentes/export', (req, res) => {
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

app.get('/api/os/pendentes', (req, res) => {
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

        res.json({
            totalPendentes,
            tempoMedio,
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



// ========== Data Source Configuration Endpoints ==========

app.get('/api/datasource', (req, res) => {
    const pgConfigured = !!(process.env.PG_HOST && process.env.PG_DATABASE && process.env.PG_USER);
    res.json({
        active: activeDataSource,
        pgConfigured,
        pgHost: process.env.PG_HOST ? `${process.env.PG_HOST}:${process.env.PG_PORT || 5432}` : null,
        pgDatabase: process.env.PG_DATABASE || null
    });
});

app.post('/api/datasource', (req, res) => {
    const { source } = req.body;
    if (source !== 'sqlite' && source !== 'postgres') {
        return res.status(400).json({ error: 'Fonte inválida. Use "sqlite" ou "postgres".' });
    }
    if (source === 'postgres') {
        if (!process.env.PG_HOST || !process.env.PG_DATABASE || !process.env.PG_USER) {
            return res.status(400).json({ error: 'PostgreSQL não configurado. Preencha o arquivo .env com as credenciais.' });
        }
    }
    activeDataSource = source;
    
    // Persist to .env
    try {
        let envContent = fs.readFileSync('.env', 'utf8');
        if (envContent.includes('DATA_SOURCE=')) {
            envContent = envContent.replace(/DATA_SOURCE=.*/, `DATA_SOURCE=${source}`);
        } else {
            envContent = `DATA_SOURCE=${source}\n` + envContent;
        }
        fs.writeFileSync('.env', envContent);
    } catch (err) {
        console.error('Falha ao salvar fonte de dados no .env:', err.message);
    }

    console.log(`🔄 Fonte de dados alterada e salva: ${source.toUpperCase()}`);
    res.json({ success: true, active: activeDataSource });
});

// Create indexes for performance
try {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_os_performance ON ordens_servico(situacao_os, data_geracao DESC, nr_os DESC);
    CREATE INDEX IF NOT EXISTS idx_os_responsavel ON ordens_servico(responsavel);
    CREATE INDEX IF NOT EXISTS idx_os_setor ON ordens_servico(setor_atual);
    CREATE INDEX IF NOT EXISTS idx_os_lookup ON ordens_servico(nr_os, situacao_os);
  `);
  console.log("✅ Índices de performance garantidos.");
} catch (err) {
  console.error("❌ Erro ao criar índices:", err.message);
}

app.get('/api/datasource/test', async (req, res) => {
    if (!process.env.PG_HOST || !process.env.PG_DATABASE || !process.env.PG_USER) {
        return res.json({ success: false, error: 'PostgreSQL não configurado no .env' });
    }
    let client;
    try {
        const pool = getPgPool();
        client = await pool.connect();
        const result = await client.query('SELECT version()');
        const version = result.rows[0].version;
        
        res.json({ 
            success: true, 
            version,
            host: process.env.PG_HOST,
            database: process.env.PG_DATABASE
        });
    } catch (err) {
        console.error('PostgreSQL test failed:', err.message);
        res.json({ success: false, error: err.message });
    } finally {
        if (client) client.release();
    }
});

// ========== PostgreSQL Dashboard Endpoint (placeholder) ==========
// As queries serão preenchidas após o usuário fornecer tabelas/schemas/campos

app.get('/api/pg/dashboard', async (req, res) => {
    if (activeDataSource !== 'postgres') {
        return res.status(400).json({ error: 'Fonte de dados ativa não é PostgreSQL.' });
    }
    // TODO: Implementar queries reais após mapeamento de tabelas
    res.status(501).json({ error: 'Queries de produção ainda não configuradas. Aguardando mapeamento de tabelas.' });
});

app.get('/api/pg/cortes', async (req, res) => {
    if (activeDataSource !== 'postgres') {
        return res.status(400).json({ error: 'Fonte de dados ativa não é PostgreSQL.' });
    }
    // TODO: Implementar queries reais após mapeamento de tabelas
    res.status(501).json({ error: 'Queries de produção ainda não configuradas. Aguardando mapeamento de tabelas.' });
});

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`📦 Fonte de dados ativa: ${activeDataSource.toUpperCase()}`);
    if (process.env.PG_HOST) {
        console.log(`🐘 PostgreSQL configurado: ${process.env.PG_HOST}:${process.env.PG_PORT || 5432}/${process.env.PG_DATABASE}`);
    }
});
