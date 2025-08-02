# Sistema de Recuperación de Sesiones Eliminadas

## Problema Recurrente
**Segunda vez que ocurre:** El sistema reporta "La sesión con ID X no existe o fue eliminada" pero la interfaz aún cree que hay una sesión activa. Esto ha pasado con:
- Sesión ID 5 (primera vez)
- Sesión ID 6 (segunda vez)

## Causa del Problema
Las sesiones están siendo **eliminadas físicamente** de la base de datos en lugar de solo **cerradas**. Esto rompe la integridad referencial con las transacciones asociadas.

### Posibles Causas de Eliminación:
1. **DeleteSessionModal.tsx** - Modal de eliminación desde historial
2. **deleteCashSession()** - Action que elimina sesiones de la BD
3. **Scripts de limpieza** manuales o automáticos
4. **Eliminación directa** desde dashboard de BD
5. **Reset mal configurado** que elimina en lugar de cerrar

## Solución Implementada

### 1. Detección Automática Mejorada
El sistema ahora detecta automáticamente cuando una sesión fue eliminada y ofrece recuperación:

```typescript
// En CashClosureModal.tsx
if (errorMessage.includes('no existe o fue eliminada')) {
  const confirmMessage = `❌ ERROR: ${errorMessage}

🔍 PROBLEMA DETECTADO: La sesión de caja fue eliminada por error.

💡 SOLUCIÓN AUTOMÁTICA DISPONIBLE:
¿Quieres crear una nueva sesión con el monto que tienes en caja ($${actualCash.toLocaleString()})?

✅ SI = Crear nueva sesión automáticamente
❌ NO = Solo recargar la página`;
  
  const shouldCreateNewSession = confirm(confirmMessage);
  // ... lógica de recuperación
}
```

### 2. Recuperación Automática
Cuando el usuario acepta, el sistema:
1. **Crea nueva sesión** con el monto actual contado
2. **Asigna usuario por defecto** (ID: 1)
3. **Agrega notas explicativas** del proceso de recuperación
4. **Recarga la página** para mostrar la nueva sesión
5. **Permite continuar trabajando** sin perder datos

### 3. Validaciones Robustas
```typescript
// En cash-closure-actions.ts
if (sessionError?.code === 'PGRST116') {
  errorMessage = `La sesión con ID ${sessionId} no existe o fue eliminada`;
}
```

## Prevención de Futuras Eliminaciones

### 1. Reglas de Negocio
- **NUNCA eliminar** sesiones con transacciones asociadas
- **Solo CERRAR** sesiones, no eliminarlas
- **Usar soft-delete** si es absolutamente necesario eliminar
- **Mantener integridad** referencial siempre

### 2. Restricciones Implementadas
```typescript
// En deleteCashSession()
if (existingSession.PettyCashExpense?.length > 0 || 
    existingSession.PettyCashPurchase?.length > 0 ||
    existingSession.CashClosure?.length > 0) {
  return { success: false, error: 'No se puede eliminar una sesión con transacciones asociadas' };
}
```

### 3. Scripts de Monitoreo
Creado `monitor-session-deletions.js` para:
- Detectar gaps en IDs de sesiones
- Identificar transacciones huérfanas
- Alertar sobre eliminaciones
- Proponer soluciones

## Procedimiento de Recuperación Manual

### Opción 1: Recuperación Automática (Recomendada)
1. **Intentar cerrar caja** (aparecerá el error)
2. **Aceptar recuperación automática** cuando se ofrezca
3. **Continuar trabajando** con la nueva sesión

### Opción 2: Recuperación Manual
1. **Recargar página** en navegador (F5)
2. **Ir a interfaz sin sesión** 
3. **Crear nueva sesión** con monto real
4. **Continuar operaciones** normalmente

### Opción 3: Recuperación por Script
```bash
# Ejecutar script de monitoreo
node scripts/monitor-session-deletions.js

# O crear sesión de emergencia
node scripts/create-new-session-simple.js
```

## Logs de Auditoría

### Detectar Eliminaciones
```sql
-- Verificar gaps en IDs de sesiones
SELECT 
  id,
  LAG(id) OVER (ORDER BY id) as prev_id,
  id - LAG(id) OVER (ORDER BY id) as gap
FROM "CashSession" 
ORDER BY id;
```

### Encontrar Transacciones Huérfanas
```sql
-- Gastos sin sesión
SELECT e.* 
FROM "PettyCashExpense" e
LEFT JOIN "CashSession" s ON e."sessionId" = s.id
WHERE s.id IS NULL;

-- Compras sin sesión
SELECT p.* 
FROM "PettyCashPurchase" p
LEFT JOIN "CashSession" s ON p."sessionId" = s.id
WHERE s.id IS NULL;
```

## Mejoras Futuras

### 1. Soft Delete
Implementar eliminación lógica:
```sql
ALTER TABLE "CashSession" ADD COLUMN "deletedAt" TIMESTAMP;
CREATE INDEX idx_cash_session_not_deleted ON "CashSession" WHERE "deletedAt" IS NULL;
```

### 2. Logs de Auditoría
```sql
CREATE TABLE "CashSessionAudit" (
  id SERIAL PRIMARY KEY,
  sessionId INTEGER,
  action VARCHAR(50), -- 'created', 'closed', 'deleted', 'modified'
  userId INTEGER,
  timestamp TIMESTAMP DEFAULT NOW(),
  oldValues JSONB,
  newValues JSONB,
  reason TEXT
);
```

### 3. Backup Automático
Respaldar sesiones antes de cualquier operación destructiva.

## Conclusión

El sistema ahora es **resistente a eliminaciones accidentales** de sesiones y puede **recuperarse automáticamente**. Sin embargo, es crucial **prevenir las eliminaciones** en lugar de solo reaccionar a ellas.

### Acciones Inmediatas:
1. ✅ **Sistema de recuperación** implementado
2. ✅ **Detección automática** funcionando  
3. ✅ **Validaciones robustas** agregadas
4. 🔄 **Identificar origen** de eliminaciones
5. 🔄 **Implementar prevención** completa

### Estado Actual:
- **Problema:** Resuelto con recuperación automática
- **Prevención:** Parcial (validaciones básicas)
- **Monitoreo:** Script disponible
- **Documentación:** Completa

**El usuario puede continuar trabajando normalmente** usando la recuperación automática cuando aparezca el error. 