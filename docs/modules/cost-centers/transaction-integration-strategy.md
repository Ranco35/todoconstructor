# Estrategia de Integración: Centros de Costos en Transacciones

## 🎯 **Estrategia Híbrida Recomendada**

### **1. Centro de Costo por Defecto en Productos**
```prisma
model Product {
  // ... otros campos
  defaultCostCenterId Int?        // Centro de costo por defecto
  DefaultCostCenter   Cost_Center? @relation("ProductDefaultCostCenter", fields: [defaultCostCenterId], references: [id])
}
```

### **2. Centro de Costo en Transacciones (Obligatorio)**
```prisma
model Sale {
  // ... otros campos
  Cost_CenterId Int
  Cost_Center   Cost_Center @relation(fields: [Cost_CenterId], references: [id])
}

model Purchase {
  // ... otros campos
  Cost_CenterId Int
  Cost_Center   Cost_Center @relation(fields: [Cost_CenterId], references: [id])
}

model PettyCashPurchase {
  // ... otros campos
  Cost_CenterId Int
  Cost_Center   Cost_Center @relation(fields: [Cost_CenterId], references: [id])
}
```

## 🔄 **Flujo de Trabajo Propuesto**

### **Al Crear/Editar Producto:**
1. **Centro de Costo por Defecto** (opcional)
   - Se pre-selecciona en transacciones
   - Puede cambiarse en cada transacción
   - Facilita el trabajo diario

### **Al Crear Venta:**
1. **Centro de Costo Obligatorio**
   - Se pre-selecciona el del producto
   - Usuario puede cambiarlo
   - Validación requerida

### **Al Crear Compra:**
1. **Centro de Costo Obligatorio**
   - Se pre-selecciona el del producto
   - Usuario puede cambiarlo
   - Validación requerida

## 📊 **Beneficios de esta Estrategia**

### ✅ **Flexibilidad**
- Un producto puede venderse desde diferentes centros
- Permite reorganización sin afectar productos
- Adaptable a cambios organizacionales

### ✅ **Consistencia**
- Todas las transacciones tienen centro de costo
- Reportes precisos por centro
- Auditoría completa

### ✅ **Usabilidad**
- Pre-selección inteligente
- Menos clicks para el usuario
- Reducción de errores

### ✅ **Escalabilidad**
- Fácil agregar nuevos tipos de transacciones
- Mantenimiento simplificado
- Crecimiento organizacional

## 🛠️ **Implementación Técnica**

### **1. Actualizar Esquema de Productos**
```prisma
model Product {
  // ... campos existentes
  defaultCostCenterId Int?
  DefaultCostCenter   Cost_Center? @relation("ProductDefaultCostCenter", fields: [defaultCostCenterId], references: [id])
  
  // Relación many-to-many mantenida para reportes
  Cost_Center Cost_Center[] @relation("ProductCost_Centers")
}
```

### **2. Actualizar Transacciones**
```prisma
model Sale {
  // ... campos existentes
  Cost_CenterId Int
  Cost_Center   Cost_Center @relation(fields: [Cost_CenterId], references: [id])
}

model Purchase {
  // ... campos existentes
  Cost_CenterId Int
  Cost_Center   Cost_Center @relation(fields: [Cost_CenterId], references: [id])
}
```

### **3. Componente Selector Inteligente**
```typescript
interface SmartCostCenterSelectorProps {
  productId?: number;
  defaultValue?: number;
  onCostCenterChange: (costCenterId: number) => void;
  required?: boolean;
}

export function SmartCostCenterSelector({
  productId,
  defaultValue,
  onCostCenterChange,
  required = true
}: SmartCostCenterSelectorProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedCostCenter, setSelectedCostCenter] = useState<number | null>(
    defaultValue || product?.defaultCostCenterId || null
  );

  // Lógica para cargar producto y pre-seleccionar centro
  // ...
}
```

## 📈 **Casos de Uso**

### **Caso 1: Producto con Centro por Defecto**
```
Producto: "Laptop Dell"
Centro por Defecto: "IT - Desarrollo"
- Al vender: Se pre-selecciona "IT - Desarrollo"
- Usuario puede cambiar a "IT - Soporte" si es necesario
```

### **Caso 2: Producto sin Centro por Defecto**
```
Producto: "Papel de Oficina"
Centro por Defecto: null
- Al vender: Usuario debe seleccionar centro obligatoriamente
- Puede ser "Administración", "Ventas", etc.
```

### **Caso 3: Compra para Múltiples Centros**
```
Compra: "Servicios de Limpieza"
- Centro seleccionado: "Administración"
- Se registra como gasto de administración
- Reporte refleja el costo correcto
```

## 🔧 **Validaciones y Reglas**

### **Reglas de Negocio**
1. **Todas las transacciones** deben tener centro de costo
2. **Productos pueden tener** centro por defecto (opcional)
3. **Usuario puede cambiar** el centro en cada transacción
4. **Reportes se basan** en el centro de la transacción, no del producto

### **Validaciones Técnicas**
```typescript
// En server actions
export async function createSale(formData: FormData) {
  const costCenterId = parseInt(formData.get('costCenterId') as string);
  
  if (!costCenterId || isNaN(costCenterId)) {
    throw new Error('Centro de costo es requerido');
  }
  
  // Verificar que el centro existe y está activo
  const costCenter = await prisma.cost_Center.findUnique({
    where: { id: costCenterId, isActive: true }
  });
  
  if (!costCenter) {
    throw new Error('Centro de costo no válido o inactivo');
  }
  
  // ... resto de la lógica
}
```

## 📊 **Reportes y Análisis**

### **Reportes por Centro de Costo**
- **Ventas por centro**: Basado en transacciones de venta
- **Compras por centro**: Basado en transacciones de compra
- **Gastos por centro**: Basado en caja chica y compras
- **Rentabilidad por centro**: Análisis completo

### **Métricas Clave**
- Total de ventas por centro
- Total de compras por centro
- Margen por centro de costo
- Productos más vendidos por centro

## 🚀 **Plan de Implementación**

### **Fase 1: Preparación**
1. Actualizar esquema de Prisma
2. Crear migración de base de datos
3. Actualizar tipos TypeScript

### **Fase 2: Componentes**
1. Crear selector inteligente
2. Actualizar formularios de venta
3. Actualizar formularios de compra
4. Actualizar caja chica

### **Fase 3: Validaciones**
1. Implementar validaciones en server actions
2. Agregar validaciones en frontend
3. Crear mensajes de error apropiados

### **Fase 4: Reportes**
1. Actualizar consultas de reportes
2. Crear dashboards por centro
3. Implementar filtros y exportación

## ✅ **Conclusión**

La estrategia híbrida proporciona:
- **Máxima flexibilidad** para el usuario
- **Consistencia** en los datos
- **Escalabilidad** para el futuro
- **Usabilidad** mejorada

Esta implementación permite que el sistema crezca con la organización y mantenga la integridad de los datos financieros.

---

**¿Proceder con esta implementación?** 