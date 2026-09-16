import { Router, Response } from 'express';
import { query } from '../db';

export const pengumumanRouter = Router();

pengumumanRouter.get('/', async (_req, res: Response) => {
  try {
    const rows = await query<{ data: Record<string, unknown> }>(
      'SELECT data FROM pengumuman ORDER BY seq ASC'
    );
    res.json(rows.map((r) => r.data));
  } catch (err) {
    console.error('pengumuman GET error:', err);
    res.status(500).json({ message: 'Gagal membaca data' });
  }
});