-- =====================================================
-- SCRIPT SQL FINAL PARA CREAR TABLA DE MOVIMIENTOS
-- Ejecutar en Supabase SQL Editor - VERSIÓN CORREGIDA
-- =====================================================

-- Crear tabla para registrar movimientos de inventario entre bodegas
CREATE TABLE "InventoryMovement" (
    "id" BIGSERIAL PRIMARY KEY,
    "productId" BIGINT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
    "fromWarehouseId" BIGINT REFERENCES "Warehouse"("id") ON DELETE SET NULL,
    "toWarehouseId" BIGINT REFERENCES "Warehouse"("id") ON DELETE SET NULL,
    "movementType" VARCHAR(50) NOT NULL CHECK ("movementType" IN ('TRANSFER', 'ENTRADA', 'SALIDA', 'AJUSTE')),
    "quantity" INTEGER NOT NULL CHECK ("quantity" > 0),
    "reason" TEXT,
    "notes" TEXT,
    "userId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX "idx_inventory_movement_product" ON "InventoryMovement"("productId");
CREATE INDEX "idx_inventory_movement_from_warehouse" ON "InventoryMovement"("fromWarehouseId");
CREATE INDEX "idx_inventory_movement_to_warehouse" ON "InventoryMovement"("toWarehouseId");
CREATE INDEX "idx_inventory_movement_type" ON "InventoryMovement"("movementType");
CREATE INDEX "idx_inventory_movement_created_at" ON "InventoryMovement"("createdAt");
CREATE INDEX "idx_inventory_movement_user" ON "InventoryMovement"("userId");

-- Crear función para actualizar updatedAt automáticamente
CREATE OR REPLACE FUNCTION update_inventory_movement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updatedAt
CREATE TRIGGER trigger_inventory_movement_updated_at
    BEFORE UPDATE ON "InventoryMovement"
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_movement_updated_at();

-- Crear función para actualizar stock en bodegas
CREATE OR REPLACE FUNCTION update_warehouse_product_stock(
    p_product_id BIGINT,
    p_warehouse_id BIGINT,
    p_quantity_change INTEGER
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

-- Crear políticas RLS para InventoryMovement
ALTER TABLE "InventoryMovement" ENABLE ROW LEVEL SECURITY;

-- Política para lectura: todos los usuarios autenticados pueden ver movimientos
CREATE POLICY "inventory_movement_select_policy" ON "InventoryMovement"
    FOR SELECT
    TO authenticated
    USING (true);

-- Política para inserción: usuarios autenticados pueden crear movimientos
CREATE POLICY "inventory_movement_insert_policy" ON "InventoryMovement"
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Política para actualización: usuarios autenticados pueden actualizar movimientos
CREATE POLICY "inventory_movement_update_policy" ON "InventoryMovement"
    FOR UPDATE
    TO authenticated
    USING (true);

-- Política para eliminación: solo administradores pueden eliminar movimientos
CREATE POLICY "inventory_movement_delete_policy" ON "InventoryMovement"
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User" u
            JOIN "Role" r ON u."roleId" = r.id
            WHERE u.id = auth.uid()
            AND r.name = 'ADMINISTRADOR'
        )
    );

-- Comentarios para documentar la tabla
COMMENT ON TABLE "InventoryMovement" IS 'Tabla para registrar movimientos de inventario entre bodegas';
COMMENT ON COLUMN "InventoryMovement"."movementType" IS 'Tipos: TRANSFER (entre bodegas), ENTRADA (ingreso), SALIDA (egreso), AJUSTE (corrección)';
COMMENT ON COLUMN "InventoryMovement"."fromWarehouseId" IS 'Bodega de origen (puede ser NULL para entradas)';
COMMENT ON COLUMN "InventoryMovement"."toWarehouseId" IS 'Bodega de destino (puede ser NULL para salidas)';
COMMENT ON COLUMN "InventoryMovement"."reason" IS 'Razón del movimiento (venta, compra, transferencia, ajuste, etc.)';
COMMENT ON COLUMN "InventoryMovement"."notes" IS 'Notas adicionales sobre el movimiento';

-- =====================================================
-- VERIFICACIÓN - Comprobar que la tabla se creó correctamente
-- =====================================================

-- Verificar que la tabla existe
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'InventoryMovement'
ORDER BY ordinal_position;

-- Verificar que las políticas RLS están activas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'InventoryMovement';

-- Verificar que la función existe
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'update_warehouse_product_stock'; 