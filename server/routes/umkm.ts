import { Router, Request, Response } from 'express';
import { query } from '../db';

export const umkmRouter = Router();

umkmRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { kategori } = req.query;
    const rows = await query<{ data: Record<string, unknown> }>(
      kategori
        ? 'SELECT data FROM umkm WHERE kategori = $1 ORDER BY seq ASC'
        : 'SELECT data FROM umkm ORDER BY seq ASC',
      kategori ? [String(kategori)] : []
    );
    res.json(rows.map((r) => r.data));
  } catch (err) {
    console.error('umkm GET error:', err);
    res.status(500).json({ message: 'Gagal membaca data' });
  }
});