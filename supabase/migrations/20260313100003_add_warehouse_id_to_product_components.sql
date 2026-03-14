-- Agregar warehouse_id a product_components para combos/kits
-- Permite asignar bodega específica por componente de combo
ALTER TABLE "public"."product_components"
ADD COLUMN IF NOT EXISTS "warehouse_id" BIGINT REFERENCES "public"."Warehouse"(id) ON DELETE SET NULL;

COMMENT ON COLUMN "public"."product_components"."warehouse_id" IS 'Bodega específica para descontar stock del componente al vender el combo/kit';
