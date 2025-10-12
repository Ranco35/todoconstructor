-- =====================================================
-- CREAR TABLAS DEL MÓDULO DE CLIENTES - COMPLETO
-- Fecha: 2025-10-06
-- Descripción: Crear todas las tablas necesarias para el módulo de clientes
--              con políticas RLS configuradas correctamente
-- =====================================================

-- ============================================
-- 1. TABLA Country (Países)
-- ============================================
CREATE TABLE IF NOT EXISTS "Country" (
  "id" BIGSERIAL PRIMARY KEY,
  "codigo" VARCHAR(10) UNIQUE NOT NULL,
  "nombre" VARCHAR(100) NOT NULL,
  "nombreCompleto" VARCHAR(255),
  "activo" BOOLEAN DEFAULT true,
  "fechaCreacion" TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. TABLA EconomicSector (Sectores Económicos)
-- ============================================
CREATE TABLE IF NOT EXISTS "EconomicSector" (
  "id" BIGSERIAL PRIMARY KEY,
  "nombre" VARCHAR(100) NOT NULL UNIQUE,
  "descripcion" TEXT,
  "activo" BOOLEAN DEFAULT true,
  "fechaCreacion" TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABLA RelationshipType (Tipos de Relación)
-- ============================================
CREATE TABLE IF NOT EXISTS "RelationshipType" (
  "id" BIGSERIAL PRIMARY KEY,
  "nombre" VARCHAR(100) NOT NULL UNIQUE,
  "descripcion" TEXT,
  "activo" BOOLEAN DEFAULT true,
  "fechaCreacion" TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TABLA Client (Clientes)
-- ============================================
CREATE TABLE IF NOT EXISTS "Client" (
  "id" BIGSERIAL PRIMARY KEY,
  "nombrePrincipal" VARCHAR(255) NOT NULL,
  "apellido" VARCHAR(255),
  "tipoCliente" VARCHAR(50) NOT NULL CHECK ("tipoCliente" IN ('PERSONA', 'EMPRESA')),
  "rut" VARCHAR(20) UNIQUE,
  "email" VARCHAR(255),
  "telefono" VARCHAR(50),
  "telefonoMovil" VARCHAR(50),
  "estado" VARCHAR(50) DEFAULT 'activo' CHECK ("estado" IN ('activo', 'inactivo', 'prospecto')),
  "calle" VARCHAR(255),
  "ciudad" VARCHAR(100),
  "region" VARCHAR(100),
  "codigoPostal" VARCHAR(20),
  "paisId" BIGINT REFERENCES "Country"("id"),
  "razonSocial" VARCHAR(255),
  "giro" VARCHAR(255),
  "sectorEconomicoId" BIGINT REFERENCES "EconomicSector"("id"),
  "sitioWeb" VARCHAR(255),
  "esClienteFrecuente" BOOLEAN DEFAULT false,
  "fechaCreacion" TIMESTAMPTZ DEFAULT NOW(),
  "fechaUltimaCompra" TIMESTAMPTZ,
  "totalCompras" DECIMAL(12,2) DEFAULT 0,
  "rankingCliente" VARCHAR(20),
  "notas" TEXT,
  "creadoPor" UUID,
  "modificadoPor" UUID,
  "fechaModificacion" TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. TABLA ClientContact (Contactos de Clientes)
-- ============================================
CREATE TABLE IF NOT EXISTS "ClientContact" (
  "id" BIGSERIAL PRIMARY KEY,
  "clienteId" BIGINT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
  "nombre" VARCHAR(255) NOT NULL,
  "apellido" VARCHAR(255),
  "email" VARCHAR(255),
  "telefono" VARCHAR(50),
  "telefonoMovil" VARCHAR(50),
  "cargo" VARCHAR(100),
  "departamento" VARCHAR(100),
  "tipoRelacionId" BIGINT REFERENCES "RelationshipType"("id"),
  "relacion" VARCHAR(100),
  "esContactoPrincipal" BOOLEAN DEFAULT false,
  "notas" TEXT,
  "fechaCreacion" TIMESTAMPTZ DEFAULT NOW(),
  "creadoPor" UUID,
  "modificadoPor" UUID,
  "fechaModificacion" TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. TABLA ClientTag (Etiquetas de Clientes)
-- ============================================
CREATE TABLE IF NOT EXISTS "ClientTag" (
  "id" BIGSERIAL PRIMARY KEY,
  "nombre" VARCHAR(100) NOT NULL UNIQUE,
  "color" VARCHAR(50) DEFAULT '#3B82F6',
  "icono" VARCHAR(50),
  "descripcion" TEXT,
  "tipoAplicacion" VARCHAR(50) DEFAULT 'todos' CHECK ("tipoAplicacion" IN ('todos', 'PERSONA', 'EMPRESA')),
  "esSistema" BOOLEAN DEFAULT false,
  "activo" BOOLEAN DEFAULT true,
  "orden" INTEGER DEFAULT 0,
  "fechaCreacion" TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. TABLA ClientTagAssignment (Asignación de Etiquetas)
-- ============================================
CREATE TABLE IF NOT EXISTS "ClientTagAssignment" (
  "id" BIGSERIAL PRIMARY KEY,
  "clienteId" BIGINT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
  "etiquetaId" BIGINT NOT NULL REFERENCES "ClientTag"("id") ON DELETE CASCADE,
  "fechaAsignacion" TIMESTAMPTZ DEFAULT NOW(),
  "asignadoPor" UUID,
  UNIQUE("clienteId", "etiquetaId")
);

-- ============================================
-- 8. ÍNDICES PARA OPTIMIZACIÓN
-- ============================================
CREATE INDEX IF NOT EXISTS "idx_client_tipo" ON "Client"("tipoCliente");
CREATE INDEX IF NOT EXISTS "idx_client_nombre" ON "Client"("nombrePrincipal");
CREATE INDEX IF NOT EXISTS "idx_client_rut" ON "Client"("rut");
CREATE INDEX IF NOT EXISTS "idx_client_email" ON "Client"("email");
CREATE INDEX IF NOT EXISTS "idx_client_estado" ON "Client"("estado");
CREATE INDEX IF NOT EXISTS "idx_client_ciudad" ON "Client"("ciudad");
CREATE INDEX IF NOT EXISTS "idx_client_frecuente" ON "Client"("esClienteFrecuente");
CREATE INDEX IF NOT EXISTS "idx_client_ranking" ON "Client"("rankingCliente");

CREATE INDEX IF NOT EXISTS "idx_client_contact_cliente" ON "ClientContact"("clienteId");
CREATE INDEX IF NOT EXISTS "idx_client_contact_nombre" ON "ClientContact"("nombre", "apellido");
CREATE INDEX IF NOT EXISTS "idx_client_contact_email" ON "ClientContact"("email");
CREATE INDEX IF NOT EXISTS "idx_client_contact_principal" ON "ClientContact"("esContactoPrincipal");

CREATE INDEX IF NOT EXISTS "idx_client_tag_nombre" ON "ClientTag"("nombre");
CREATE INDEX IF NOT EXISTS "idx_client_tag_aplicacion" ON "ClientTag"("tipoAplicacion");
CREATE INDEX IF NOT EXISTS "idx_client_tag_activo" ON "ClientTag"("activo");

CREATE INDEX IF NOT EXISTS "idx_client_tag_assignment_cliente" ON "ClientTagAssignment"("clienteId");
CREATE INDEX IF NOT EXISTS "idx_client_tag_assignment_etiqueta" ON "ClientTagAssignment"("etiquetaId");

-- ============================================
-- 9. HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================
ALTER TABLE "Country" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EconomicSector" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RelationshipType" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientContact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientTagAssignment" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 10. POLÍTICAS RLS PARA USUARIOS AUTENTICADOS
-- ============================================

-- Políticas para Country
CREATE POLICY "auth_users_select_country" ON "Country" FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_insert_country" ON "Country" FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_update_country" ON "Country" FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_delete_country" ON "Country" FOR DELETE USING (auth.uid() IS NOT NULL);

-- Políticas para EconomicSector
CREATE POLICY "auth_users_select_sector" ON "EconomicSector" FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_insert_sector" ON "EconomicSector" FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_update_sector" ON "EconomicSector" FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_delete_sector" ON "EconomicSector" FOR DELETE USING (auth.uid() IS NOT NULL);

-- Políticas para RelationshipType
CREATE POLICY "auth_users_select_relationship" ON "RelationshipType" FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_insert_relationship" ON "RelationshipType" FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_update_relationship" ON "RelationshipType" FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_delete_relationship" ON "RelationshipType" FOR DELETE USING (auth.uid() IS NOT NULL);

-- Políticas para Client
CREATE POLICY "auth_users_select_client" ON "Client" FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_insert_client" ON "Client" FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_update_client" ON "Client" FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_delete_client" ON "Client" FOR DELETE USING (auth.uid() IS NOT NULL);

-- Políticas para ClientContact
CREATE POLICY "auth_users_select_contact" ON "ClientContact" FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_insert_contact" ON "ClientContact" FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_update_contact" ON "ClientContact" FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_delete_contact" ON "ClientContact" FOR DELETE USING (auth.uid() IS NOT NULL);

-- Políticas para ClientTag
CREATE POLICY "auth_users_select_tag" ON "ClientTag" FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_insert_tag" ON "ClientTag" FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_update_tag" ON "ClientTag" FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_delete_tag" ON "ClientTag" FOR DELETE USING (auth.uid() IS NOT NULL);

-- Políticas para ClientTagAssignment
CREATE POLICY "auth_users_select_assignment" ON "ClientTagAssignment" FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_insert_assignment" ON "ClientTagAssignment" FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_update_assignment" ON "ClientTagAssignment" FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_users_delete_assignment" ON "ClientTagAssignment" FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- 11. INSERTAR DATOS INICIALES
-- ============================================

-- Países
INSERT INTO "Country" ("codigo", "nombre", "nombreCompleto") VALUES
('CL', 'Chile', 'República de Chile'),
('AR', 'Argentina', 'República Argentina'),
('PE', 'Perú', 'República del Perú'),
('CO', 'Colombia', 'República de Colombia'),
('MX', 'México', 'Estados Unidos Mexicanos'),
('BR', 'Brasil', 'República Federativa del Brasil'),
('US', 'Estados Unidos', 'Estados Unidos de América')
ON CONFLICT ("codigo") DO NOTHING;

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
('Agricultura', 'Agricultura y ganadería')
ON CONFLICT ("nombre") DO NOTHING;

-- Tipos de Relación
INSERT INTO "RelationshipType" ("nombre", "descripcion") VALUES
('Propietario', 'Propietario o dueño de la empresa'),
('Gerente General', 'Gerente general de la organización'),
('Gerente Comercial', 'Gerente del área comercial'),
('Gerente Operaciones', 'Gerente del área de operaciones'),
('Contador', 'Contador o encargado de finanzas'),
('Asistente', 'Asistente administrativo'),
('Otro', 'Otro tipo de relación')
ON CONFLICT ("nombre") DO NOTHING;

-- Etiquetas del Sistema
INSERT INTO "ClientTag" ("nombre", "color", "descripcion", "esSistema", "tipoAplicacion", "orden") VALUES
('VIP', '#FFD700', 'Cliente VIP con atención preferencial', true, 'todos', 1),
('Frecuente', '#10B981', 'Cliente con compras frecuentes', true, 'todos', 2),
('Nuevo', '#3B82F6', 'Cliente nuevo en el sistema', true, 'todos', 3),
('Inactivo', '#6B7280', 'Cliente sin actividad reciente', true, 'todos', 4),
('Gran Empresa', '#8B5CF6', 'Empresa de gran tamaño', true, 'EMPRESA', 5),
('PYME', '#F59E0B', 'Pequeña o mediana empresa', true, 'EMPRESA', 6)
ON CONFLICT ("nombre") DO NOTHING;

-- ============================================
-- CONFIRMACIÓN
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Tablas del módulo de clientes creadas exitosamente';
  RAISE NOTICE '✅ Políticas RLS configuradas para usuarios autenticados';
  RAISE NOTICE '✅ Datos iniciales insertados';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tablas creadas:';
  RAISE NOTICE '   - Country (Países)';
  RAISE NOTICE '   - EconomicSector (Sectores Económicos)';
  RAISE NOTICE '   - RelationshipType (Tipos de Relación)';
  RAISE NOTICE '   - Client (Clientes)';
  RAISE NOTICE '   - ClientContact (Contactos)';
  RAISE NOTICE '   - ClientTag (Etiquetas)';
  RAISE NOTICE '   - ClientTagAssignment (Asignaciones)';
END $$;



