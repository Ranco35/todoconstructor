# Guía de Resolución de Problemas - Sistema de Caja Chica

## Problemas Comunes y Soluciones

### 🔒 Problemas de Sesión

#### "No hay sesión activa" / No puedo acceder al sistema

**Síntomas:**
- Mensaje "No hay sesión activa"
- Botones deshabilitados
- Solo se muestra información del sistema

**Diagnóstico:**
```bash
# Verificar en base de datos
SELECT * FROM CashSession 
WHERE status = 'OPEN' 
AND cashRegisterId = [ID_CAJA];
```

**Soluciones:**

1. **Verificar permisos de usuario**
   ```typescript
   // Verificar roles en constants/index.ts
   // El usuario debe tener acceso a 'Caja Chica'
   ```

2. **Abrir nueva sesión (Admin/Supervisor)**
   ```typescript
   // Crear nueva sesión
   const formData = new FormData();
   formData.append('userId', '1');
   formData.append('cashRegisterId', '1');
   formData.append('openingAmount', '50000');
   await createCashSession(formData);
   ```

3. **Verificar configuración de caja registradora**
   ```sql
   SELECT * FROM CashRegister WHERE id = [ID_CAJA];
   ```

**Prevención:**
- Establecer horarios de apertura automática
- Notificaciones a supervisores para abrir sesiones
- Proceso de apertura documentado

---

### 💸 Problemas con Gastos

#### "Error al crear el gasto de caja chica"

**Síntomas:**
- Formulario no se envía
- Mensaje de error al registrar
- Datos no se guardan

**Diagnóstico paso a paso:**

1. **Verificar límites**
   ```typescript
   const availableAmount = 30000 - currentSpent;
   if (requestedAmount > availableAmount) {
     return { error: 'Excede límite diario' };
   }
   ```

2. **Verificar campos requeridos**
   ```typescript
   if (!description || !amount || !category) {
     return { error: 'Campos requeridos faltantes' };
   }
   ```

3. **Revisar logs del servidor**
   ```bash
   # En desarrollo
   console.log('Error creating expense:', error);
   
   # En producción
   tail -f /var/log/app/petty-cash.log
   ```

**Soluciones comunes:**

1. **Límite excedido**
   - Verificar gasto total del día
   - Esperar aprobaciones pendientes
   - Contactar supervisor para aumento temporal

2. **Problemas de validación**
   ```typescript
   // Verificar tipos de datos
   const amount = parseFloat(formData.get('amount'));
   if (isNaN(amount) || amount <= 0) {
     return { error: 'Monto inválido' };
   }
   ```

3. **Error de conexión a base de datos**
   ```typescript
   try {
     await prisma.pettyCashExpense.create({...});
   } catch (error) {
     if (error.code === 'P2002') {
       return { error: 'Transacción duplicada' };
     }
     return { error: 'Error de base de datos' };
   }
   ```

#### "Gasto pendiente de aprobación por mucho tiempo"

**Diagnóstico:**
1. Verificar monto del gasto (>$15,000 requiere aprobación)
2. Verificar disponibilidad de supervisores
3. Revisar estado en base de datos

```sql
SELECT pe.*, u.name as requested_by, au.name as approved_by 
FROM PettyCashExpense pe
LEFT JOIN User u ON pe.requestedBy = u.id
LEFT JOIN User au ON pe.approvedBy = au.id
WHERE pe.status = 'PENDING'
ORDER BY pe.requestedAt DESC;
```

**Soluciones:**
1. Notificar supervisor directamente
2. Verificar configuración de notificaciones
3. Establecer SLA para aprobaciones (max 4 horas)

---

### 🛒 Problemas con Compras

#### "Error al crear la compra de caja chica"

**Diagnóstico específico:**

1. **Verificar cálculo de total**
   ```typescript
   const totalAmount = quantity * unitPrice;
   if (totalAmount !== expectedTotal) {
     return { error: 'Error en cálculo de total' };
   }
   ```

