import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth } from '../middleware/auth';

export const permohonanRouter = Router();

function newRegistrationNumber(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(1000 + Math.random() * 9000));
  return `SRT-WM-${year}-${seq}`;
}

permohonanRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const rows = await query<{ data: Record<string, unknown> }>(
      status
        ? 'SELECT data FROM permohonan WHERE status = $1 ORDER BY seq DESC'
        : 'SELECT data FROM permohonan ORDER BY seq DESC',
      status ? [String(status)] : []
    );
    res.json(rows.map((r) => r.data));
  } catch (err) {
    console.error('permohonan GET error:', err);
    res.status(500).json({ message: 'Gagal membaca data' });
  }
});

permohonanRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const item = {
      id: `req-${Date.now()}`,
      nomorRegistrasi: body.nomorRegistrasi || newRegistrationNumber(),
      tanggalPengajuan:
        body.tanggalPengajuan ||
        new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
      status: body.status || 'Diajukan',
      ...body,
    };
    await query(
      'INSERT INTO permohonan (id, nomor_registrasi, status, data) VALUES ($1, $2, $3, $4::jsonb)',
      [item.id, item.nomorRegistrasi, item.status, JSON.stringify(item)]
    );
    res.status(201).json(item);
  } catch (err) {
    console.error('permohonan POST error:', err);
    res.status(500).json({ message: 'Gagal menyimpan data' });
  }
});

permohonanRouter.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rows = await query<{ data: any }>(
      'SELECT data FROM permohonan WHERE id = $1 OR nomor_registrasi = $1',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Permohonan tidak ditemukan' });
    }

    const existing = rows[0].data;
    const updates = req.body || {};
    const tanggalSelesai =
      updates.status === 'Siap Diambil' || updates.status === 'Selesai'
        ? existing.tanggalSelesai === '-' || existing.tanggalSelesai
          ? new Date().toISOString().split('T')[0]
          : existing.tanggalSelesai
        : existing.tanggalSelesai;
    const updated = {
      ...existing,
      ...updates,
      tanggalSelesai: updates.status ? tanggalSelesai : existing.tanggalSelesai,
    };

    await query(
      'UPDATE permohonan SET data = $2::jsonb, nomor_registrasi = $3, status = $4 WHERE id = $1',
      [existing.id, JSON.stringify(updated), updated.nomorRegistrasi, updated.status]
    );
    res.json(updated);
  } catch (err) {
    console.error('permohonan PATCH error:', err);
    res.status(500).json({ message: 'Gagal memperbarui data' });
  }
});