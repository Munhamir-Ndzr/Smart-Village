# Perbarui .env.local dengan URL tunnel terbaru, contoh:
#   .\scripts\set-api-url.ps1 https://compound-ultra-volumes-paxil.trycloudflare.com
param(
  [Parameter(Mandatory = $true)]
  [string]$Url
)

$url = $Url.TrimEnd('/')
$envFile = Join-Path $PSScriptRoot '..\.env.local'
Set-Content -LiteralPath $envFile -Value "VITE_API_URL=$url" -Encoding UTF8
Write-Host "VITE_API_URL = $url (disimpan di .env.local)" -ForegroundColor Green
Write-Host "Langkah berikutnya:" -ForegroundColor Yellow
Write-Host "  npm run build"
Write-Host "  git add . && git commit -m \"update API URL\" && git push"
Write-Host "Setelah deploy (1-2 menit), buka web dari HP."