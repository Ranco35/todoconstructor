# Guía de Configuración de Tablas de Clientes en Supabase

## Método 1: Usando la Interfaz Gráfica (Recomendado)

### Paso 1: Acceder al Dashboard de Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto

### Paso 2: Crear las Tablas desde Table Editor

#### 2.1 Tabla Country (Países)
1. Ve a **Table Editor** en el menú lateral
2. Haz clic en **"New table"**
3. Configura la tabla:
   - **Name**: `Country`
   - **Columns**:
     - `id` (BIGSERIAL, PRIMARY KEY)
     - `codigo` (VARCHAR(3), UNIQUE, NOT NULL)
     - `nombre` (TEXT, NOT NULL)
     - `nombreCompleto` (TEXT)
     - `activo` (BOOLEAN, DEFAULT: true)
4. Haz clic en **"Save"**

#### 2.2 Tabla EconomicSector (Sectores Económicos)
1. **New table**
2. **Name**: `EconomicSector`
3. **Columns**:
   - `id` (BIGSERIAL, PRIMARY KEY)
   - `nombre` (TEXT, UNIQUE, NOT NULL)
   - `descripcion` (TEXT)
   - `activo` (BOOLEAN, DEFAULT: true)
   - `orden` (INTEGER, DEFAULT: 0)
   - `fechaCreacion` (TIMESTAMPTZ, DEFAULT: now())

#### 2.3 Tabla RelationshipType (Tipos de Relación)
1. **New table**
2. **Name**: `RelationshipType`
3. **Columns**:
   - `id` (BIGSERIAL, PRIMARY KEY)
   - `nombre` (TEXT, UNIQUE, NOT NULL)
   - `descripcion` (TEXT)
   - `activo` (BOOLEAN, DEFAULT: true)
   - `orden` (INTEGER, DEFAULT: 0)

#### 2.4 Tabla Client (Clientes)
1. **New table**
2. **Name**: `Client`
3. **Columns**:
   - `id` (BIGSERIAL, PRIMARY KEY)
   - `tipoCliente` (TEXT, NOT NULL, DEFAULT: 'empresa')
   - `nombrePrincipal` (TEXT, NOT NULL)
   - `apellido` (TEXT)
   - `rut` (TEXT, UNIQUE)
   - `email` (TEXT)
   - `telefono` (TEXT)
   - `telefonoMovil` (TEXT)
   - `estado` (TEXT, NOT NULL, DEFAULT: 'activo')
   - `fechaCreacion` (TIMESTAMPTZ, DEFAULT: now())
   - `fechaModificacion` (TIMESTAMPTZ, DEFAULT: now())
   - `calle` (TEXT)
   - `calle2` (TEXT)
   - `ciudad` (TEXT)
   - `codigoPostal` (TEXT)
   - `region` (TEXT)
   - `paisId` (BIGINT, FOREIGN KEY: Country.id)
   - `sitioWeb` (TEXT)
   - `idioma` (TEXT, DEFAULT: 'es')
   - `zonaHoraria` (TEXT)
   - `imagen` (TEXT)
   - `comentarios` (TEXT)
   - `razonSocial` (TEXT)
   - `giro` (TEXT)
   - `numeroEmpleados` (INTEGER)
   - `facturacionAnual` (DECIMAL(15,2))
   - `sectorEconomicoId` (BIGINT, FOREIGN KEY: EconomicSector.id)
   - `fechaNacimiento` (DATE)
   - `genero` (TEXT)
   - `profesion` (TEXT)
   - `titulo` (TEXT)
   - `esClienteFrecuente` (BOOLEAN, DEFAULT: false)
   - `fechaUltimaCompra` (DATE)
   - `totalCompras` (DECIMAL(15,2), DEFAULT: 0)
   - `rankingCliente` (INTEGER, DEFAULT: 0)
   - `origenCliente` (TEXT)
   - `recibirNewsletter` (BOOLEAN, DEFAULT: true)
   - `aceptaMarketing` (BOOLEAN, DEFAULT: false)

#### 2.5 Tabla ClientContact (Contactos)
1. **New table**
2. **Name**: `ClientContact`
3. **Columns**:
   - `id` (BIGSERIAL, PRIMARY KEY)
   - `clienteId` (BIGINT, FOREIGN KEY: Client.id, ON DELETE: CASCADE)
   - `nombre` (TEXT, NOT NULL)
   - `apellido` (TEXT)
   - `email` (TEXT)
   - `telefono` (TEXT)
   - `telefonoMovil` (TEXT)
   - `cargo` (TEXT)
   - `departamento` (TEXT)
   - `tipoRelacionId` (BIGINT, FOREIGN KEY: RelationshipType.id)
   - `relacion` (TEXT)
   - `esContactoPrincipal` (BOOLEAN, DEFAULT: false)
   - `notas` (TEXT)
   - `fechaCreacion` (TIMESTAMPTZ, DEFAULT: now())

