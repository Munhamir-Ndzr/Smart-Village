import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initDb } from './db';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { permohonanRouter } from './routes/permohonan';
import { laporanRouter } from './routes/laporan';
import { beritaRouter } from './routes/berita';
import { pengumumanRouter } from './routes/pengumuman';
import { umkmRouter } from './routes/umkm';

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// Logger sederhana
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/permohonan', permohonanRouter);
app.use('/api/laporan', laporanRouter);
app.use('/api/berita', beritaRouter);
app.use('/api/pengumuman', pengumumanRouter);
app.use('/api/umkm', umkmRouter);

app.use((_req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

async function start(): Promise<void> {
  try {
    await initDb();
  } catch (err) {
    console.error('Gagal terhubung ke PostgreSQL:', err);
    process.exit(1);
  }
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`Smart Village API berjalan di http://0.0.0.0:${config.port}`);
  });
}

start();