import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth } from '../middleware/auth';

export const laporanRouter = Router();

function newTicketNumber(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(1000 + Math.random() * 9000));
  return `LPR-WM-${year}-${seq}`;
}

laporanRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, tipe } = req.query;
    const conditions: string[] = [];
    const params: string[] = [];
    if (status) {
      params.push(String(status));
      conditions.push(`status = $${params.length}`);
    }
    if (tipe) {
      params.push(String(tipe));
      conditions.push(`tipe = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query<{ data: Record<string, unknown> }>(
      `SELECT data FROM laporan ${where} ORDER BY seq DESC`,
      params
    );
    res.json(rows.map((r) => r.data));
  } catch (err) {
    console.error('laporan GET error:', err);
    res.status(500).json({ message: 'Gagal membaca data' });
  }
});

laporanRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const item = {
      id: `lap-${Date.now()}`,
      kodeTiket: body.kodeTiket || newTicketNumber(),
      tanggalLapor: body.tanggalLapor || new Date().toISOString().split('T')[0],
      tanggalKirim: body.tanggalKirim || new Date().toISOString().split('T')[0],
      status: body.status || 'Menunggu',
      ...body,
    };
    await query(
      'INSERT INTO laporan (id, kode_tiket, status, tipe, data) VALUES ($1, $2, $3, $4, $5::jsonb)',
      [item.id, item.kodeTiket, item.status, item.tipe || item.kategori, JSON.stringify(item)]
    );
    res.status(201).json(item);
  } catch (err) {
    console.error('laporan POST error:', err);
    res.status(500).json({ message: 'Gagal menyimpan data' });
  }
});

laporanRouter.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rows = await query<{ data: any }>(
      'SELECT data FROM laporan WHERE id = $1 OR kode_tiket = $1 OR data->>\'nomorTiket\' = $1',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    const existing = rows[0].data;
    const updates = req.body || {};
    const tanggapanResmi = updates.tanggapanResmi || existing.tanggapanResmi || existing.responPetugas;
    const updated = {
      ...existing,
      ...updates,
      tanggapanResmi,
      responPetugas: updates.tanggapanResmi || existing.responPetugas,
      petugasPenanggap: updates.petugasPenanggap || existing.petugasPenanggap,
      tanggalTanggapan:
        updates.status || updates.tanggapanResmi
          ? new Date().toISOString().split('T')[0]
          : existing.tanggalTanggapan,
    };

    await query(
      'UPDATE laporan SET data = $2::jsonb, kode_tiket = $3, status = $4, tipe = $5 WHERE id = $1',
      [existing.id, JSON.stringify(updated), updated.kodeTiket, updated.status, updated.tipe || updated.kategori]
    );
    res.json(updated);
  } catch (err) {
    console.error('laporan PATCH error:', err);
    res.status(500).json({ message: 'Gagal memperbarui data' });
  }
});