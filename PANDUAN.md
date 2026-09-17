# Panduan Menjalankan Aplikasi Smart Village

Aplikasi punya **3 bagian**:

| Bagian | Teknologi | Berjalan di |
|---|---|---|
| **Frontend** | React + Vite | GitHub Pages (online) / lokal (`npm run dev`) |
| **Backend (API)** | Express + TypeScript (tsx) | Laptop lokal port `5000` |
| **Database** | PostgreSQL 18 | Laptop lokal port `5432` |

> Website publik online `https://munhamir-ndzr.github.io/Smart-Village/` hanya bekerja jika **backend + database berjalan di laptop** dan tunnel Cloudflare hidup.

---

## 1. Prasyarat

- **Node.js** (disarankan v20+)
- **PostgreSQL 18** terinstal (service `postgresql-x64-18`)
- **cloudflared** (untuk akses dari internet/HP) — portable sudah ada di `C:\Users\advan\AppData\Local\cloudflared\cloudflared.exe`
- Git & akun GitHub

## 2. Persiapan Database (sekali saja)

1. Jalankan service PostgreSQL: `net start postgresql-x64-18` (atau via **Services** → `services.msc`).
2. Buat role & database (login sebagai superuser `postgres`):
   ```sql
   CREATE ROLE smartvillage WITH LOGIN PASSWORD 'smartvillage2026';
   CREATE DATABASE smart_village OWNER smartvillage;
   ```
   Contoh via psql: `psql -U postgres -h localhost -c "CREATE ROLE smartvillage WITH LOGIN PASSWORD 'smartvillage2026';"` lalu `psql -U postgres -h localhost -c "CREATE DATABASE smart_village OWNER smartvillage;"`
3. Uji koneksi: `psql -U smartvillage -h localhost -d smart_village -c "SELECT 1"`

> Tabel & data awal **dibuat otomatis** oleh backend saat pertama start (schema + seed dari `src/data/mockData`). Seed hanya berjalan bila tabel masih kosong — konten admin yang dibuat lewat dashboard **tersimpan permanen** di PostgreSQL.

## 3. Konfigurasi

- **Backend** → file `.env` di root:
  ```
  PORT=5000
  CORS_ORIGIN=http://localhost:3000,https://munhamir-ndzr.github.io
  DATABASE_URL=postgres://smartvillage:smartvillage2026@localhost:5432/smart_village
  JWT_SECRET=<ganti-dengan-string-acak-panjang>
  JWT_EXPIRES_IN=8h
  ```
- **Frontend** → file `.env.local`:
  ```
  VITE_API_URL=https://<url-tunnel>.trycloudflare.com
  ```
  Untuk develop lokal di PC bisa di-set ke `http://localhost:5000`.

## 4. Menjalankan Backend

```bash
npm install                # sekali saja
npm run dev:server         # mode develop (auto-reload) — TERMINAL 1
# atau: npm run server     # tanpa auto-reload
```

Saat start, backend otomatis: membuat tabel, mengisi seed, dan mendengar di `http://localhost:5000`.

Cek: `curl http://localhost:5000/api/health` → `{"status":"ok","db":"ok"}`.

## 5. Menjalankan Frontend

**Lokal (develop):**

```bash
npm run dev                # TERMINAL 2 → http://localhost:3000
```

**Produksi (statis) + deploy ke GitHub Pages:**

Frontend hasil `build` otomatis di-deploy ke GitHub Pages melalui `.github/workflows/deploy.yml` setiap push ke `main` (±1–2 menit).

```bash
npm run build              # hasil di /dist
git add .
git commit -m "update"
git push origin main
```

Website: `https://munhamir-ndzr.github.io/Smart-Village/`

> Catatan: backend **tidak ikut ter-deploy** (Express harus tetap jalan di laptop, tersambung lewat tunnel Cloudflare).

## 6. Tunnel Cloudflare (agar HP / publik bisa akses backend)

1. Pastikan backend hidup (Terminal 1).
2. Jalankan di Terminal baru: `.\scripts\run-tunnel.ps1`
   → menghasilkan URL seperti `https://xxx-yyy-zzz.trycloudflare.com`.
3. Pindahkan URL baru itu ke frontend:
   ```
   .\scripts\set-api-url.ps1 https://xxx-yyy-zzz.trycloudflare.com
   npm run build
   git add . && git commit -m "update API URL" && git push
   ```
4. Tunggu deploy ±1–2 menit, lalu buka website dari HP (data seluler).

> ⚠️ URL tunnel **berubah tiap kali tunnel dimulai ulang**, jadi harus ulangi langkah 3 setelah tunnel baru dibuat.

## 7. Login Admin

- Buka website → klik **"Masuk Admin Desa"** (di nav/footer).
- Kredensial default (tersimpan di tabel `users`, password ter-hash bcrypt):

| Username | Password | Peran |
|---|---|---|
| `akhdan` | `FTIK888` | Administrator Desa |
| `admin` | `desa2026` | Petugas PTSP |
| `kades` | `menteng2026` | Kepala Desa |

- Setelah login: kelola pengajuan surat, laporan, **berita**, **pengumuman**, dan **UMKM** — semuanya tersimpan di PostgreSQL.

## 8. Verifikasi Alur Lengkap

1. `npm run lint` — cek TypeScript.
2. `npm run build` — build produksi sukses.
3. Backend `GET /api/health` → `db: ok`.
4. Login admin dari situs → tambah berita → refresh halaman Beranda → berita muncul.

## 9. Troubleshooting

| Masalah | Solusi |
|---|---|
| `ECONNREFUSED :5000` | Backend belum jalan; jalankan `npm run dev:server`. |
| `FATAL: database "smart_village" does not exist` | Jalankan perintah pembuatan DB di Bagian 2. |
| `password authentication failed` | Pastikan `DATABASE_URL` di `.env` cocok dengan user DB. |
| Website HP tidak memuat data | Tunnel mati → jalankan ulang `run-tunnel.ps1` & update URL. |
| Login gagal (`401`) | Username/password salah, atau `JWT_SECRET` diubah. |
| Data "hilang" saat server restart | Server hanya mengisi seed jika tabel kosong; konten admin tersimpan permanen di PostgreSQL. |
| Port 5432 dipakai aplikasi lain | Cek `services.msc` bahwa `postgresql-x64-18` aktif; bisa ubah port di `DATABASE_URL`. |