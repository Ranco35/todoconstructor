# Guía: Manejo de Facturas Antiguas sin Bodega

## 🎯 Problema
Facturas creadas **antes de la validación inteligente** están atoradas sin poder aprobarse porque:
- Sistema antiguo pedía bodega para TODAS las facturas
- Muchas son servicios que NO necesitan bodega
- No se pueden aprobar manualmente una por una

## 📋 Estrategia de Solución

### 1️⃣ **IDENTIFICACIÓN AUTOMÁTICA**
```sql
-- Ver facturas candidatas a servicios
SELECT 
    pi.number as factura,
    pi.total,
    pil.description,
    CASE 
        WHEN LOWER(pil.description) LIKE '%servicio%' THEN '🛠️ SERVICIO'
        WHEN LOWER(pil.description) LIKE '%control%' THEN '🛠️ SERVICIO'  
        WHEN LOWER(pil.description) LIKE '%plaga%' THEN '🛠️ SERVICIO'
        WHEN LOWER(pil.description) LIKE '%limpieza%' THEN '🛠️ SERVICIO'
        WHEN LOWER(pil.description) LIKE '%mantenimiento%' THEN '🛠️ SERVICIO'
        ELSE '📦 PRODUCTO'
    END as tipo_detectado
FROM purchase_invoices pi
LEFT JOIN purchase_invoice_lines pil ON pi.id = pil.purchase_invoice_id
WHERE pi.status = 'draft' AND pi.warehouse_id IS NULL;
```

### 2️⃣ **CATEGORÍAS DE FACTURAS ANTIGUAS**

#### 🛠️ **SERVICIOS CLAROS** (Aprobar automáticamente)
- Contienen: "servicio", "control", "mantenimiento", "limpieza"
- **Acción:** Aprobar sin bodega
- **Riesgo:** Bajo

#### 📦 **PRODUCTOS CLAROS** (Asignar bodega)
- Contienen: "compra", "producto", "material", "equipo"
- **Acción:** Asignar bodega antes de aprobar
- **Riesgo:** Medio (pueden ir al inventario incorrecto)

#### ❓ **DUDOSOS** (Revisar manualmente)
- Descripciones ambiguas o múltiples líneas
- **Acción:** Revisar caso por caso
- **Riesgo:** Alto

### 3️⃣ **PROCESO SEGURO**

#### **Fase 1: Análisis**
```sql
-- Ejecutar análisis completo
\i manejar-facturas-antiguas.sql
```

#### **Fase 2: Aprobación por Lotes**
```sql
-- Solo servicios OBVIAMENTE claros
UPDATE purchase_invoices 
SET status = 'approved', approved_at = NOW()
WHERE number IN ('FC250801-0001', 'FC250802-0002', ...);
```

#### **Fase 3: Asignación de Bodegas**
```sql
-- Para productos claros, asignar bodega principal
UPDATE purchase_invoices 
SET warehouse_id = 1  -- ID de bodega principal
WHERE number IN ('FC250803-0003', 'FC250804-0004', ...);
```

## 🚨 **PRECAUCIONES**

### ❌ **NO hacer:**
- Aprobar facturas de productos sin bodega
- Aprobación masiva sin revisar descripciones
- Asignar bodegas incorrectas

### ✅ **SÍ hacer:**
- Revisar facturas mixtas manualmente
- Backup de base de datos antes de cambios masivos
- Probar con pocas facturas primero

## 📊 **Métricas de Éxito**

| Métrica | Meta |
|---------|------|
| Facturas sin bodega | 0 |
| Servicios identificados | 100% |
| Productos con bodega correcta | 100% |
| Errores de clasificación | <5% |

## 🔮 **Prevención Futura**

Con la **validación inteligente** implementada:
- ✅ Nuevas facturas se clasifican automáticamente
- ✅ Servicios no pedirán bodega
- ✅ Productos sí pedirán bodega
- ✅ Interfaz clara con badges y mensajes