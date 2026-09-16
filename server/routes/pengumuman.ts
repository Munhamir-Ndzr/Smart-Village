import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth } from '../middleware/auth';

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

pengumumanRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const judul = body.judul || body.Judul;
    if (!judul) {
      return res.status(400).json({ message: 'Judul pengumuman wajib diisi' });
    }
    const year = new Date().getFullYear();
    const seq = String(Math.floor(1000 + Math.random() * 9000));
    const item = {
      id: body.id || `peng-${Date.now()}`,
      nomorSurat: body.nomorSurat || `400/${seq}/PENG/WM/${year}`,
      judul,
      tanggal:
        body.tanggal ||
        new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      berlakuHingga: body.berlakuHingga || '-',
      kategori: body.kategori || 'Umum',
      isi: body.isi || '',
      penanggungJawab: body.penanggungJawab || 'Pemerintah Desa Warung Menteng',
      ...body,
    };
    await query(
      'INSERT INTO pengumuman (id, kategori, data) VALUES ($1, $2, $3::jsonb)',
      [item.id, item.kategori, JSON.stringify(item)]
    );
    res.status(201).json(item);
  } catch (err) {
    console.error('pengumuman POST error:', err);
    res.status(500).json({ message: 'Gagal menyimpan pengumuman' });
  }
});

pengumumanRouter.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rows = await query<{ data: any }>('SELECT data FROM pengumuman WHERE id = $1', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Pengumuman tidak ditemukan' });
    }
    const existing = rows[0].data;
    const updated = { ...existing, ...(req.body || {}) };
    await query('UPDATE pengumuman SET data = $2::jsonb, kategori = $3 WHERE id = $1', [
      existing.id,
      JSON.stringify(updated),
      updated.kategori,
    ]);
    res.json(updated);
  } catch (err) {
    console.error('pengumuman PATCH error:', err);
    res.status(500).json({ message: 'Gagal memperbarui pengumuman' });
  }
});

pengumumanRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM pengumuman WHERE id = $1 RETURNING id', [id]);
    if (!result.length) {
      return res.status(404).json({ message: 'Pengumuman tidak ditemukan' });
    }
    res.json({ message: 'Pengumuman dihapus', id: result[0] });
  } catch (err) {
    console.error('pengumuman DELETE error:', err);
    res.status(500).json({ message: 'Gagal menghapus pengumuman' });
  }
});