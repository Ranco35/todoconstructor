-- ============================================
-- VERIFICAR CATEGORÍAS POS EN BASE DE DATOS
-- ============================================

-- 1. Ver todas las categorías POS disponibles
SELECT 
  id,
  name,
  "displayName",
  icon,
  color,
  "cashRegisterTypeId",
  "isActive",
  "sortOrder"
FROM "POSProductCategory"
ORDER BY "cashRegisterTypeId", "sortOrder";

-- 2. Contar categorías por tipo de caja
SELECT 
  "cashRegisterTypeId",
  CASE 
    WHEN "cashRegisterTypeId" = 1 THEN 'Ferreteria'
    WHEN "cashRegisterTypeId" = 2 THEN 'Ferreteria2'
    ELSE 'Otro'
  END as tipo_pos,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE "isActive" = true) as activas,
  COUNT(*) FILTER (WHERE "isActive" = false) as inactivas
FROM "POSProductCategory"
GROUP BY "cashRegisterTypeId"
ORDER BY "cashRegisterTypeId";

-- 3. Ver categorías asignadas al producto ID 16
SELECT 
  ppc.*,
  cat."displayName" as categoria_nombre,
  cat.icon as categoria_icon
FROM "ProductPOSCategory" ppc
LEFT JOIN "POSProductCategory" cat ON ppc."posCategoryId" = cat.id
WHERE ppc."productId" = 16;

-- 4. Si no existen categorías, crear algunas de ejemplo
-- NOTA: Solo ejecutar esto si la consulta #1 no muestra resultados

/*
INSERT INTO "POSProductCategory" ("name", "displayName", "icon", "color", "cashRegisterTypeId", "sortOrder", "isActive") VALUES
-- Ferreteria (tipo 1)
('herramientas', 'Herramientas', '🔧', '#2563EB', 1, 1, true),
('materiales', 'Materiales', '🧱', '#059669', 1, 2, true),
('electricos', 'Eléctricos', '⚡', '#DC2626', 1, 3, true),
('pinturas', 'Pinturas', '🎨', '#EA580C', 1, 4, true),

-- Ferreteria2 (tipo 2)
('herramientas_pro', 'Herramientas Profesionales', '🔨', '#7C3AED', 2, 1, true),
('construccion', 'Construcción', '🏗️', '#10B981', 2, 2, true),
('plomeria', 'Plomería', '🚿', '#0EA5E9', 2, 3, true),
('ferreteria_general', 'Ferretería General', '🛠️', '#F59E0B', 2, 4, true)
ON CONFLICT DO NOTHING;
*/

