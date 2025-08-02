# 📊 Scripts de Respaldo de Base de Datos

Este directorio contiene scripts para hacer respaldos de la base de datos de Supabase.

## 🗂️ Archivos Disponibles

- `backup-database.ps1` - Script PowerShell avanzado (Windows)
- `backup-database.sh` - Script Bash (Linux/macOS)
- `backup-database-simple.bat` - Script Batch simple (Windows)

## 🔧 Requisitos Previos

### 1. Instalar PostgreSQL Client

**Windows:**
- Descarga desde: https://www.postgresql.org/download/windows/
- Asegúrate de que `pg_dump` esté en el PATH

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql-client
```

**macOS:**
```bash
brew install postgresql
```

### 2. Obtener Credenciales de Supabase

Necesitas la contraseña de la base de datos de Supabase:

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a Settings > Database
3. Copia la contraseña de la base de datos

## 🚀 Cómo Usar

### Opción 1: PowerShell (Recomendado para Windows)

```powershell
# Navegar al directorio de scripts
cd scripts

# Ejecutar el script
.\backup-database.ps1
```

### Opción 2: Bash (Linux/macOS)

```bash
# Navegar al directorio de scripts
cd scripts

# Dar permisos de ejecución
chmod +x backup-database.sh

# Ejecutar el script
./backup-database.sh
```

### Opción 3: Batch (Windows Simple)

```cmd
# Navegar al directorio de scripts
cd scripts

# Ejecutar el script
backup-database-simple.bat
```

## 📋 Proceso del Respaldo

1. **Verificación**: El script verifica que `pg_dump` esté instalado
2. **Autenticación**: Solicita la contraseña de la base de datos
3. **Conexión**: Se conecta a la base de datos de Supabase
4. **Respaldo**: Crea un archivo `.sql` con timestamp
5. **Verificación**: Confirma que el archivo se creó correctamente

## 📁 Archivos de Salida

Los respaldos se guardan con el formato:
```
respaldo_supabase_YYYYMMDD_HHMMSS.sql
```

Ejemplo: `respaldo_supabase_20250115_143022.sql`

## 🔍 Información de Conexión

- **Host**: `db.ibpbclxszblystwffxzn.supabase.co`
- **Puerto**: `5432`
- **Base de datos**: `postgres`
- **Usuario**: `postgres`
- **SSL**: Requerido (`sslmode=require`)

## 🔄 Restaurar un Respaldo

Para restaurar un respaldo:

```bash
# Usando psql
psql "postgresql://postgres:TU_CONTRASEÑA@db.ibpbclxszblystwffxzn.supabase.co:5432/postgres?sslmode=require" -f respaldo_supabase_YYYYMMDD_HHMMSS.sql
```

## ⚠️ Consideraciones de Seguridad

1. **Contraseñas**: Los scripts solicitan la contraseña de forma segura
2. **Archivos**: Los archivos de respaldo contienen datos sensibles
3. **Almacenamiento**: Guarda los respaldos en un lugar seguro
4. **Eliminación**: Considera eliminar archivos de respaldo antiguos

## 🐛 Troubleshooting

### Error: "pg_dump no está instalado"

**Solución**: Instala PostgreSQL Client
- Windows: Descarga desde postgresql.org
- Linux: `sudo apt-get install postgresql-client`
- macOS: `brew install postgresql`

### Error: "Connection refused"

**Posibles causas**:
- Contraseña incorrecta
- Firewall bloqueando la conexión
- Supabase temporalmente no disponible

### Error: "SSL connection required"

**Solución**: El script ya incluye `sslmode=require` en la URL

## 📊 Monitoreo

Los scripts muestran:
- ✅ Estado de la conexión
- 📁 Nombre del archivo de respaldo
- 📊 Tamaño del archivo
- 🕒 Fecha y hora de creación

## 🔧 Personalización

Puedes modificar los scripts para:
- Cambiar el directorio de salida
- Agregar compresión (gzip)
- Incluir solo tablas específicas
- Programar respaldos automáticos

## 📞 Soporte

Si tienes problemas:
1. Verifica que `pg_dump` esté instalado
2. Confirma que la contraseña sea correcta
3. Revisa la conectividad a internet
4. Consulta los logs de error del script 