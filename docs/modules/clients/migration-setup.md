# Migración de Tablas de Clientes con Supabase CLI

## Resumen

Se ha implementado la creación de tablas de clientes usando el CLI oficial de Supabase, siguiendo las mejores prácticas de migración de bases de datos.

## Proceso Realizado

### 1. Creación de la Migración

```bash
npx supabase migration new create_client_tables
```

Esto creó el archivo: `supabase/migrations/20250623174020_create_client_tables.sql`

### 2. Contenido de la Migración

La migración incluye:

- **Tablas principales:**
  - `Country` - Países
  - `EconomicSector` - Sectores económicos
  - `RelationshipType` - Tipos de relación
  - `Client` - Clientes principales
  - `ClientContact` - Contactos de clientes
  - `ClientTag` - Etiquetas de clientes
  - `ClientTagAssignment` - Asignación de etiquetas

- **Índices de rendimiento** para campos frecuentemente consultados
- **Row Level Security (RLS)** habilitado en todas las tablas
- **Políticas RLS** básicas para permitir acceso del service role
- **Datos por defecto** para países, sectores económicos, tipos de relación y etiquetas

### 3. Aplicación de la Migración

```bash
npx supabase db push
```

Este comando aplica la migración a la base de datos hosteada en Supabase.

## Ventajas de Usar Supabase CLI

1. **Control de versiones:** Las migraciones se versionan automáticamente
2. **Historial completo:** Se mantiene un historial de todos los cambios
3. **Reversibilidad:** Las migraciones pueden ser revertidas si es necesario
4. **Consistencia:** Garantiza que todos los entornos tengan la misma estructura
5. **Automatización:** Permite automatizar el despliegue de cambios

## Verificación

Se creó una página de verificación en `/dashboard/verify-client-tables` que:

- Verifica que todas las tablas existen
- Confirma que son accesibles desde la aplicación
- Muestra el estado de cada tabla
- Proporciona un resumen del estado general

## Estructura de Tablas

### Country
```sql
- id (BIGSERIAL PRIMARY KEY)
- codigo (VARCHAR(3) UNIQUE)
- nombre (TEXT)
- nombreCompleto (TEXT)
- activo (BOOLEAN)
```

### EconomicSector
```sql
- id (BIGSERIAL PRIMARY KEY)
- nombre (TEXT UNIQUE)
- descripcion (TEXT)
- activo (BOOLEAN)
- orden (INTEGER)
- fechaCreacion (TIMESTAMPTZ)
```

### Client
```sql
- id (BIGSERIAL PRIMARY KEY)
- tipoCliente (TEXT) - 'empresa' o 'persona'
- nombrePrincipal (TEXT)
- apellido (TEXT)
- rut (TEXT UNIQUE)
- email (TEXT)
- telefono (TEXT)
- telefonoMovil (TEXT)
- estado (TEXT) - 'activo', 'inactivo', etc.
- fechaCreacion (TIMESTAMPTZ)
- fechaModificacion (TIMESTAMPTZ)
- calle, calle2, ciudad, codigoPostal, region (TEXT)
- paisId (BIGINT REFERENCES Country)
- sitioWeb, idioma, zonaHoraria (TEXT)
- imagen, comentarios (TEXT)
- razonSocial, giro (TEXT)
- numeroEmpleados (INTEGER)
- facturacionAnual (DECIMAL)
- sectorEconomicoId (BIGINT REFERENCES EconomicSector)
- fechaNacimiento (DATE)
- genero, profesion, titulo (TEXT)
- esClienteFrecuente (BOOLEAN)
- fechaUltimaCompra (DATE)
- totalCompras (DECIMAL)
- rankingCliente (INTEGER)
- origenCliente (TEXT)
- recibirNewsletter, aceptaMarketing (BOOLEAN)
```

### ClientContact
```sql
- id (BIGSERIAL PRIMARY KEY)
- clienteId (BIGINT REFERENCES Client)
- nombre, apellido (TEXT)
- email, telefono, telefonoMovil (TEXT)
- cargo, departamento (TEXT)
- tipoRelacionId (BIGINT REFERENCES RelationshipType)
- relacion (TEXT)
- esContactoPrincipal (BOOLEAN)
- notas (TEXT)
- fechaCreacion (TIMESTAMPTZ)
```

### ClientTag
```sql
- id (BIGSERIAL PRIMARY KEY)
- nombre (TEXT UNIQUE)
- color (TEXT)
- icono (TEXT)
- descripcion (TEXT)
- tipoAplicacion (TEXT) - 'todos', 'empresa', 'persona'
- esSistema (BOOLEAN)
- activo (BOOLEAN)
- orden (INTEGER)
- fechaCreacion (TIMESTAMPTZ)
```

### ClientTagAssignment
```sql
- id (BIGSERIAL PRIMARY KEY)
- clienteId (BIGINT REFERENCES Client)
- etiquetaId (BIGINT REFERENCES ClientTag)
- fechaAsignacion (TIMESTAMPTZ)
- asignadoPor (UUID REFERENCES User)
```

## Datos por Defecto

### Países
- Chile, Argentina, Perú, Colombia, México

### Sectores Económicos
- Comercio, Servicios, Manufactura, Construcción, Tecnología, Salud, Educación, Turismo, Transporte, Otros

### Tipos de Relación
- Gerente, Administrativo, Técnico, Ventas, Soporte, Otro

### Etiquetas del Sistema
- VIP (Cliente muy importante)
- Frecuente (Cliente frecuente)
- Nuevo (Cliente nuevo)
- Inactivo (Cliente inactivo)
- Empresa (Cliente empresa)
- Persona (Cliente persona)

## Próximos Pasos

1. **Verificar la migración:** Usar la página de verificación para confirmar que todo funciona
2. **Probar operaciones CRUD:** Crear, leer, actualizar y eliminar clientes
3. **Configurar políticas RLS:** Ajustar las políticas según los requisitos de seguridad
4. **Implementar funcionalidades:** Usar las tablas en los componentes de la aplicación

## Comandos Útiles

```bash
# Ver estado de las migraciones
npx supabase migration list

# Revertir última migración
npx supabase db reset

# Ver logs de migración
npx supabase db diff

# Generar nueva migración
npx supabase migration new nombre_migracion
```

## Notas Importantes

- Las migraciones son **irreversibles** una vez aplicadas a producción
- Siempre **probar** las migraciones en un entorno de desarrollo primero
- **Hacer backup** antes de aplicar migraciones importantes
- Las migraciones se aplican en **orden cronológico** según el timestamp 