import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database Initialization
const db = new Database('database.sqlite');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

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

  CREATE INDEX IF NOT EXISTS idx_arrec_mes ON arrecadacao(mesPagamento);
  CREATE INDEX IF NOT EXISTS idx_arrec_loc ON arrecadacao(localidadeId);
  CREATE INDEX IF NOT EXISTS idx_metas_ref ON metas_regional(referencia);
  CREATE INDEX IF NOT EXISTS idx_metas_loc_ref ON metas_localidade(referencia);
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

// API Endpoints
app.get('/api/stats', (req, res) => {
    const locCount = db.prepare('SELECT count(*) as count FROM localidades').get().count;
    const arrCount = db.prepare('SELECT count(*) as count FROM arrecadacao').get().count;
    const metCount = db.prepare('SELECT count(*) as count FROM metas_regional').get().count;
    const metLocCount = db.prepare('SELECT count(*) as count FROM metas_localidade').get().count;
    res.json({ localidade: locCount, arrecadacao: arrCount, meta_regional: metCount, meta_localidade: metLocCount });
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

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
