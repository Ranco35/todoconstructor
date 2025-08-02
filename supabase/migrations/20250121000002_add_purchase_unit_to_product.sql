-- ═══════════════════════════════════════════════════════════════
-- 🎯 MIGRATION: Agregar purchaseunitid a Product
-- ═══════════════════════════════════════════════════════════════
-- Fecha: 2025-01-21
-- Descripción: Agregar columna purchaseunitid para unidad de compra del producto

-- ═══════════════════════════════════════════════════════════════
-- 1. AGREGAR COLUMNA PURCHASEUNITID
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "purchaseunitid" INTEGER DEFAULT 1;

-- ═══════════════════════════════════════════════════════════════
-- 2. AGREGAR COMENTARIO A LA COLUMNA
-- ═══════════════════════════════════════════════════════════════

COMMENT ON COLUMN "Product"."purchaseunitid" IS 'ID de la unidad de medida para compras del producto';

-- ═══════════════════════════════════════════════════════════════
-- 3. ACTUALIZAR PRODUCTOS EXISTENTES
-- ═══════════════════════════════════════════════════════════════

-- Establecer purchaseunitid = 1 (Pieza) para productos existentes que no tengan valor
UPDATE "Product" 
SET "purchaseunitid" = 1 
WHERE "purchaseunitid" IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- 4. VERIFICAR LA MIGRACIÓN
-- ═══════════════════════════════════════════════════════════════

-- Verificar que la columna existe
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'Product' 
  AND column_name = 'purchaseunitid';

-- Verificar productos con purchaseunitid
SELECT 
  COUNT(*) as total_productos,
  COUNT(CASE WHEN purchaseunitid IS NOT NULL THEN 1 END) as con_purchaseunitid,
  COUNT(CASE WHEN purchaseunitid = 1 THEN 1 END) as con_purchaseunitid_1
FROM "Product"; 