@echo off
echo ================================================
echo    CONFIGURACION DE SUPABASE LOCAL
echo ================================================
echo.
echo Este script configura las variables de entorno para Supabase local
echo.
echo PASOS PREVIOS REQUERIDOS:
echo 1. Instalar Docker Desktop
echo 2. Iniciar Docker Desktop
echo 3. Ejecutar: supabase start
echo.
echo ================================================

REM Configurar variables de entorno para Supabase Local
set NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

echo Variables de entorno configuradas:
echo NEXT_PUBLIC_SUPABASE_URL=%NEXT_PUBLIC_SUPABASE_URL%
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=***configurado***
echo SUPABASE_SERVICE_ROLE_KEY=***configurado***
echo.

echo Ahora ejecuta:
echo 1. supabase start
echo 2. npm run dev
echo.
echo ================================================
pause