2. **Validar datos del producto**
   ```typescript
   if (!productName || !supplier || quantity <= 0 || unitPrice <= 0) {
     return { error: 'Datos de producto inválidos' };
   }
   ```

3. **Verificar integración con inventario**
   ```typescript
   // Si productId está especificado, verificar que existe
   if (productId) {
     const product = await prisma.product.findUnique({
       where: { id: productId }
     });
     if (!product) {
       return { error: 'Producto no encontrado' };
     }
   }
   ```

**Soluciones:**
1. **Error de cálculo**: Refrescar página y reintentar
2. **Producto inexistente**: Crear producto primero o usar productId válido
3. **Problemas de inventario**: Verificar módulo de inventario

#### "Compra aprobada pero inventario no actualizado"

**Diagnóstico:**
```sql
-- Verificar el estado de la compra
SELECT * FROM PettyCashPurchase WHERE id = [PURCHASE_ID];

-- Verificar movimientos de inventario (si existe tabla)
SELECT * FROM InventoryMovement 
WHERE reference_type = 'PETTY_CASH_PURCHASE' 
AND reference_id = [PURCHASE_ID];
```

**Solución:**
```typescript
// Función de reconciliación manual
async function reconcilePurchaseInventory(purchaseId: number) {
  const purchase = await prisma.pettyCashPurchase.findUnique({
    where: { id: purchaseId }
  });
  
  if (purchase?.status === 'APPROVED' && purchase.productId) {
    // Actualizar inventario manualmente
    await updateProductInventory(purchase.productId, purchase.quantity);
  }
}
```

---

### 🔒 Problemas de Cierre de Caja

#### "Error al crear el cierre de caja"

**Síntomas:**
- Modal no procesa el cierre
- Cálculos incorrectos
- Sesión no se cierra

**Diagnóstico completo:**

1. **Verificar cálculos automáticos**
   ```typescript
   const summary = await getCashClosureSummary(sessionId);
   console.log('Summary calculations:', {
     openingAmount: summary.openingAmount,
     totalSales: summary.totalSales,
     totalExpenses: summary.totalExpenses,
     totalPurchases: summary.totalPurchases,
     expectedCash: summary.expectedCash
   });
   ```

2. **Verificar ventas del día**
   ```sql
   SELECT SUM(i.total) as total_sales
   FROM Sale s
   JOIN Invoice i ON s.invoiceId = i.id
   WHERE s.cashRegisterId = [CASH_REGISTER_ID]
   AND DATE(s.date) = CURRENT_DATE;
   ```

3. **Verificar gastos y compras aprobados**
   ```sql
   -- Gastos aprobados
   SELECT SUM(amount) as total_expenses
   FROM PettyCashExpense
   WHERE sessionId = [SESSION_ID] AND status = 'APPROVED';
   
   -- Compras aprobadas
   SELECT SUM(totalAmount) as total_purchases
   FROM PettyCashPurchase
   WHERE sessionId = [SESSION_ID] AND status = 'APPROVED';
   ```

**Soluciones por tipo de error:**

1. **Cálculo incorrecto de ventas**
   - Verificar que todas las ventas estén registradas
   - Revisar configuración de tipos de pago (efectivo/tarjeta)
   - Actualizar porcentajes si es necesario

2. **Transacciones pendientes**
   ```typescript
   // Verificar pendientes antes del cierre
   const pendingCount = await prisma.pettyCashExpense.count({
     where: { sessionId, status: 'PENDING' }
   }) + await prisma.pettyCashPurchase.count({
     where: { sessionId, status: 'PENDING' }
   });
   
   if (pendingCount > 0) {
     return { error: 'Hay transacciones pendientes' };
   }
   ```

3. **Diferencia mayor a tolerancia**
   ```typescript
   const difference = Math.abs(actualCash - expectedCash);
   const tolerance = 1000;
   
   if (difference > tolerance) {
     // Requiere aprobación de supervisor
     return { 
       needsSupervisorApproval: true,
       difference: actualCash - expectedCash
     };
   }
   ```

#### "Diferencias constantes en cierre de caja"

**Análisis de causas comunes:**

