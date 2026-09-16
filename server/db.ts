import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { config } from './config';
import {
  BERITA_LIST,
  PENGUMUMAN_LIST,
  UMKM_LIST,
  JENIS_SURAT_LIST,
  INITIAL_PERMOHONAN_SURAT,
  INITIAL_LAPORAN_WARGA,
} from '../src/data/mockData';

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
});

export async function query<T = unknown>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  username      TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL,
  name          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS permohonan (
  id                TEXT PRIMARY KEY,
  nomor_registrasi  TEXT,
  status            TEXT,
  data              JSONB NOT NULL,
  seq               BIGSERIAL
);
CREATE INDEX IF NOT EXISTS idx_permohonan_status ON permohonan (status);

CREATE TABLE IF NOT EXISTS laporan (
  id           TEXT PRIMARY KEY,
  kode_tiket   TEXT,
  status       TEXT,
  tipe         TEXT,
  data         JSONB NOT NULL,
  seq          BIGSERIAL
);
CREATE INDEX IF NOT EXISTS idx_laporan_status ON laporan (status);
CREATE INDEX IF NOT EXISTS idx_laporan_tipe ON laporan (tipe);

CREATE TABLE IF NOT EXISTS berita (
  id      TEXT PRIMARY KEY,
  slug    TEXT,
  kategori TEXT,
  data    JSONB NOT NULL,
  seq     BIGSERIAL
);
CREATE INDEX IF NOT EXISTS idx_berita_kategori ON berita (kategori);

CREATE TABLE IF NOT EXISTS pengumuman (
  id        TEXT PRIMARY KEY,
  kategori  TEXT,
  data      JSONB NOT NULL,
  seq       BIGSERIAL
);

CREATE TABLE IF NOT EXISTS umkm (
  id        TEXT PRIMARY KEY,
  kategori  TEXT,
  data      JSONB NOT NULL,
  seq       BIGSERIAL
);
CREATE INDEX IF NOT EXISTS idx_umkm_kategori ON umkm (kategori);

CREATE TABLE IF NOT EXISTS jenis_surat (
  id   TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  seq  BIGSERIAL
);
`;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

const ADMIN_CREDENTIALS = [
  { username: 'akhdan', password: 'FTIK888', role: 'Administrator Desa', name: 'Akhdan' },
  { username: 'admin', password: 'desa2026', role: 'Administrator Desa', name: 'Petugas PTSP' },
  { username: 'kades', password: 'menteng2026', role: 'Kepala Desa', name: 'Kepala Desa' },
];

async function seedUsers(): Promise<void> {
  const { rowCount } = await pool.query('SELECT 1 FROM users LIMIT 1');
  if (rowCount) return;
  for (const acc of ADMIN_CREDENTIALS) {
    const hash = bcrypt.hashSync(acc.password, 10);
    await pool.query(
      'INSERT INTO users (username, password_hash, role, name) VALUES ($1, $2, $3, $4)',
      [acc.username, hash, acc.role, acc.name]
    );
  }
  console.log(`Seed: ${ADMIN_CREDENTIALS.length} akun admin dibuat (password ter-hash bcrypt).`);
}

interface SeedTableConfig {
  table: string;
  rows: unknown[];
  columns: (row: any) => Record<string, unknown>;
}

const SEED_TABLES: SeedTableConfig[] = [
  {
    table: 'permohonan',
    rows: clone(INITIAL_PERMOHONAN_SURAT),
    columns: (row) => ({ id: row.id, nomor_registrasi: row.nomorRegistrasi, status: row.status }),
  },
  {
    table: 'laporan',
    rows: clone(INITIAL_LAPORAN_WARGA),
    columns: (row) => ({
      id: row.id,
      kode_tiket: row.kodeTiket,
      status: row.status,
      tipe: row.tipe || row.kategori,
    }),
  },
  {
    table: 'berita',
    rows: clone(BERITA_LIST),
    columns: (row) => ({ id: row.id, slug: row.slug, kategori: row.kategori }),
  },
  {
    table: 'pengumuman',
    rows: clone(PENGUMUMAN_LIST),
    columns: (row) => ({ id: row.id, kategori: row.kategori }),
  },
  {
    table: 'umkm',
    rows: clone(UMKM_LIST),
    columns: (row) => ({ id: row.id, kategori: row.kategori }),
  },
  {
    table: 'jenis_surat',
    rows: clone(JENIS_SURAT_LIST),
    columns: (row) => ({ id: row.id }),
  },
];

async function seedTable(cfg: SeedTableConfig): Promise<void> {
  if (!cfg.rows.length) return;
  const { rowCount } = await pool.query(`SELECT 1 FROM ${cfg.table} LIMIT 1`);
  if (rowCount) return;
  for (const row of cfg.rows) {
    const cols = cfg.columns(row);
    const keys = ['id', ...Object.keys(cols).filter((k) => k !== 'id')];
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map((k) => cols[k] ?? null);
    await pool.query(
      `INSERT INTO ${cfg.table} (${keys.join(', ')}, data) VALUES (${placeholders}, $${keys.length + 1}::jsonb)`,
      [...values, JSON.stringify(row)]
    );
  }
  console.log(`Seed: tabel ${cfg.table} diisi ${cfg.rows.length} baris.`);
}

export async function initDb(): Promise<void> {
  await pool.query(SCHEMA_SQL);
  await seedUsers();
  for (const cfg of SEED_TABLES) {
    await seedTable(cfg);
  }
  console.log('Database PostgreSQL siap (schema + seed OK).');
}