#### 2.6 Tabla ClientTag (Etiquetas)
1. **New table**
2. **Name**: `ClientTag`
3. **Columns**:
   - `id` (BIGSERIAL, PRIMARY KEY)
   - `nombre` (TEXT, UNIQUE, NOT NULL)
   - `color` (TEXT, DEFAULT: '#3B82F6')
   - `icono` (TEXT)
   - `descripcion` (TEXT)
   - `tipoAplicacion` (TEXT, DEFAULT: 'todos')
   - `esSistema` (BOOLEAN, DEFAULT: false)
   - `activo` (BOOLEAN, DEFAULT: true)
   - `orden` (INTEGER, DEFAULT: 0)
   - `fechaCreacion` (TIMESTAMPTZ, DEFAULT: now())

#### 2.7 Tabla ClientTagAssignment (Asignación de Etiquetas)
1. **New table**
2. **Name**: `ClientTagAssignment`
3. **Columns**:
   - `id` (BIGSERIAL, PRIMARY KEY)
   - `clienteId` (BIGINT, FOREIGN KEY: Client.id, ON DELETE: CASCADE)
   - `etiquetaId` (BIGINT, FOREIGN KEY: ClientTag.id, ON DELETE: CASCADE)
   - `fechaAsignacion` (TIMESTAMPTZ, DEFAULT: now())
   - `asignadoPor` (UUID, FOREIGN KEY: User.id)
4. **Constraints**:
   - UNIQUE(clienteId, etiquetaId)

### Paso 3: Configurar Row Level Security (RLS)
Para cada tabla creada:
1. Ve a la tabla en **Table Editor**
2. Haz clic en **"RLS"** en la pestaña superior
3. Activa **"Enable RLS"**
4. Ve a **"Policies"** y crea una política:
   - **Name**: `Enable all for service role`
   - **Target roles**: `service_role`
   - **Policy definition**: `USING (true)`

### Paso 4: Insertar Datos por Defecto
Ve a **SQL Editor** y ejecuta:

```sql
-- Países
INSERT INTO "Country" ("codigo", "nombre", "nombreCompleto") VALUES
('CL', 'Chile', 'República de Chile'),
('AR', 'Argentina', 'República Argentina'),
('PE', 'Perú', 'República del Perú'),
('CO', 'Colombia', 'República de Colombia'),
('MX', 'México', 'Estados Unidos Mexicanos');

-- Sectores Económicos
INSERT INTO "EconomicSector" ("nombre", "descripcion") VALUES
('Comercio', 'Comercio al por mayor y menor'),
('Servicios', 'Servicios profesionales y personales'),
('Manufactura', 'Industria manufacturera'),
('Construcción', 'Construcción e ingeniería'),
('Tecnología', 'Tecnología de la información'),
('Salud', 'Servicios de salud'),
('Educación', 'Servicios educativos'),
('Turismo', 'Turismo y hotelería'),
('Transporte', 'Transporte y logística'),
('Otros', 'Otros sectores económicos');

-- Tipos de Relación
INSERT INTO "RelationshipType" ("nombre", "descripcion") VALUES
('Gerente', 'Gerente o director'),
('Administrativo', 'Personal administrativo'),
('Técnico', 'Personal técnico'),
('Ventas', 'Personal de ventas'),
('Soporte', 'Personal de soporte'),
('Otro', 'Otro tipo de relación');

-- Etiquetas del Sistema
INSERT INTO "ClientTag" ("nombre", "color", "descripcion", "esSistema", "tipoAplicacion") VALUES
('VIP', '#FFD700', 'Cliente muy importante', true, 'todos'),
('Frecuente', '#10B981', 'Cliente frecuente', true, 'todos'),
('Nuevo', '#3B82F6', 'Cliente nuevo', true, 'todos'),
('Inactivo', '#6B7280', 'Cliente inactivo', true, 'todos'),
('Empresa', '#8B5CF6', 'Cliente empresa', true, 'empresa'),
('Persona', '#F59E0B', 'Cliente persona', true, 'persona');
```

## Método 2: Usando SQL Editor (Alternativo)

Si prefieres usar SQL directamente:

1. Ve a **SQL Editor**
2. Crea una nueva consulta
3. Copia y pega el contenido del archivo `supabase/migrations/20250627000003_add_client_tables_interface.sql`
4. Ejecuta la consulta

## Verificación

Después de crear las tablas:

1. Ve a **Table Editor**
2. Verifica que aparezcan todas las tablas:
   - Country
   - EconomicSector
   - RelationshipType
   - Client
   - ClientContact
   - ClientTag
   - ClientTagAssignment

3. Ve a tu aplicación: `http://localhost:3000/dashboard/customers`
4. El módulo de clientes debería funcionar correctamente

## Notas Importantes

- **Orden de creación**: Crea primero las tablas de referencia (Country, EconomicSector, RelationshipType) antes que Client
- **Foreign Keys**: Asegúrate de configurar correctamente las relaciones
- **RLS**: No olvides habilitar RLS y crear las políticas
- **Datos por defecto**: Los datos de ejemplo son importantes para el funcionamiento del módulo 