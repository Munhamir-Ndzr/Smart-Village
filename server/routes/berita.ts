import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth } from '../middleware/auth';

export const beritaRouter = Router();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

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

beritaRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const judul = body.judul || body.Judul;
    if (!judul) {
      return res.status(400).json({ message: 'Judul berita wajib diisi' });
    }
    const item = {
      id: body.id || `berita-${Date.now()}`,
      judul,
      slug: body.slug || slugify(judul),
      kategori: body.kategori || 'Pemerintahan',
      tanggal:
        body.tanggal ||
        new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      penulis: body.penulis || 'Admin Redaksi Desa',
      ringkasan: body.ringkasan || '',
      isiLengkap: body.isiLengkap || '',
      fotoUrl:
        body.fotoUrl ||
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
      dibaca: body.dibaca ?? 0,
      tags: body.tags || [body.kategori || 'Pemerintahan'],
      ...body,
    };
    await query(
      'INSERT INTO berita (id, slug, kategori, data) VALUES ($1, $2, $3, $4::jsonb)',
      [item.id, item.slug, item.kategori, JSON.stringify(item)]
    );
    res.status(201).json(item);
  } catch (err) {
    console.error('berita POST error:', err);
    res.status(500).json({ message: 'Gagal menyimpan berita' });
  }
});

beritaRouter.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rows = await query<{ data: any }>(
      'SELECT data FROM berita WHERE id = $1 OR slug = $1',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Berita tidak ditemukan' });
    }
    const existing = rows[0].data;
    const updates = req.body || {};
    const updated = { ...existing, ...updates };
    if (updates.judul && !updates.slug) {
      updated.slug = slugify(updates.judul);
    }
    await query(
      'UPDATE berita SET data = $2::jsonb, slug = $3, kategori = $4 WHERE id = $1',
      [existing.id, JSON.stringify(updated), updated.slug, updated.kategori]
    );
    res.json(updated);
  } catch (err) {
    console.error('berita PATCH error:', err);
    res.status(500).json({ message: 'Gagal memperbarui berita' });
  }
});

beritaRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM berita WHERE id = $1 OR slug = $1 RETURNING id',
      [id]
    );
    if (!result.length) {
      return res.status(404).json({ message: 'Berita tidak ditemukan' });
    }
    res.json({ message: 'Berita dihapus', id: result[0] });
  } catch (err) {
    console.error('berita DELETE error:', err);
    res.status(500).json({ message: 'Gagal menghapus berita' });
  }
});