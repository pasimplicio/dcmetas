import { Router } from 'express';
import pg from 'pg';
import fs from 'fs';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();

// ========== PostgreSQL Pool (lazy) ==========
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

// Estado da fonte de dados ativa
let activeDataSource = process.env.DATA_SOURCE || 'sqlite';

router.get('/datasource', (req, res) => {
    const pgConfigured = !!(process.env.PG_HOST && process.env.PG_DATABASE && process.env.PG_USER);
    res.json({
        active: activeDataSource,
        pgConfigured,
        pgHost: process.env.PG_HOST ? `${process.env.PG_HOST}:${process.env.PG_PORT || 5432}` : null,
        pgDatabase: process.env.PG_DATABASE || null
    });
});

router.post('/datasource', adminAuth, (req, res) => {
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

router.get('/datasource/test', async (req, res) => {
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

router.get('/pg/dashboard', async (req, res) => {
    if (activeDataSource !== 'postgres') {
        return res.status(400).json({ error: 'Fonte de dados ativa não é PostgreSQL.' });
    }
    // TODO: Implementar queries reais após mapeamento de tabelas
    res.status(501).json({ error: 'Queries de produção ainda não configuradas. Aguardando mapeamento de tabelas.' });
});

router.get('/pg/cortes', async (req, res) => {
    if (activeDataSource !== 'postgres') {
        return res.status(400).json({ error: 'Fonte de dados ativa não é PostgreSQL.' });
    }
    // TODO: Implementar queries reais após mapeamento de tabelas
    res.status(501).json({ error: 'Queries de produção ainda não configuradas. Aguardando mapeamento de tabelas.' });
});

export default router;
