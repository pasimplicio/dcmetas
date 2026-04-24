import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.SQLITE_PATH || 'database.sqlite';
const dbDir = path.dirname(dbPath);

if (dbDir !== '.' && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

// ========== Inicialização do Schema ==========
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
    valor_cobranca REAL,
    motivo_encerramento TEXT
  );

  CREATE TABLE IF NOT EXISTS faturamento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    localidade INTEGER,
    referencia TEXT,
    data_faturamento TEXT,
    valor_faturado REAL
  );

  CREATE TABLE IF NOT EXISTS pagamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matricula INTEGER,
    localidade INTEGER,
    numero_conta TEXT,
    referencia_pagamento TEXT,
    data_pagamento TEXT,
    valor_pagamento REAL
  );

  CREATE INDEX IF NOT EXISTS idx_arrec_mes ON arrecadacao(mesPagamento);
  CREATE INDEX IF NOT EXISTS idx_arrec_loc ON arrecadacao(localidadeId);
  CREATE INDEX IF NOT EXISTS idx_metas_ref ON metas_regional(referencia);
  CREATE INDEX IF NOT EXISTS idx_metas_loc_ref ON metas_localidade(referencia);
  CREATE INDEX IF NOT EXISTS idx_cortes_mes ON cortes(mesEmissao);
  CREATE INDEX IF NOT EXISTS idx_cortes_loc ON cortes(localidadeId);
  CREATE INDEX IF NOT EXISTS idx_os_situacao ON ordens_servico(situacao_os);
  CREATE INDEX IF NOT EXISTS idx_os_data ON ordens_servico(data_geracao);

  -- Índices de Faturamento e Pagamentos (Performance para milhões de registros)
  CREATE INDEX IF NOT EXISTS idx_fat_ref ON faturamento(referencia);
  CREATE INDEX IF NOT EXISTS idx_fat_loc ON faturamento(localidade);
  CREATE INDEX IF NOT EXISTS idx_pag_ref ON pagamentos(referencia_pagamento);
  CREATE INDEX IF NOT EXISTS idx_pag_loc ON pagamentos(localidade);
  CREATE INDEX IF NOT EXISTS idx_pag_mat ON pagamentos(matricula);
  CREATE INDEX IF NOT EXISTS idx_pag_data ON pagamentos(data_pagamento);

  -- Índices de performance
  CREATE INDEX IF NOT EXISTS idx_os_performance ON ordens_servico(situacao_os, data_geracao DESC, nr_os DESC);
  CREATE INDEX IF NOT EXISTS idx_os_responsavel ON ordens_servico(responsavel);
  CREATE INDEX IF NOT EXISTS idx_os_setor ON ordens_servico(setor_atual);
  CREATE INDEX IF NOT EXISTS idx_os_lookup ON ordens_servico(nr_os, situacao_os);
`);

console.log("✅ Banco de dados e schema inicializados.");

export default db;
