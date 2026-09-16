import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { config } from '../config';

export const authRouter = Router();

interface UserRow {
  username: string;
  password_hash: string;
  role: string;
  name: string;
}

authRouter.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi' });
  }

  try {
    const rows = await query<UserRow>(
      'SELECT username, password_hash, role, name FROM users WHERE username = $1',
      [username]
    );
    if (!rows.length) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const user = rows[0];
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const token = jwt.sign(
      { username: user.username, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
    );

    res.json({
      token,
      role: user.role,
      name: user.name,
      username: user.username,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});