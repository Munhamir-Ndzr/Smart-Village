import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth } from '../middleware/auth';

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

umkmRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const nama = body.nama || body.Nama;
    if (!nama) {
      return res.status(400).json({ message: 'Nama produk UMKM wajib diisi' });
    }
    const item = {
      id: body.id || `umkm-${Date.now()}`,
      nama,
      kategori: body.kategori || 'produk-lainnya',
      kategoriLabel:
        body.kategoriLabel ||
        { 'makanan-minuman': 'Makanan & Minuman', kerajinan: 'Kerajinan', 'produk-lainnya': 'Produk Lokal Lainnya' }[
          body.kategori || 'produk-lainnya'
        ],
      pemilik: body.pemilik || '',
      alamat: body.alamat || 'Desa Warung Menteng',
      harga: body.harga || 'Rp -',
      deskripsi: body.deskripsi || '',
      kontakWA: body.kontakWA || '',
      fotoUrl:
        body.fotoUrl || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
      rating: body.rating ?? 4.5,
      unggulan: body.unggulan ?? false,
      ...body,
    };
    await query(
      'INSERT INTO umkm (id, kategori, data) VALUES ($1, $2, $3::jsonb)',
      [item.id, item.kategori, JSON.stringify(item)]
    );
    res.status(201).json(item);
  } catch (err) {
    console.error('umkm POST error:', err);
    res.status(500).json({ message: 'Gagal menyimpan UMKM' });
  }
});

umkmRouter.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rows = await query<{ data: any }>('SELECT data FROM umkm WHERE id = $1', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'UMKM tidak ditemukan' });
    }
    const existing = rows[0].data;
    const updates = req.body || {};
    const updated = { ...existing, ...updates };
    if (updates.kategori && !updates.kategoriLabel) {
      updated.kategoriLabel =
        { 'makanan-minuman': 'Makanan & Minuman', kerajinan: 'Kerajinan', 'produk-lainnya': 'Produk Lokal Lainnya' }[
          updates.kategori
        ] || updates.kategori;
    }
    await query('UPDATE umkm SET data = $2::jsonb, kategori = $3 WHERE id = $1', [
      existing.id,
      JSON.stringify(updated),
      updated.kategori,
    ]);
    res.json(updated);
  } catch (err) {
    console.error('umkm PATCH error:', err);
    res.status(500).json({ message: 'Gagal memperbarui UMKM' });
  }
});

umkmRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM umkm WHERE id = $1 RETURNING id', [id]);
    if (!result.length) {
      return res.status(404).json({ message: 'UMKM tidak ditemukan' });
    }
    res.json({ message: 'UMKM dihapus', id: result[0] });
  } catch (err) {
    console.error('umkm DELETE error:', err);
    res.status(500).json({ message: 'Gagal menghapus UMKM' });
  }
});