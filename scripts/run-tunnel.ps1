# Jalankan Cloudflare Quick Tunnel untuk mengekspos backend lokal (port 5000) ke internet.
# Persyaratan: backend sudah berjalan (npm run dev:server).
# Setelah tunnel berjalan, salin URL https://...trycloudflare.com lalu jalankan:
#   .\scripts\set-api-url.ps1 https://xxx.trycloudflare.com
$stale = Get-Command cloudflared -ErrorAction SilentlyContinue
$portable = Join-Path $env:LOCALAPPDATA 'cloudflared\cloudflared.exe'

# Prioritaskan portable (terbukti jalan), bukan binary dari PATH yang mungkin rusak.
if (Test-Path -LiteralPath $portable) {
  $cf = $portable
} elseif ($stale) {
  $cf = 'cloudflared'
} else {
  Write-Error "cloudflared tidak ditemukan. Jalankan: winget install Cloudflare.cloudflared"
  exit 1
}
Write-Host "Menggunakan cloudflared: $cf" -ForegroundColor Cyan

Write-Host "Membuka tunnel ke http://localhost:5000 ..." -ForegroundColor Green
Write-Host "Tunggu baris 'Your quick Tunnel has been created! Visit it at:' lalu salin URL trycloudflare-nya." -ForegroundColor Yellow
Write-Host "Tutup jendela ini (Ctrl+C) untuk menghentikan tunnel." -ForegroundColor Yellow
& $cf tunnel --url http://localhost:5000 --no-autoupdate --protocol http2 --edge-ip-version 4