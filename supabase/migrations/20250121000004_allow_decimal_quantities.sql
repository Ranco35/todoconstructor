-- ═══════════════════════════════════════════════════════════════
-- 🔧 MIGRACIÓN: Permitir Cantidades Decimales
-- ═══════════════════════════════════════════════════════════════
-- Propósito: Permitir cantidades decimales para productos como kilogramos

-- ═══════════════════════════════════════════════════════════════
-- 1. ACTUALIZAR TABLA INVENTORYMOVEMENT
-- ═══════════════════════════════════════════════════════════════

-- Cambiar el tipo de dato de INTEGER a DECIMAL para permitir cantidades decimales
ALTER TABLE "InventoryMovement" 
ALTER COLUMN "quantity" TYPE DECIMAL(10,2);

-- Actualizar la restricción CHECK para permitir valores decimales
ALTER TABLE "InventoryMovement" 
DROP CONSTRAINT IF EXISTS "InventoryMovement_quantity_check";

ALTER TABLE "InventoryMovement" 
ADD CONSTRAINT "InventoryMovement_quantity_check" 
CHECK ("quantity" > 0);

-- ═══════════════════════════════════════════════════════════════
-- 2. ACTUALIZAR TABLA PETTYCASHPURCHASE
-- ═══════════════════════════════════════════════════════════════

-- Cambiar el tipo de dato de INTEGER a DECIMAL para permitir cantidades decimales
ALTER TABLE "PettyCashPurchase" 
ALTER COLUMN "quantity" TYPE DECIMAL(10,2);

-- ═══════════════════════════════════════════════════════════════
-- 3. ACTUALIZAR TABLA WAREHOUSE_PRODUCT
-- ═══════════════════════════════════════════════════════════════

-- Cambiar el tipo de dato de INTEGER a DECIMAL para permitir cantidades decimales
ALTER TABLE "Warehouse_Product" 
ALTER COLUMN "quantity" TYPE DECIMAL(10,2);

-- ═══════════════════════════════════════════════════════════════
-- 4. ACTUALIZAR FUNCIÓN update_warehouse_product_stock
-- ═══════════════════════════════════════════════════════════════

-- Recrear la función para manejar cantidades decimales
CREATE OR REPLACE FUNCTION update_warehouse_product_stock(
    p_product_id BIGINT,
    p_warehouse_id BIGINT,
    p_quantity_change DECIMAL(10,2)
) RETURNS VOID AS $$
BEGIN
    -- Verificar si existe la relación producto-bodega
    IF NOT EXISTS (
        SELECT 1 FROM "Warehouse_Product" 
        WHERE "productId" = p_product_id AND "warehouseId" = p_warehouse_id
    ) THEN
        -- Si no existe, crear la relación con la cantidad inicial
        INSERT INTO "Warehouse_Product" ("productId", "warehouseId", "quantity", "minStock", "maxStock")
        VALUES (p_product_id, p_warehouse_id, GREATEST(0, p_quantity_change), 0, NULL);
    ELSE
        -- Si existe, actualizar la cantidad
        UPDATE "Warehouse_Product"
        SET "quantity" = GREATEST(0, "quantity" + p_quantity_change),
            "updatedAt" = NOW()
        WHERE "productId" = p_product_id AND "warehouseId" = p_warehouse_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- 5. COMENTARIOS DE LA MIGRACIÓN
-- ═══════════════════════════════════════════════════════════════

COMMENT ON COLUMN "InventoryMovement"."quantity" IS 'Cantidad del movimiento - Ahora permite decimales (ej: 23.5 kg)';
COMMENT ON COLUMN "PettyCashPurchase"."quantity" IS 'Cantidad de la compra - Ahora permite decimales (ej: 23.5 kg)';
COMMENT ON COLUMN "Warehouse_Product"."quantity" IS 'Stock actual del producto - Ahora permite decimales (ej: 23.5 kg)';

-- ═══════════════════════════════════════════════════════════════
-- 6. VERIFICACIÓN
-- ═══════════════════════════════════════════════════════════════

-- Verificar que los cambios se aplicaron correctamente
SELECT 
  '✅ MIGRACIÓN COMPLETADA' as estado,
  'Cantidades decimales habilitadas' as descripcion,
  'Ahora puedes ingresar 23.5 kg de queso' as ejemplo; 