import { Router, Request, Response } from 'express';
import { db, findItem } from '../db';

export const laporanRouter = Router();

function newTicketNumber(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(1000 + Math.random() * 9000));
  return `LPR-WM-${year}-${seq}`;
}

laporanRouter.get('/', (req: Request, res: Response) => {
  let list = db.laporan;
  const { status, tipe } = req.query;
  if (status) {
    list = list.filter((item) => String(item.status) === String(status));
  }
  if (tipe) {
    list = list.filter((item) => String(item.tipe || item.kategori) === String(tipe));
  }
  res.json(list);
});

laporanRouter.post('/', (req: Request, res: Response) => {
  const body = req.body || {};
  const item = {
    id: `lap-${Date.now()}`,
    kodeTiket: body.kodeTiket || newTicketNumber(),
    tanggalLapor: body.tanggalLapor || new Date().toISOString().split('T')[0],
    tanggalKirim: body.tanggalKirim || new Date().toISOString().split('T')[0],
    status: body.status || 'Menunggu',
    ...body,
  };
  db.laporan = [item, ...db.laporan];
  res.status(201).json(item);
});

laporanRouter.patch('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = findItem(db.laporan, ['id', 'kodeTiket', 'nomorTiket'], id);
  if (!existing) {
    return res.status(404).json({ message: 'Laporan tidak ditemukan' });
  }
  const updates = req.body || {};
  const tanggapanResmi = updates.tanggapanResmi || existing.tanggapanResmi || existing.responPetugas;
  const updated = {
    ...existing,
    ...updates,
    tanggapanResmi,
    responPetugas: updates.tanggapanResmi || existing.responPetugas,
    petugasPenanggap: updates.petugasPenanggap || existing.petugasPenanggap,
    tanggalTanggapan: updates.status || updates.tanggapanResmi
      ? new Date().toISOString().split('T')[0]
      : existing.tanggalTanggapan,
  };
  db.laporan = db.laporan.map((item) =>
    item.id === existing.id || item.kodeTiket === existing.kodeTiket ? updated : item
  );
  res.json(updated);
});