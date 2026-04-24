import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './server/config/db.js';

// Rotas modulares
import statsRouter from './server/routes/stats.js';
import dashboardRouter from './server/routes/dashboard.js';
import cortesRouter from './server/routes/cortes.js';
import osRouter from './server/routes/os.js';
import importRouter from './server/routes/import.js';
import datasourceRouter from './server/routes/datasource.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ========== Schema do Banco (criação de tabelas e índices) ==========
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

// Índices de performance adicionais
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

// ========== Registro de Rotas ==========
app.use('/api', statsRouter);
app.use('/api', dashboardRouter);
app.use('/api', cortesRouter);
app.use('/api', osRouter);
app.use('/api', importRouter);
app.use('/api', datasourceRouter);

// ========== Inicialização ==========
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`📦 Fonte de dados ativa: ${(process.env.DATA_SOURCE || 'sqlite').toUpperCase()}`);
    if (process.env.PG_HOST) {
        console.log(`🐘 PostgreSQL configurado: ${process.env.PG_HOST}:${process.env.PG_PORT || 5432}/${process.env.PG_DATABASE}`);
    }
});
