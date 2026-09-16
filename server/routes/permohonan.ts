import { Router, Request, Response } from 'express';
import { db, findItem } from '../db';

export const permohonanRouter = Router();

function newRegistrationNumber(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(1000 + Math.random() * 9000));
  return `SRT-WM-${year}-${seq}`;
}

permohonanRouter.get('/', (req: Request, res: Response) => {
  let list = db.permohonan;
  const { status } = req.query;
  if (status) {
    list = list.filter((item) => String(item.status) === String(status));
  }
  res.json(list);
});

permohonanRouter.post('/', (req: Request, res: Response) => {
  const body = req.body || {};
  const item = {
    id: `req-${Date.now()}`,
    nomorRegistrasi: body.nomorRegistrasi || newRegistrationNumber(),
    tanggalPengajuan: body.tanggalPengajuan || new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
    status: body.status || 'Diajukan',
    ...body,
  };
  db.permohonan = [item, ...db.permohonan];
  res.status(201).json(item);
});

permohonanRouter.patch('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = findItem(db.permohonan, ['id', 'nomorRegistrasi'], id);
  if (!existing) {
    return res.status(404).json({ message: 'Permohonan tidak ditemukan' });
  }
  const updates = req.body || {};
  const tanggalSelesai =
    updates.status === 'Siap Diambil' || updates.status === 'Selesai'
      ? (existing.tanggalSelesai === '-' || existing.tanggalSelesai
          ? new Date().toISOString().split('T')[0]
          : existing.tanggalSelesai)
      : existing.tanggalSelesai;
  const updated = {
    ...existing,
    ...updates,
    tanggalSelesai: updates.status ? tanggalSelesai : existing.tanggalSelesai,
  };
  db.permohonan = db.permohonan.map((item) =>
    item.id === existing.id || item.nomorRegistrasi === existing.nomorRegistrasi ? updated : item
  );
  res.json(updated);
});