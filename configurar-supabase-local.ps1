# ================================================
#    CONFIGURACION DE SUPABASE LOCAL
# ================================================
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "    CONFIGURACION DE SUPABASE LOCAL" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Este script configura las variables de entorno para Supabase local" -ForegroundColor Yellow
Write-Host ""

Write-Host "PASOS PREVIOS REQUERIDOS:" -ForegroundColor Red
Write-Host "1. Instalar Docker Desktop" -ForegroundColor White
Write-Host "2. Iniciar Docker Desktop" -ForegroundColor White
Write-Host "3. Ejecutar: supabase start" -ForegroundColor White
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan

# Configurar variables de entorno para Supabase Local
$env:NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
$env:SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

Write-Host ""
Write-Host "Variables de entorno configuradas:" -ForegroundColor Green
Write-Host "NEXT_PUBLIC_SUPABASE_URL=$env:NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor White
Write-Host "NEXT_PUBLIC_SUPABASE_ANON_KEY=***configurado***" -ForegroundColor White
Write-Host "SUPABASE_SERVICE_ROLE_KEY=***configurado***" -ForegroundColor White
Write-Host ""

Write-Host "Ahora ejecuta:" -ForegroundColor Yellow
Write-Host "1. supabase start" -ForegroundColor White
Write-Host "2. npm run dev" -ForegroundColor White
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Read-Host "Presiona Enter para continuar"
