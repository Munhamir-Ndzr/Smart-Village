import { Router, Request, Response } from 'express';
import { query } from '../db';

export const beritaRouter = Router();

beritaRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { kategori } = req.query;
    const rows = await query<{ data: Record<string, unknown> }>(
      kategori
        ? 'SELECT data FROM berita WHERE kategori = $1 ORDER BY seq ASC'
        : 'SELECT data FROM berita ORDER BY seq ASC',
      kategori ? [String(kategori)] : []
    );
    res.json(rows.map((r) => r.data));
  } catch (err) {
    console.error('berita GET error:', err);
    res.status(500).json({ message: 'Gagal membaca data' });
  }
});

beritaRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rows = await query<{ data: Record<string, unknown> }>(
      'SELECT data FROM berita WHERE id = $1 OR slug = $1',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Berita tidak ditemukan' });
    }
    res.json(rows[0].data);
  } catch (err) {
    console.error('berita detail error:', err);
    res.status(500).json({ message: 'Gagal membaca data' });
  }
});