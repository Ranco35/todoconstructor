-- Migración SEGURA: Crear tabla SupplierContact (maneja elementos existentes)
-- Fecha: 2025-06-28
-- Descripción: Crear tabla para gestionar contactos de proveedores de forma segura

-- Crear tabla SupplierContact (solo si no existe)
CREATE TABLE IF NOT EXISTS "SupplierContact" (
  "id" SERIAL PRIMARY KEY,
  "supplierId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "position" TEXT,
  "type" TEXT NOT NULL DEFAULT 'PRINCIPAL' CHECK ("type" IN ('PRINCIPAL', 'SECUNDARIO', 'EMERGENCIA')),
  "email" TEXT,
  "phone" TEXT,
  "mobile" TEXT,
  "notes" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT "SupplierContact_supplierId_fkey" 
    FOREIGN KEY ("supplierId") 
    REFERENCES "Supplier"("id") 
    ON DELETE CASCADE
);

-- Crear índices solo si no existen
CREATE INDEX IF NOT EXISTS "idx_supplier_contact_supplier_id" ON "SupplierContact"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_supplier_contact_is_primary" ON "SupplierContact"("isPrimary") WHERE "isPrimary" = true;
CREATE INDEX IF NOT EXISTS "idx_supplier_contact_active" ON "SupplierContact"("active");
CREATE INDEX IF NOT EXISTS "idx_supplier_contact_type" ON "SupplierContact"("type");
CREATE INDEX IF NOT EXISTS "idx_supplier_contact_email" ON "SupplierContact"("email") WHERE "email" IS NOT NULL;

-- Crear función para trigger (OR REPLACE para sobrescribir si existe)
CREATE OR REPLACE FUNCTION update_supplier_contact_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe y recrearlo (para evitar duplicados)
DROP TRIGGER IF EXISTS trigger_update_supplier_contact_updated_at ON "SupplierContact";
CREATE TRIGGER trigger_update_supplier_contact_updated_at
  BEFORE UPDATE ON "SupplierContact"
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_contact_updated_at();

-- Crear constraint único solo si no existe
CREATE UNIQUE INDEX IF NOT EXISTS "unique_primary_contact_per_supplier" 
ON "SupplierContact"("supplierId") 
WHERE "isPrimary" = true AND "active" = true;

-- Comentarios para documentación (estos no fallan si ya existen)
COMMENT ON TABLE "SupplierContact" IS 'Tabla para gestionar contactos de proveedores';
COMMENT ON COLUMN "SupplierContact"."supplierId" IS 'ID del proveedor al que pertenece el contacto';
COMMENT ON COLUMN "SupplierContact"."name" IS 'Nombre completo del contacto';
COMMENT ON COLUMN "SupplierContact"."position" IS 'Cargo o posición del contacto en la empresa';
COMMENT ON COLUMN "SupplierContact"."type" IS 'Tipo de contacto: PRINCIPAL, SECUNDARIO o EMERGENCIA';
COMMENT ON COLUMN "SupplierContact"."email" IS 'Dirección de correo electrónico del contacto';
COMMENT ON COLUMN "SupplierContact"."phone" IS 'Teléfono fijo del contacto';
COMMENT ON COLUMN "SupplierContact"."mobile" IS 'Teléfono móvil del contacto';
COMMENT ON COLUMN "SupplierContact"."notes" IS 'Notas adicionales sobre el contacto';
COMMENT ON COLUMN "SupplierContact"."isPrimary" IS 'Indica si es el contacto principal del proveedor';
COMMENT ON COLUMN "SupplierContact"."active" IS 'Indica si el contacto está activo';

-- Habilitar RLS (Row Level Security) - no falla si ya está habilitado
ALTER TABLE "SupplierContact" ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - eliminar si existen y recrear para evitar conflictos
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON "SupplierContact";
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON "SupplierContact";
DROP POLICY IF EXISTS "Allow update for authenticated users" ON "SupplierContact";
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON "SupplierContact";

-- Crear políticas RLS
CREATE POLICY "Allow read access for authenticated users" 
ON "SupplierContact"
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow insert for authenticated users" 
ON "SupplierContact"
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" 
ON "SupplierContact"
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users" 
ON "SupplierContact"
FOR DELETE 
TO authenticated 
USING (true);

-- Verificación final
DO $$ 
BEGIN 
    RAISE NOTICE 'Migración SupplierContact completada exitosamente';
    RAISE NOTICE 'Tabla creada: %', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'SupplierContact');
END $$; 