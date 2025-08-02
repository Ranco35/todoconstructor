# Módulo de Compras - Referencia Rápida Desarrollador

## ⚡ **COMANDOS ESENCIALES**

### **Verificación Estado (30s)**
```sql
-- 1. Verificar tablas existen
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'purchase_%';

-- 2. Contar registros
SELECT 'orders' as tipo, COUNT(*) as total FROM purchase_orders
UNION ALL SELECT 'invoices', COUNT(*) FROM purchase_invoices
UNION ALL SELECT 'payments', COUNT(*) FROM purchase_payments;

-- 3. Verificar montos
SELECT COALESCE(SUM(total), 0) as total_gastado FROM purchase_invoices;
```

### **Diagnóstico Rápido de Errores**
```sql
-- Error 42P01: Tabla no existe
SELECT COUNT(*) FROM purchase_payments; -- Si falla, aplicar script creación

-- Error 42703: Columna no existe  
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'purchase_orders';

-- Error 23503: Foreign key violada
SELECT supplier_id FROM purchase_orders WHERE supplier_id NOT IN (SELECT id FROM "Supplier");
```

---

## 🛠️ **SCRIPTS DE REPARACIÓN**

### **1. Recrear Tabla Payments (Si falta)**
```sql
CREATE SEQUENCE IF NOT EXISTS purchase_payments_id_seq;
CREATE TABLE IF NOT EXISTS public.purchase_payments (
    id bigint NOT NULL DEFAULT nextval('purchase_payments_id_seq'::regclass),
    invoice_id bigint NOT NULL,
    payment_date date NOT NULL,
    amount numeric(15,2) NOT NULL,
    payment_method varchar(50) DEFAULT 'transfer',
    reference varchar(100),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT purchase_payments_pkey PRIMARY KEY (id),
    CONSTRAINT fk_purchase_payments_invoice 
    FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(id) ON DELETE CASCADE
);
```

### **2. Insertar Datos Mínimos (Si vacío)**
```sql
-- Solo si no hay datos
INSERT INTO purchase_orders (number, supplier_id, status, total, currency) 
SELECT 'ORD-REPAIR-001', 4, 'draft', 50000, 'CLP'
WHERE NOT EXISTS (SELECT 1 FROM purchase_orders);

INSERT INTO purchase_invoices (number, supplier_id, status, total, currency)
SELECT 'INV-REPAIR-001', 4, 'received', 50000, 'CLP' 
WHERE NOT EXISTS (SELECT 1 FROM purchase_invoices);
```

### **3. Limpiar Datos de Prueba (Si necesario)**
```sql
DELETE FROM purchase_payments WHERE reference LIKE '%REPAIR%';
DELETE FROM purchase_invoices WHERE number LIKE '%REPAIR%';
DELETE FROM purchase_orders WHERE number LIKE '%REPAIR%';
```

---

## 🔧 **ESTRUCTURA FRONTEND**

### **Archivos Clave**
```
src/app/dashboard/purchases/page.tsx     -- Dashboard principal
src/actions/purchases/dashboard-stats.ts -- ⭐ Estadísticas críticas
src/types/purchases.ts                   -- Tipos TypeScript
src/components/purchases/                -- Componentes UI
```

### **Server Action Principal**
```typescript
// src/actions/purchases/dashboard-stats.ts
export async function getPurchaseStats(): Promise<PurchaseStats> {
  // Consulta purchase_orders para conteos
  // Consulta purchase_invoices para total gastado
  // Consulta purchase_payments para pagos
  // Retorna objeto con estadísticas
}
```

### **Interface Principal**
```typescript
// src/types/purchases.ts
export interface PurchaseStats {
  totalOrders: number;
  totalInvoices: number;
  totalPayments: number;
  totalSpent: number;
  pendingOrders: number;
  pendingInvoices: number;
  // ...más campos
}
```

---

## 🚨 **TROUBLESHOOTING EXPRESS**

### **Error: Dashboard muestra $0**
1. **Verificar BD:**
   ```sql
   SELECT COUNT(*) FROM purchase_invoices;
   ```
2. **Si 0 registros:** Ejecutar script de datos mínimos arriba
3. **Si error tabla:** Ejecutar script de recreación arriba

### **Error: "Table does not exist"**
```bash
# 1. Ir a Supabase SQL Editor
# 2. Ejecutar script completo: crear-tablas-compras-faltantes.sql
# 3. Verificar con: SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'purchase_%';
```

### **Error: "Foreign key constraint violated"**
```sql
-- Verificar proveedores existen
SELECT id FROM "Supplier" WHERE id IN (4, 9, 10);
-- Si no existen, usar IDs reales o crear proveedores de prueba
```

---

## 📊 **MÉTRICAS DE MONITOREO**

### **Estado Saludable**
```sql
-- Debe retornar al menos:
-- purchase_orders: ≥1 registro
-- purchase_invoices: ≥1 registro  
-- purchase_payments: ≥1 registro
-- Total gastado: >$0
SELECT 
  (SELECT COUNT(*) FROM purchase_orders) as orders,
  (SELECT COUNT(*) FROM purchase_invoices) as invoices,
  (SELECT COUNT(*) FROM purchase_payments) as payments,
  (SELECT COALESCE(SUM(total), 0) FROM purchase_invoices) as total_spent;
```

### **Alertas Críticas**
- 🚨 **Sin tablas:** purchase_payments no existe
- 🚨 **Sin datos:** Todas las tablas en 0 registros
- 🚨 **Sin montos:** total_spent = 0 con datos existentes
- ⚠️ **FK rotas:** Órdenes con supplier_id inexistente

---

## 🎯 **CHECKLIST DESPLIEGUE**

### **Antes de Deploy**
- [ ] Tablas `purchase_*` existen (4 tablas)
- [ ] Foreign keys configuradas
- [ ] Al menos 1 registro de prueba en cada tabla
- [ ] Total gastado > $0 en dashboard
- [ ] Frontend carga sin errores 404/500

### **Después de Deploy**
- [ ] URL accessible: `/dashboard/purchases`
- [ ] Estadísticas muestran datos reales
- [ ] Botones "Nueva Orden/Factura/Pago" funcionan
- [ ] No errores en consola del navegador

### **Rollback de Emergencia**
```sql
-- Si algo falla, ejecutar datos mínimos:
INSERT INTO purchase_invoices (number, supplier_id, status, total, currency)
VALUES ('EMERGENCY-001', 4, 'paid', 100000, 'CLP');
```

---

## 💡 **TIPS DE DESARROLLO**

### **Debugging Local**
```typescript
// En dashboard-stats.ts, agregar logs temporales:
console.log('Purchase stats query result:', result);
```

### **Testing Rápido**
```sql
-- Insertar orden de prueba rápida
INSERT INTO purchase_orders (number, supplier_id, status, total, currency)
VALUES ('TEST-' || EXTRACT(EPOCH FROM NOW()), 4, 'draft', 1000, 'CLP');
```

### **Limpiar Testing**
```sql
DELETE FROM purchase_orders WHERE number LIKE 'TEST-%';
```

---

## 📝 **NOTAS IMPORTANTES**

1. **IDs de Proveedores Reales:** 4, 9, 10 (verificado 2025-01-19)
2. **Moneda Estándar:** CLP (Pesos Chilenos)
3. **Estados Válidos:** draft, sent, approved, received, paid, cancelled
4. **Tabla Crítica:** `purchase_payments` - la que más falla

---

**⚡ REFERENCIA RÁPIDA v1.0**  
**Última Actualización:** 2025-01-19  
**Para emergencias:** Ejecutar scripts de reparación arriba 