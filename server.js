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
import arrecadacaoRouter from './server/routes/arrecadacao.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '200mb' }));

// ========== Registro de Rotas ==========
app.use('/api/arrecadacao', arrecadacaoRouter);
app.use('/api', statsRouter);
app.use('/api', dashboardRouter);
app.use('/api', cortesRouter);
app.use('/api', osRouter);
app.use('/api', importRouter);
app.use('/api', datasourceRouter);

// ========== Frontend Estático (Produção/Docker) ==========
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');

import fsCheck from 'fs';
if (fsCheck.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('📁 Servindo frontend estático de ./dist');
}

// ========== Inicialização ==========
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`📦 Fonte de dados ativa: ${(process.env.DATA_SOURCE || 'sqlite').toUpperCase()}`);
    if (process.env.PG_HOST) {
        console.log(`🐘 PostgreSQL configurado: ${process.env.PG_HOST}:${process.env.PG_PORT || 5432}/${process.env.PG_DATABASE}`);
    }
});
