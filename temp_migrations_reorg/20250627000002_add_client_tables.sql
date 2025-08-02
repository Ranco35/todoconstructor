-- Migración para agregar tablas de clientes
-- Basado en el esquema de Prisma

-- Tabla de Países
CREATE TABLE IF NOT EXISTS "Country" (
  "id" BIGSERIAL PRIMARY KEY,
  "codigo" VARCHAR(3) UNIQUE NOT NULL,
  "nombre" TEXT NOT NULL,
  "nombreCompleto" TEXT,
  "activo" BOOLEAN DEFAULT true
);

-- Tabla de Sectores Económicos
CREATE TABLE IF NOT EXISTS "EconomicSector" (
  "id" BIGSERIAL PRIMARY KEY,
  "nombre" TEXT NOT NULL UNIQUE,
  "descripcion" TEXT,
  "activo" BOOLEAN DEFAULT true,
  "orden" INTEGER DEFAULT 0,
  "fechaCreacion" TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Tipos de Relación
CREATE TABLE IF NOT EXISTS "RelationshipType" (
  "id" BIGSERIAL PRIMARY KEY,
  "nombre" TEXT NOT NULL UNIQUE,
  "descripcion" TEXT,
  "activo" BOOLEAN DEFAULT true,
  "orden" INTEGER DEFAULT 0
);

-- Tabla de Clientes
CREATE TABLE IF NOT EXISTS "Client" (
  "id" BIGSERIAL PRIMARY KEY,
  "tipoCliente" TEXT NOT NULL DEFAULT 'empresa',
  "nombrePrincipal" TEXT NOT NULL,
  "apellido" TEXT,
  "rut" TEXT UNIQUE,
  "email" TEXT,
  "telefono" TEXT,
  "telefonoMovil" TEXT,
  "estado" TEXT NOT NULL DEFAULT 'activo',
  "fechaCreacion" TIMESTAMPTZ DEFAULT NOW(),
  "fechaModificacion" TIMESTAMPTZ DEFAULT NOW(),
  
  -- Campos de dirección
  "calle" TEXT,
  "calle2" TEXT,
  "ciudad" TEXT,
  "codigoPostal" TEXT,
  "region" TEXT,
  "paisId" BIGINT REFERENCES "Country"("id"),
  
  -- Campos adicionales
  "sitioWeb" TEXT,
  "idioma" TEXT DEFAULT 'es',
  "zonaHoraria" TEXT,
  "imagen" TEXT,
  "comentarios" TEXT,
  
  -- Campos específicos para empresas
  "razonSocial" TEXT,
  "giro" TEXT,
  "numeroEmpleados" INTEGER,
  "facturacionAnual" DECIMAL(15,2),
  "sectorEconomicoId" BIGINT REFERENCES "EconomicSector"("id"),
  
  -- Campos específicos para personas
  "fechaNacimiento" DATE,
  "genero" TEXT,
  "profesion" TEXT,
  "titulo" TEXT,
  
  -- Campos de segmentación y análisis
  "esClienteFrecuente" BOOLEAN DEFAULT false,
  "fechaUltimaCompra" DATE,
  "totalCompras" DECIMAL(15,2) DEFAULT 0,
  "rankingCliente" INTEGER DEFAULT 0,
  "origenCliente" TEXT,
  
  -- Campos de configuración
  "recibirNewsletter" BOOLEAN DEFAULT true,
  "aceptaMarketing" BOOLEAN DEFAULT false
);

-- Tabla de Contactos de Clientes
CREATE TABLE IF NOT EXISTS "ClientContact" (
  "id" BIGSERIAL PRIMARY KEY,
  "clienteId" BIGINT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
  "nombre" TEXT NOT NULL,
  "apellido" TEXT,
  "email" TEXT,
  "telefono" TEXT,
  "telefonoMovil" TEXT,
  
  -- Para empresas: cargo del contacto
  "cargo" TEXT,
  "departamento" TEXT,
  "tipoRelacionId" BIGINT REFERENCES "RelationshipType"("id"),
  
  -- Para personas: relación con el cliente principal
  "relacion" TEXT,
  
  "esContactoPrincipal" BOOLEAN DEFAULT false,
  "notas" TEXT,
  "fechaCreacion" TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Etiquetas de Clientes
CREATE TABLE IF NOT EXISTS "ClientTag" (
  "id" BIGSERIAL PRIMARY KEY,
  "nombre" TEXT NOT NULL UNIQUE,
  "color" TEXT DEFAULT '#3B82F6',
  "icono" TEXT,
  "descripcion" TEXT,
  "tipoAplicacion" TEXT DEFAULT 'todos',
  "esSistema" BOOLEAN DEFAULT false,
  "activo" BOOLEAN DEFAULT true,
  "orden" INTEGER DEFAULT 0,
  "fechaCreacion" TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Asignación de Etiquetas a Clientes
CREATE TABLE IF NOT EXISTS "ClientTagAssignment" (
  "id" BIGSERIAL PRIMARY KEY,
  "clienteId" BIGINT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
  "etiquetaId" BIGINT NOT NULL REFERENCES "ClientTag"("id") ON DELETE CASCADE,
  "fechaAsignacion" TIMESTAMPTZ DEFAULT NOW(),
  "asignadoPor" UUID REFERENCES "User"("id"),
  UNIQUE("clienteId", "etiquetaId")
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS "idx_client_tipo" ON "Client"("tipoCliente");
CREATE INDEX IF NOT EXISTS "idx_client_nombre" ON "Client"("nombrePrincipal");
CREATE INDEX IF NOT EXISTS "idx_client_rut" ON "Client"("rut");
CREATE INDEX IF NOT EXISTS "idx_client_ciudad" ON "Client"("ciudad");
CREATE INDEX IF NOT EXISTS "idx_client_frecuente" ON "Client"("esClienteFrecuente");
CREATE INDEX IF NOT EXISTS "idx_client_ranking" ON "Client"("rankingCliente");
CREATE INDEX IF NOT EXISTS "idx_client_contacto_cliente" ON "ClientContact"("clienteId");
CREATE INDEX IF NOT EXISTS "idx_client_contacto_nombre" ON "ClientContact"("nombre", "apellido");
CREATE INDEX IF NOT EXISTS "idx_client_contacto_email" ON "ClientContact"("email");
CREATE INDEX IF NOT EXISTS "idx_client_tag_nombre" ON "ClientTag"("nombre");
CREATE INDEX IF NOT EXISTS "idx_client_tag_aplicacion" ON "ClientTag"("tipoAplicacion");
CREATE INDEX IF NOT EXISTS "idx_client_tag_activo" ON "ClientTag"("activo");
CREATE INDEX IF NOT EXISTS "idx_client_tag_assignment_cliente" ON "ClientTagAssignment"("clienteId");
CREATE INDEX IF NOT EXISTS "idx_client_tag_assignment_etiqueta" ON "ClientTagAssignment"("etiquetaId");
CREATE INDEX IF NOT EXISTS "idx_client_tag_assignment_fecha" ON "ClientTagAssignment"("fechaAsignacion");

-- Habilitar Row Level Security (RLS)
ALTER TABLE "Country" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EconomicSector" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RelationshipType" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientContact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientTagAssignment" ENABLE ROW LEVEL SECURITY;

-- Insertar datos por defecto
INSERT INTO "Country" ("codigo", "nombre", "nombreCompleto") VALUES
('CL', 'Chile', 'República de Chile'),
('AR', 'Argentina', 'República Argentina'),
('PE', 'Perú', 'República del Perú'),
('CO', 'Colombia', 'República de Colombia'),
('MX', 'México', 'Estados Unidos Mexicanos')
ON CONFLICT ("codigo") DO NOTHING;

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
('Otros', 'Otros sectores económicos')
ON CONFLICT ("nombre") DO NOTHING;

INSERT INTO "RelationshipType" ("nombre", "descripcion") VALUES
('Gerente', 'Gerente o director'),
('Administrativo', 'Personal administrativo'),
('Técnico', 'Personal técnico'),
('Ventas', 'Personal de ventas'),
('Soporte', 'Personal de soporte'),
('Otro', 'Otro tipo de relación')
ON CONFLICT ("nombre") DO NOTHING;

INSERT INTO "ClientTag" ("nombre", "color", "descripcion", "esSistema", "tipoAplicacion") VALUES
('VIP', '#FFD700', 'Cliente muy importante', true, 'todos'),
('Frecuente', '#10B981', 'Cliente frecuente', true, 'todos'),
('Nuevo', '#3B82F6', 'Cliente nuevo', true, 'todos'),
('Inactivo', '#6B7280', 'Cliente inactivo', true, 'todos'),
('Empresa', '#8B5CF6', 'Cliente empresa', true, 'empresa'),
('Persona', '#F59E0B', 'Cliente persona', true, 'persona')
ON CONFLICT ("nombre") DO NOTHING; 