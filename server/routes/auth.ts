import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';

export const authRouter = Router();

const ADMIN_CREDENTIALS: { username: string; password: string; role: string; name: string }[] = [
  { username: 'akhdan', password: 'FTIK888', role: 'Administrator Desa', name: 'Akhdan' },
  { username: 'admin', password: 'desa2026', role: 'Administrator Desa', name: 'Petugas PTSP' },
  { username: 'kades', password: 'menteng2026', role: 'Kepala Desa', name: 'Kepala Desa' },
];

authRouter.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi' });
  }

  const account = ADMIN_CREDENTIALS.find(
    (acc) => acc.username === username && acc.password === password
  );

  if (!account) {
    return res.status(401).json({ message: 'Username atau password salah' });
  }

  res.json({
    token: randomUUID(),
    role: account.role,
    name: account.name,
    username: account.username,
  });
});