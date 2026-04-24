import { Router } from 'express';
import db from '../config/db.js';

const router = Router();

router.get('/stats', (req, res) => {
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

router.get('/regionais', (req, res) => {
    try {
        const rows = db.prepare("SELECT DISTINCT regional FROM localidades WHERE regional IS NOT NULL AND regional != '' ORDER BY regional").all();
        res.json(rows.map(r => r.regional));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
