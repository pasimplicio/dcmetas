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

  CREATE INDEX IF NOT EXISTS idx_arrec_mes ON arrecadacao(mesPagamento);
  CREATE INDEX IF NOT EXISTS idx_metas_ref ON metas_regional(referencia);
`);

// API Endpoints
app.get('/api/stats', (req, res) => {
    const locCount = db.prepare('SELECT count(*) as count FROM localidades').get().count;
    const arrCount = db.prepare('SELECT count(*) as count FROM arrecadacao').get().count;
    const metCount = db.prepare('SELECT count(*) as count FROM metas_regional').get().count;
    res.json({ localidade: locCount, arrecadacao: arrCount, meta_regional: metCount });
});

app.post('/api/import', (req, res) => {
    const { type, data } = req.body;
    console.log(`Receiving import for: ${type} (${data.length} rows)`);

    try {
        if (type === 'localidade') {
            const insert = db.prepare('INSERT OR REPLACE INTO localidades (id, superintendencia, regional, nomeLocalidade, municipio, ibge) VALUES (?, ?, ?, ?, ?, ?)');
            const transaction = db.transaction((rows) => {
                for (const row of rows) insert.run(row.id, row.superintendencia, row.regional, row.nomeLocalidade, row.municipio, row.ibge);
            });
            transaction(data);
        } else if (type === 'arrecadacao') {
            const insert = db.prepare(`
                INSERT OR REPLACE INTO arrecadacao (
                    id, localidadeId, mesPagamento, dataPagamento, referencia, categoria, perfil, banco, formaArrecadacao, 
                    valorArrecadado, valorPago, valorDevolucao, valorFaturado, qtdDocumentos
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const transaction = db.transaction((rows) => {
                for (const row of rows) {
                    insert.run(
                        row.cloudId, row.localidadeId, row.mesPagamento, row.dataPagamento, row.referencia, 
                        row.categoria, row.perfil, row.banco, row.formaArrecadacao, 
                        row.valorArrecadado, row.valorPago, row.valorDevolucao, row.valorFaturado, row.qtdDocumentos
                    );
                }
            });
            transaction(data);
        } else if (type === 'meta_regional') {
            const insert = db.prepare('INSERT OR REPLACE INTO metas_regional (id, referencia, localidadeId, regional, categoria, valorPrevisto) VALUES (?, ?, ?, ?, ?, ?)');
            const transaction = db.transaction((rows) => {
                for (const row of rows) insert.run(row.cloudId, row.referencia, row.localidadeId, row.regional, row.categoria, row.valorPrevisto);
            });
            transaction(data);
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/clear', (req, res) => {
    try {
        db.exec('DELETE FROM arrecadacao; DELETE FROM localidades; DELETE FROM metas_regional;');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/dashboard', (req, res) => {
    let { referencia } = req.query;
    if (!referencia) return res.status(400).json({ error: 'Referencia is required' });

    // Normalize referencia: YYYY-MM-DD -> MM/YYYY
    if (referencia.includes('-')) {
        const [y, m] = referencia.split('-');
        referencia = `${m}/${y}`;
    }

    try {
        const arrecadacaoMes = db.prepare('SELECT * FROM arrecadacao WHERE mesPagamento = ?').all(referencia);
        const metasRegMes = db.prepare('SELECT * FROM metas_regional WHERE referencia = ?').all(referencia);
        const localidades = db.prepare('SELECT * FROM localidades').all();

        const [mActual, year] = referencia.split('/');
        
        // Fetch Year data for Annual Chart
        const yearData = db.prepare('SELECT mesPagamento, sum(valorArrecadado) as realizado FROM arrecadacao WHERE mesPagamento LIKE ? GROUP BY mesPagamento').all(`%/${year}`);
        const yearMetas = db.prepare('SELECT referencia, sum(valorPrevisto) as previsto FROM metas_regional WHERE referencia LIKE ? GROUP BY referencia').all(`%/${year}`);

        // Municipality x Month Matrix for the Table
        const municipioMatrix = db.prepare(`
            SELECT 
                l.municipio, 
                a.mesPagamento, 
                SUM(a.valorArrecadado) as valor
            FROM arrecadacao a
            JOIN localidades l ON a.localidadeId = l.id
            WHERE a.mesPagamento LIKE ?
            GROUP BY l.municipio, a.mesPagamento
        `).all(`%/${year}`);

        res.json({
            arrecadacaoMes,
            metasRegMes,
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
