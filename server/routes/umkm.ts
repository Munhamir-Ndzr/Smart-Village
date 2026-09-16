import { Router, Request, Response } from 'express';
import { db } from '../db';

export const umkmRouter = Router();

umkmRouter.get('/', (req: Request, res: Response) => {
  let list = db.umkm;
  const { kategori } = req.query;
  if (kategori) {
    list = list.filter((item) => item.kategori === String(kategori));
  }
  res.json(list);
});