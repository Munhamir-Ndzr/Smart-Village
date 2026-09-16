import { Router, Request, Response } from 'express';
import { db, findItem } from '../db';

export const beritaRouter = Router();

beritaRouter.get('/', (req: Request, res: Response) => {
  let list = db.berita;
  const { kategori } = req.query;
  if (kategori) {
    list = list.filter((item) => item.kategori === String(kategori));
  }
  res.json(list);
});

beritaRouter.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const item = findItem(db.berita, ['id', 'slug'], id);
  if (!item) {
    return res.status(404).json({ message: 'Berita tidak ditemukan' });
  }
  res.json(item);
});