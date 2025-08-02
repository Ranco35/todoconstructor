-- Crear tabla de etiquetas de proveedores
CREATE TABLE IF NOT EXISTS "SupplierTag" (
  "id" SERIAL PRIMARY KEY,
  "nombre" TEXT NOT NULL,
  "descripcion" TEXT,
  "color" TEXT DEFAULT '#3B82F6',
  "tipoAplicacion" TEXT NOT NULL DEFAULT 'todos' CHECK ("tipoAplicacion" IN ('todos', 'EMPRESA_INDIVIDUAL', 'SOCIEDAD_ANONIMA')),
  "esSistema" BOOLEAN DEFAULT false,
  "orden" INTEGER DEFAULT 0,
  "activo" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de relación entre proveedores y etiquetas
CREATE TABLE IF NOT EXISTS "SupplierTagAssignment" (
  "id" SERIAL PRIMARY KEY,
  "supplierId" INTEGER NOT NULL REFERENCES "Supplier"("id") ON DELETE CASCADE,
  "etiquetaId" INTEGER NOT NULL REFERENCES "SupplierTag"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("supplierId", "etiquetaId")
);

-- Insertar etiquetas del sistema para proveedores (solo si no existen)
INSERT INTO "SupplierTag" ("nombre", "descripcion", "color", "tipoAplicacion", "esSistema", "orden") 
SELECT * FROM (VALUES
  ('Confiable', 'Proveedor con historial confiable y pagos a tiempo', '#10B981', 'todos', true, 1),
  ('Urgente', 'Proveedor para servicios urgentes', '#EF4444', 'todos', true, 2),
  ('Premium', 'Proveedor de alta calidad y servicio', '#8B5CF6', 'todos', true, 3),
  ('Nuevo', 'Proveedor recién incorporado', '#F59E0B', 'todos', true, 4),
  ('Local', 'Proveedor de la zona local', '#06B6D4', 'todos', true, 5),
  ('Certificado', 'Empresa con certificaciones vigentes', '#059669', 'SOCIEDAD_ANONIMA', true, 6),
  ('Grande', 'Empresa de gran tamaño', '#7C3AED', 'SOCIEDAD_ANONIMA', true, 7),
  ('Pyme', 'Pequeña y mediana empresa', '#DC2626', 'SOCIEDAD_ANONIMA', true, 8),
  ('Part-Time', 'Personal temporal o por horas', '#EA580C', 'EMPRESA_INDIVIDUAL', true, 9),
  ('Especialista', 'Profesional especializado', '#2563EB', 'EMPRESA_INDIVIDUAL', true, 10),
  ('Freelance', 'Trabajador independiente', '#7C2D12', 'EMPRESA_INDIVIDUAL', true, 11)
) AS v("nombre", "descripcion", "color", "tipoAplicacion", "esSistema", "orden")
WHERE NOT EXISTS (SELECT 1 FROM "SupplierTag" WHERE "nombre" = v."nombre");

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS "idx_supplier_tag_nombre" ON "SupplierTag"("nombre");
CREATE INDEX IF NOT EXISTS "idx_supplier_tag_tipo_aplicacion" ON "SupplierTag"("tipoAplicacion");
CREATE INDEX IF NOT EXISTS "idx_supplier_tag_activo" ON "SupplierTag"("activo");
CREATE INDEX IF NOT EXISTS "idx_supplier_tag_assignment_supplier" ON "SupplierTagAssignment"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_supplier_tag_assignment_etiqueta" ON "SupplierTagAssignment"("etiquetaId");

-- Crear función para actualizar updatedAt
CREATE OR REPLACE FUNCTION update_supplier_tag_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updatedAt
DROP TRIGGER IF EXISTS update_supplier_tag_updated_at ON "SupplierTag";
CREATE TRIGGER update_supplier_tag_updated_at
  BEFORE UPDATE ON "SupplierTag"
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_tag_updated_at(); 