# 📊 Configuración de Respaldo Actualizada

## 🔗 Información de Conexión
- **URL Supabase**: https://bvzfuibqlprrfbudnauc.supabase.co
- **Host BD**: db.bvzfuibqlprrfbudnauc.supabase.co
- **Puerto**: 5432
- **Base de datos**: postgres
- **Usuario**: postgres
- **Contraseña**: [Actualizada el 2025-07-20 23:13:29]

## 🚀 Comandos de Respaldo

### Respaldo Completo
`powershell
.\backup-database-complete.ps1
`

### Respaldo con Compresión
`powershell
.\backup-database-complete.ps1 -Compress -Verbose
`

### Probar Conexión
`powershell
.\backup-database-complete.ps1 -TestConnection
`

## 🔄 Restaurar Respaldo
`powershell
psql "postgresql://postgres:[CONTRASEÑA]@db.bvzfuibqlprrfbudnauc.supabase.co:5432/=require" -f respaldo.sql
`

## 📝 Notas
- La contraseña se solicita de forma segura al ejecutar los scripts
- Los archivos de respaldo incluyen timestamp
- Se recomienda comprimir archivos grandes