1. **Ventas no registradas**
   ```sql
   -- Comparar con registros de POS si existen
   SELECT DATE(date), COUNT(*), SUM(total)
   FROM Sale s
   JOIN Invoice i ON s.invoiceId = i.id
   WHERE cashRegisterId = [ID]
   GROUP BY DATE(date)
   ORDER BY DATE(date) DESC;
   ```

2. **Cambios incorrectos**
   - Revisar entrenamiento de personal
   - Implementar verificación doble para cambios grandes
   - Crear log de cambios entregados

3. **Gastos no registrados**
   ```sql
   -- Buscar patrones en diferencias
   SELECT 
     DATE(closedAt) as date,
     difference,
     notes
   FROM CashClosure
   WHERE ABS(difference) > 500
   ORDER BY closedAt DESC;
   ```

**Soluciones:**
1. **Capacitación adicional** para manejo de efectivo
2. **Implementar doble conteo** obligatorio
3. **Auditores aleatorios** para verificar procesos
4. **Cámaras de seguridad** en área de caja

---

### 🔧 Problemas Técnicos

#### "La página no carga / Error de conexión"

**Diagnóstico de red:**
```bash
# Verificar conectividad
ping api.tudominio.com

# Verificar puerto de aplicación
telnet localhost 3000

# Verificar logs del servidor
tail -f /var/log/nginx/error.log
tail -f /var/log/app/error.log
```

**Soluciones:**
1. **Problemas de red**: Verificar conexión a internet
2. **Servidor caído**: Reiniciar servicios
3. **Base de datos desconectada**: Verificar conexión a DB
4. **Cache corrupto**: Limpiar cache del navegador

#### "Datos no se sincronizan"

**Verificar estado de sincronización:**
```typescript
// En el componente, verificar si los datos son fresh
const [lastUpdate, setLastUpdate] = useState(Date.now());

useEffect(() => {
  const interval = setInterval(() => {
    // Verificar si hay actualizaciones
    checkForUpdates();
  }, 30000); // cada 30 segundos

  return () => clearInterval(interval);
}, []);
```

**Soluciones:**
1. **Implementar WebSockets** para actualizaciones en tiempo real
2. **Polling automático** cada cierto tiempo
3. **Botón de refrescar** manual
4. **Notificaciones** cuando hay cambios externos

#### "Performance lenta"

**Optimizaciones de base de datos:**
```sql
-- Índices recomendados
CREATE INDEX idx_petty_cash_expense_session ON PettyCashExpense(sessionId);
CREATE INDEX idx_petty_cash_purchase_session ON PettyCashPurchase(sessionId);
CREATE INDEX idx_cash_session_status ON CashSession(status, cashRegisterId);
CREATE INDEX idx_sale_date_cash_register ON Sale(date, cashRegisterId);
```

**Optimizaciones de frontend:**
```typescript
// Lazy loading de componentes
const ExpenseForm = lazy(() => import('./ExpenseForm'));
const PurchaseForm = lazy(() => import('./PurchaseForm'));

// Memoización de cálculos pesados
const expensiveCalculation = useMemo(() => {
  return calculateComplexSummary(data);
}, [data]);
```

---

### 📊 Problemas de Reportes

#### "Números no coinciden con registros manuales"

**Verificación cruzada:**
```sql
-- Reporte de conciliación diaria
SELECT 
  DATE(s.openedAt) as date,
  s.sessionNumber,
  s.openingAmount,
  s.closingAmount,
  cc.expectedCash,
  cc.actualCash,
  cc.difference,
  (SELECT SUM(amount) FROM PettyCashExpense pe WHERE pe.sessionId = s.id AND pe.status = 'APPROVED') as expenses,
  (SELECT SUM(totalAmount) FROM PettyCashPurchase pp WHERE pp.sessionId = s.id AND pp.status = 'APPROVED') as purchases
FROM CashSession s
LEFT JOIN CashClosure cc ON cc.sessionId = s.id
WHERE DATE(s.openedAt) = '2024-01-15'
ORDER BY s.openedAt;
```

