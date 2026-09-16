import { Router } from 'express';
import { pool } from '../db';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  let db: 'ok' | 'error' = 'error';
  try {
    await pool.query('SELECT 1');
    db = 'ok';
  } catch {
    db = 'error';
  }
  res.json({
    status: db === 'ok' ? 'ok' : 'degraded',
    service: 'smart-village-api',
    db,
    time: new Date().toISOString(),
  });
});