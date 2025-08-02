-- Migración: Crear tabla SupplierContact
-- Fecha: 2025-06-28
-- Descripción: Crear tabla para gestionar contactos de proveedores

-- Crear tabla SupplierContact
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

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS "idx_supplier_contact_supplier_id" ON "SupplierContact"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_supplier_contact_is_primary" ON "SupplierContact"("isPrimary") WHERE "isPrimary" = true;
CREATE INDEX IF NOT EXISTS "idx_supplier_contact_active" ON "SupplierContact"("active");
CREATE INDEX IF NOT EXISTS "idx_supplier_contact_type" ON "SupplierContact"("type");
CREATE INDEX IF NOT EXISTS "idx_supplier_contact_email" ON "SupplierContact"("email") WHERE "email" IS NOT NULL;

-- Trigger para actualizar updatedAt automáticamente
CREATE OR REPLACE FUNCTION update_supplier_contact_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_supplier_contact_updated_at
  BEFORE UPDATE ON "SupplierContact"
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_contact_updated_at();

-- Constraint para asegurar que solo haya un contacto principal por proveedor
CREATE UNIQUE INDEX IF NOT EXISTS "unique_primary_contact_per_supplier" 
ON "SupplierContact"("supplierId") 
WHERE "isPrimary" = true AND "active" = true;

-- Comentarios para documentación
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

-- Habilitar RLS (Row Level Security)
ALTER TABLE "SupplierContact" ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (todos los usuarios autenticados pueden leer, crear y modificar)
-- Política para SELECT
CREATE POLICY "Allow read access for authenticated users" 
ON "SupplierContact"
FOR SELECT 
TO authenticated 
USING (true);

-- Política para INSERT
CREATE POLICY "Allow insert for authenticated users" 
ON "SupplierContact"
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política para UPDATE
CREATE POLICY "Allow update for authenticated users" 
ON "SupplierContact"
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Política para DELETE
CREATE POLICY "Allow delete for authenticated users" 
ON "SupplierContact"
FOR DELETE 
TO authenticated 
USING (true); 