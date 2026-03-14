-- ============================================================
-- Migración: Soporte de múltiples proveedores por producto
-- Crea tabla product_suppliers y migra datos existentes
-- ============================================================

-- 1. Crear tabla intermedia product_suppliers
CREATE TABLE IF NOT EXISTS "public"."product_suppliers" (
  "id"            BIGSERIAL PRIMARY KEY,
  "product_id"    BIGINT NOT NULL REFERENCES "public"."Product"(id) ON DELETE CASCADE,
  "supplier_id"   BIGINT NOT NULL REFERENCES "public"."Supplier"(id) ON DELETE CASCADE,
  "supplier_code" TEXT,
  "is_primary"    BOOLEAN NOT NULL DEFAULT false,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("product_id", "supplier_id")
);

-- 2. Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_product_suppliers_product_id  ON "public"."product_suppliers" ("product_id");
CREATE INDEX IF NOT EXISTS idx_product_suppliers_supplier_id ON "public"."product_suppliers" ("supplier_id");
CREATE INDEX IF NOT EXISTS idx_product_suppliers_primary     ON "public"."product_suppliers" ("product_id") WHERE "is_primary" = true;

-- 3. Comentarios descriptivos
COMMENT ON TABLE  "public"."product_suppliers"               IS 'Relación N:M entre productos y proveedores con código de proveedor por producto';
COMMENT ON COLUMN "public"."product_suppliers"."supplier_code" IS 'Código que ese proveedor usa para identificar este producto';
COMMENT ON COLUMN "public"."product_suppliers"."is_primary"    IS 'Indica el proveedor principal del producto (solo uno por producto)';

-- 4. Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_product_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_suppliers_updated_at
  BEFORE UPDATE ON "public"."product_suppliers"
  FOR EACH ROW EXECUTE FUNCTION update_product_suppliers_updated_at();

-- 5. Migrar datos existentes desde Product.supplierid / Product.supplierCode
INSERT INTO "public"."product_suppliers" ("product_id", "supplier_id", "supplier_code", "is_primary")
SELECT
  p.id          AS product_id,
  p.supplierid  AS supplier_id,
  p."supplierCode" AS supplier_code,
  true          AS is_primary
FROM "public"."Product" p
WHERE p.supplierid IS NOT NULL
ON CONFLICT ("product_id", "supplier_id") DO NOTHING;

-- 6. RLS: habilitar seguridad a nivel de fila
ALTER TABLE "public"."product_suppliers" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_suppliers_select" ON "public"."product_suppliers"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "product_suppliers_insert" ON "public"."product_suppliers"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "product_suppliers_update" ON "public"."product_suppliers"
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "product_suppliers_delete" ON "public"."product_suppliers"
  FOR DELETE USING (auth.role() = 'authenticated');