**Soluciones:**
1. **Verificar filtros de fecha** en reportes
2. **Confirmar zona horaria** en cálculos
3. **Revisar estados de transacciones** (solo aprobadas)
4. **Validar períodos de tiempo** (00:00 a 23:59)

---

## Herramientas de Diagnóstico

### Script de Verificación Completa

```typescript
// scripts/verify-petty-cash-integrity.ts
async function verifyIntegrity(sessionId: number) {
  console.log('🔍 Verificando integridad de sesión:', sessionId);
  
  // 1. Verificar sesión existe
  const session = await prisma.cashSession.findUnique({
    where: { id: sessionId }
  });
  console.log('✅ Sesión encontrada:', session?.sessionNumber);
  
  // 2. Verificar gastos
  const expenses = await prisma.pettyCashExpense.findMany({
    where: { sessionId }
  });
  console.log('💸 Gastos encontrados:', expenses.length);
  
  // 3. Verificar compras
  const purchases = await prisma.pettyCashPurchase.findMany({
    where: { sessionId }
  });
  console.log('🛒 Compras encontradas:', purchases.length);
  
  // 4. Verificar cierre
  const closure = await prisma.cashClosure.findUnique({
    where: { sessionId }
  });
  console.log('🔒 Cierre encontrado:', closure ? 'Sí' : 'No');
  
  // 5. Verificar cálculos
  const totalExpenses = expenses
    .filter(e => e.status === 'APPROVED')
    .reduce((sum, e) => sum + e.amount, 0);
  
  const totalPurchases = purchases
    .filter(p => p.status === 'APPROVED')
    .reduce((sum, p) => sum + p.totalAmount, 0);
  
  console.log('📊 Totales calculados:', {
    expenses: totalExpenses,
    purchases: totalPurchases,
    total: totalExpenses + totalPurchases
  });
}
```

### Comandos de Limpieza

```sql
-- Limpiar sesiones huérfanas (más de 24h sin cerrar)
UPDATE CashSession 
SET status = 'SUSPENDED'
WHERE status = 'OPEN' 
AND openedAt < NOW() - INTERVAL '24 hours';

-- Limpiar transacciones pendientes muy antiguas
UPDATE PettyCashExpense 
SET status = 'REJECTED', 
    notes = 'Auto-rechazado por antigüedad'
WHERE status = 'PENDING' 
AND requestedAt < NOW() - INTERVAL '48 hours';

UPDATE PettyCashPurchase 
SET status = 'REJECTED', 
    notes = 'Auto-rechazado por antigüedad'
WHERE status = 'PENDING' 
AND requestedAt < NOW() - INTERVAL '48 hours';
```

### Monitoreo Proactivo

```typescript
// Alertas automáticas
async function checkSystemHealth() {
  // Verificar sesiones sin cerrar
  const openSessions = await prisma.cashSession.count({
    where: { 
      status: 'OPEN',
      openedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  });
  
  if (openSessions > 0) {
    await sendAlert('Hay sesiones sin cerrar por más de 24h');
  }
  
  // Verificar transacciones pendientes
  const pendingCount = await prisma.pettyCashExpense.count({
    where: { 
      status: 'PENDING',
      requestedAt: { lt: new Date(Date.now() - 4 * 60 * 60 * 1000) }
    }
  });
  
  if (pendingCount > 0) {
    await sendAlert(`${pendingCount} transacciones pendientes por más de 4h`);
  }
}
```

## Contactos de Escalación

### Nivel 1 - Soporte Técnico
- **Email**: soporte@empresa.com
- **Teléfono**: ext. 123
- **Horario**: 8:00 AM - 6:00 PM

### Nivel 2 - Administrador de Sistema
- **Email**: admin@empresa.com
- **Teléfono**: ext. 456
- **Para**: Problemas de base de datos, performance

### Nivel 3 - Desarrollador
- **Email**: dev@empresa.com
- **Para**: Bugs críticos, cambios en código

### Emergencias (24/7)
- **Teléfono**: +1-xxx-xxx-xxxx
- **Para**: Sistema completamente caído, pérdida de datos 