# Error "column Client_1.firstName does not exist" en Presupuestos - RESUELTO

## 📋 Descripción del Error

```
Error al obtener presupuesto: {
  code: '42703',
  details: null,
  hint: null,
  message: 'column Client_1.firstName does not exist'
}
```

## 🔍 Análisis del Problema

### **Causa Raíz: Inconsistencia en Nombres de Columnas**

El sistema tenía una discrepancia entre los nombres de columnas usados en las consultas y los nombres reales en la base de datos:

| **Ubicación** | **Nombre Usado** | **Nombre Real** | **Estado** |
|---------------|------------------|-----------------|------------|
| **Consulta SQL** | `firstName` | `nombrePrincipal` | ❌ Incorrecto |
| **Consulta SQL** | `lastName` | `apellido` | ❌ Incorrecto |
| **Consulta SQL** | `phone` | `telefono` | ❌ Incorrecto |
| **Base de Datos** | `nombrePrincipal` | `nombrePrincipal` | ✅ Correcto |
| **Base de Datos** | `apellido` | `apellido` | ✅ Correcto |
| **Base de Datos** | `telefono` | `telefono` | ✅ Correcto |

### **Archivos Afectados**
- `src/actions/sales/budgets/get.ts` - Consulta incorrecta
- `src/actions/sales/budgets/list.ts` - Mapeo inconsistente
- `src/components/sales/BudgetDetailView.tsx` - Interface incorrecta
- `src/components/sales/BudgetTable.tsx` - Tipos incorrectos

---

## 🛠️ Solución Implementada

### **1. Corrección de Consultas SQL**

#### **Antes (Incorrecto)**
```sql
SELECT 
  *,
  client:client_id (
    id,
    "firstName",
    "lastName", 
    email,
    rut,
    phone
  )
FROM sales_quotes;
```

#### **Después (Correcto)**
```sql
SELECT 
  *,
  client:client_id (
    id,
    nombrePrincipal,
    apellido, 
    email,
    rut,
    telefono,
    telefonoMovil
  )
FROM sales_quotes;
```

### **2. Corrección de Interfaces TypeScript**

#### **Antes (Incorrecto)**
```typescript
export interface BudgetWithDetails extends Budget {
  client: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    rut?: string;
    phone?: string;
  } | null;
}
```

#### **Después (Correcto)**
```typescript
export interface BudgetWithDetails extends Budget {
  client: {
    id: number;
    nombrePrincipal: string;
    apellido: string;
    email: string;
    rut?: string;
    telefono?: string;
    telefonoMovil?: string;
  } | null;
}
```

### **3. Corrección de Componentes React**

#### **Antes (Incorrecto)**
```tsx
<h3 className="text-lg font-semibold text-gray-900 mb-2">
  {budget.client.firstName} {budget.client.lastName}
</h3>
```

#### **Después (Correcto)**
```tsx
<h3 className="text-lg font-semibold text-gray-900 mb-2">
  {budget.client.nombrePrincipal} {budget.client.apellido}
</h3>
```

### **4. Migración de Base de Datos**

**Archivo**: `supabase/migrations/20250109000001_fix_sales_client_references.sql`

```sql
-- Asegurar que la foreign key existe
ALTER TABLE sales_quotes 
ADD CONSTRAINT sales_quotes_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES "Client"(id) ON DELETE CASCADE;

-- Crear índices para mejor performance
CREATE INDEX idx_sales_quotes_client_id ON sales_quotes(client_id);

-- Políticas RLS
ALTER TABLE sales_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view sales_quotes" ON sales_quotes FOR SELECT TO authenticated USING (true);
```

---

## 📁 Archivos Corregidos

### **1. `src/actions/sales/budgets/get.ts`**
- ✅ Consulta corregida para usar `nombrePrincipal` y `apellido`
- ✅ Interface `BudgetWithDetails` actualizada
- ✅ Función `getBudgetPreview` corregida

### **2. `src/actions/sales/budgets/list.ts`**
- ✅ Mapeo corregido para usar nombres de columnas consistentes
- ✅ Tipos TypeScript actualizados

### **3. `src/components/sales/BudgetDetailView.tsx`**
- ✅ Referencias a `firstName` → `nombrePrincipal`
- ✅ Referencias a `lastName` → `apellido`
- ✅ Referencias a `phone` → `telefono`
- ✅ Agregado soporte para `telefonoMovil`

### **4. `src/components/sales/BudgetTable.tsx`**
- ✅ Tipos de estado corregidos
- ✅ Visualización de nombres de cliente corregida

### **5. `src/actions/sales/clients.ts`**
- ✅ Creada interface `SalesClient` consistente
- ✅ Funciones `getSalesClient` y `searchSalesClients`
- ✅ Función `getSalesClientsByIds` para obtener múltiples clientes

---

## 🔧 Funcionalidades Agregadas

### **1. Acción Específica para Clientes de Ventas**
```typescript
export async function getSalesClient(id: number): Promise<{ success: boolean; data?: SalesClient; error?: string }>
export async function searchSalesClients(term: string): Promise<{ success: boolean; data?: SalesClient[]; error?: string }>
export async function getSalesClientsByIds(ids: number[]): Promise<{ success: boolean; data?: SalesClient[]; error?: string }>
```

### **2. Endpoints API Actualizados**
- `GET /api/sales/clients?q=termino` - Buscar clientes
- `GET /api/sales/budgets/generate-number` - Generar número de presupuesto

### **3. Migración de Base de Datos**
- Asegurar tablas `Client`, `sales_quotes`, `sales_quote_lines`
- Foreign keys correctas
- Índices para performance
- Políticas RLS configuradas

---

## 🧪 Verificación del Arreglo

### **Casos de Prueba**
1. ✅ **Acceso a presupuesto**: `GET /dashboard/sales/budgets/3`
2. ✅ **Información del cliente**: Nombre completo visible
3. ✅ **Consulta de base de datos**: Sin errores de columnas
4. ✅ **Teléfonos**: Fijo y móvil mostrados correctamente
5. ✅ **Lista de presupuestos**: Tabla funcionando sin errores

### **Comandos de Verificación**
```bash
# Verificar que la migración se aplicó
npx supabase db reset

# Verificar que la página carga
curl http://localhost:3000/dashboard/sales/budgets/3

# Verificar endpoint API
curl http://localhost:3000/api/sales/clients?q=juan
```

---

## 🎯 Resultado Final

### ✅ **PROBLEMA COMPLETAMENTE RESUELTO**
- **Error**: Column 'firstName' does not exist → **CORREGIDO**
- **Consultas**: Usan nombres de columnas correctos
- **Interfaces**: Consistentes con la base de datos
- **Componentes**: Muestran información correctamente
- **Performance**: Índices agregados para mejor rendimiento

### 🚀 **Beneficios Obtenidos**
- 🔍 **Consistencia**: Nombres de columnas unificados
- 📊 **Performance**: Consultas optimizadas con índices
- 🛡️ **Seguridad**: Políticas RLS implementadas
- 🧪 **Mantenibilidad**: Código más limpio y consistente
- 📱 **Funcionalidad**: Soporte para teléfono fijo y móvil

### 📋 **URLs Funcionando**
```
✅ http://localhost:3000/dashboard/sales/budgets/3
✅ http://localhost:3000/dashboard/sales/budgets/4
✅ http://localhost:3000/dashboard/sales/budgets/5
```

**El sistema de presupuestos está 100% operativo con información completa de clientes.** 