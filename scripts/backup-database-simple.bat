@echo off
REM Script para hacer respaldo de la base de datos de Supabase
REM Autor: Sistema Admintermas
REM Fecha: %date%

echo 🔄 Iniciando respaldo de la base de datos de Supabase...

REM Configuración de la base de datos
set SUPABASE_URL=https://bvzfuibqlprrfbudnauc.supabase.co
set DB_HOST=db.bvzfuibqlprrfbudnauc.supabase.co
set DB_PORT=5432
set DB_NAME=postgres
set DB_USER=postgres

REM Solicitar contraseña
echo 🔐 Ingresa la contraseña de la base de datos:
set /p DB_PASSWORD=

REM Crear nombre del archivo de respaldo con timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set TIMESTAMP=%YYYY%%MM%%DD%_%HH%%Min%%Sec%
set BACKUP_FILE=respaldo_supabase_%TIMESTAMP%.sql

REM Construir la URL de conexión
set CONNECTION_URL=postgresql://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%?sslmode=require

echo 📁 Archivo de respaldo: %BACKUP_FILE%
echo 🌐 Host: %DB_HOST%
echo 📊 Base de datos: %DB_NAME%

REM Verificar si pg_dump está disponible
pg_dump --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: pg_dump no está instalado o no está en el PATH
    echo 💡 Instala PostgreSQL para obtener pg_dump
    echo    Descarga desde: https://www.postgresql.org/download/
    pause
    exit /b 1
)

echo ✅ pg_dump encontrado
echo 🔄 Ejecutando respaldo...

REM Ejecutar el respaldo
pg_dump "%CONNECTION_URL%" -f "%BACKUP_FILE%" --verbose

if %errorlevel% equ 0 (
    echo ✅ Respaldo completado exitosamente!
    echo 📁 Archivo guardado: %BACKUP_FILE%
    
    REM Mostrar información del archivo
    if exist "%BACKUP_FILE%" (
        for %%A in ("%BACKUP_FILE%") do set FILE_SIZE=%%~zA
        echo 📊 Tamaño del archivo: %FILE_SIZE% bytes
        echo 🕒 Fecha de creación: %date% %time%
    )
) else (
    echo ❌ Error durante el respaldo
    pause
    exit /b 1
)

echo.
echo 🎉 Proceso de respaldo finalizado!
echo 💡 Para restaurar el respaldo usa: psql [URL_CONEXION] -f %BACKUP_FILE%

REM Limpiar variables sensibles
set DB_PASSWORD=
pause 