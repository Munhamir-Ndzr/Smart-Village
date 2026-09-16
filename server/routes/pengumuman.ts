import { Router, Request, Response } from 'express';
import { db } from '../db';

export const pengumumanRouter = Router();

pengumumanRouter.get('/', (_req: Request, res: Response) => {
  res.json(db.pengumuman);
});