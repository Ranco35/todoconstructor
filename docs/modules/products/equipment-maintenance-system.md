# Sistema de Gestión de Equipos y Mantenimientos

## 📋 Descripción General

Se ha implementado un sistema completo de gestión de equipos y mantenimientos para productos de tipo **INVENTARIO**. Cuando un producto de inventario es marcado como "equipo o máquina", se despliegan campos especializados para gestión de mantenimiento, seguimiento y control de activos.

## 🎯 Funcionalidad Principal

### **Activación Dinámica**
- Solo aparece para productos de tipo **INVENTARIO**
- Se activa mediante checkbox: *"Este producto es un equipo o máquina que requiere mantenimiento"*
- **Al marcar el checkbox**, se despliegan automáticamente todos los campos de gestión

### **Despliegue Inteligente**
```typescript
// Lógica de mostrar campos
const showEquipmentSection = isInventario;                    // Siempre para INVENTARIO
const showEquipmentFields = isInventario && formData.isEquipment;  // Solo si está marcado
```

## 🔧 Campos Implementados

### **📋 Información del Equipo**
| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| **Modelo** | `string` | Modelo del equipo | "XYZ-2024", "Modelo ABC" |
| **Número de Serie** | `string` | Serie única del equipo | "SN123456789" |
| **Fecha de Compra** | `date` | Fecha de adquisición | "2024-01-15" |
| **Vencimiento de Garantía** | `date` | Fecha fin de garantía | "2026-01-15" |
| **Vida Útil** | `number` | Años de vida útil | 5, 10, 15 |
| **Estado Operacional** | `select` | Estado actual del equipo | Ver estados disponibles |

### **🛠️ Gestión de Mantenimientos**
| Campo | Tipo | Descripción | Funcionalidad |
|-------|------|-------------|---------------|
| **Intervalo de Mantenimiento** | `number` | Días entre mantenimientos | 30, 90, 180 días |
| **Costo de Mantenimiento** | `number` | Costo estimado por servicio | $15,000 |
| **Último Mantenimiento** | `date` | Fecha del último servicio | Auto-calcula próximo |
| **Próximo Mantenimiento** | `date` | Fecha programada | **Calculado automáticamente** |
| **Proveedor de Mantenimiento** | `string` | Empresa/técnico responsable | "TechService Ltda." |

### **📍 Ubicación y Responsabilidad**
| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| **Ubicación Actual** | `string` | Donde se encuentra | "Sala de máquinas", "Oficina principal" |
| **Persona Responsable** | `string` | Encargado del equipo | "Juan Pérez", "Depto. Mantenimiento" |

## 🎨 Estados Operacionales

El sistema incluye 5 estados visuales con emojis:

```typescript
enum OperationalStatus {
  OPERATIVO = "🟢 Operativo",
  MANTENIMIENTO = "🟡 En Mantenimiento", 
  REPARACION = "🔴 En Reparación",
  FUERA_SERVICIO = "⚫ Fuera de Servicio",
  BAJA = "❌ Dado de Baja"
}
```

## 🔮 Funcionalidades Automáticas

### **1. Cálculo Automático de Próximo Mantenimiento**
```typescript
// Cuando se ingresa "Último Mantenimiento" + "Intervalo"
if (lastMaintenance && maintenanceInterval) {
  const nextDate = new Date(lastMaintenance);
  nextDate.setDate(nextDate.getDate() + maintenanceInterval);
  nextMaintenance = nextDate.toISOString().split('T')[0];
}
```

### **2. Validaciones en Tiempo Real**
- Fechas no pueden ser futuras para "último mantenimiento"
- Intervalo debe ser entre 1-365 días
- Vida útil debe ser entre 1-50 años

### **3. Indicadores Visuales**
- ✅ Verde: Próximo mantenimiento programado
- 🔄 Azul: Campo calculado automáticamente
- 📅 Ayudas contextuales

## 🚀 Flujo de Trabajo

### **Paso a Paso**
1. **Seleccionar tipo de producto**: `INVENTARIO`
2. **Completar campos básicos**: Nombre, descripción, proveedor, etc.
3. **✅ Marcar checkbox**: "Este producto es un equipo o máquina..."
4. **🎉 Se despliegan campos**: Toda la sección de equipos aparece
5. **Completar información del equipo**: Modelo, serie, fechas
6. **Configurar mantenimiento**: Intervalo, último servicio
7. **Sistema calcula automáticamente**: Próximo mantenimiento
8. **Guardar**: Toda la información se almacena

### **Experiencia Visual**
```
┌─ TIPO: INVENTARIO ─┐
│ [✓] Es equipo/máquina │ ← Al marcar este checkbox
└─────────────────────┘
           ↓
    🎉 SE DESPLIEGA:
┌─────────────────────────────────────┐
│ 🔧 Gestión de Equipos y Máquinas    │
│                                     │
│ 📋 Información del Equipo           │
│ • Modelo, Serie, Fechas...          │
│                                     │
│ 🛠️ Gestión de Mantenimientos        │  
│ • Intervalos, Costos, Fechas...     │
│                                     │
│ 📍 Ubicación y Responsabilidad      │
│ • Ubicación, Responsable...         │
└─────────────────────────────────────┘
```

## 💾 Integración con Base de Datos

### **Campos Agregados a ProductFormData**
```typescript
interface ProductFormData {
  // ... campos existentes
  
  // Campos de equipos/máquinas (INVENTARIO)
  isEquipment?: boolean;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiration?: string;
  usefulLife?: number;
  maintenanceInterval?: number;
  lastMaintenance?: string;
  nextMaintenance?: string;
  maintenanceCost?: number;
  maintenanceProvider?: string;
  currentLocation?: string;
  responsiblePerson?: string;
  operationalStatus?: string;
}
```

### **Envío al Servidor**
```typescript
// Solo se envían si isEquipment = true
if (isInventario && formData.isEquipment) {
  formDataForSubmit.append('isEquipment', 'true');
  formDataForSubmit.append('model', formData.model);
  formDataForSubmit.append('serialNumber', formData.serialNumber);
  // ... todos los campos de equipos
}
```

## 🎯 Casos de Uso

### **Ejemplo 1: Aire Acondicionado**
```
✅ Es equipo/máquina: SÍ
📋 Modelo: "Samsung AR12000"
🔧 Intervalo mantenimiento: 90 días
💰 Costo mantenimiento: $25,000
📍 Ubicación: "Recepción principal"
👤 Responsable: "Juan Mantención"
```

### **Ejemplo 2: Computador de Oficina**
```
✅ Es equipo/máquina: SÍ
📋 Modelo: "Dell OptiPlex 7090"
🔧 Intervalo mantenimiento: 180 días
💰 Costo mantenimiento: $15,000
📍 Ubicación: "Oficina contabilidad"
👤 Responsable: "María López"
```

### **Ejemplo 3: Producto Normal de Inventario**
```
❌ Es equipo/máquina: NO
(Solo campos básicos de inventario)
```

## 🔧 Consideraciones Técnicas

### **Performance**
- Campos se renderizan condicionalmente
- Solo se procesan si `isEquipment = true`
- Cálculos se ejecutan en cliente

### **Validaciones**
- Campos opcionales (no rompen si están vacíos)
- Validación de tipos de fecha
- Rangos numéricos controlados

### **Mantenibilidad**
- Código modular y bien documentado
- Fácil agregar nuevos campos
- Separación clara de responsabilidades

## 📊 Beneficios del Sistema

### **Para el Negocio**
- ✅ **Control total de activos**: Seguimiento completo de equipos
- ✅ **Planificación de mantenimientos**: Prevención de fallas
- ✅ **Control de costos**: Presupuestos de mantenimiento
- ✅ **Trazabilidad**: Historial completo de cada equipo

### **Para el Usuario**
- ✅ **Interfaz intuitiva**: Checkbox simple para activar funciones
- ✅ **Cálculos automáticos**: No necesita calcular fechas manualmente
- ✅ **Validaciones útiles**: Previene errores de entrada
- ✅ **Estados visuales**: Fácil identificar estado del equipo

## 🚀 Próximas Mejoras

### **Funcionalidades Planeadas**
- [ ] **Alertas automáticas**: Notificaciones de mantenimiento vencido
- [ ] **Historial de mantenimientos**: Registro de servicios realizados
- [ ] **Generación de reportes**: Exportar información de equipos
- [ ] **Dashboard de equipos**: Vista consolidada de todos los activos
- [ ] **Integración con calendario**: Programación de mantenimientos
- [ ] **Códigos QR**: Para identificación rápida de equipos

---

## ✅ Estado Actual

**🎉 COMPLETAMENTE IMPLEMENTADO Y FUNCIONAL**

### **Archivos Modificados**
- ✅ `src/types/product.ts` - Tipos actualizados
- ✅ `src/components/products/ProductoForm.tsx` - Formulario completo

### **Funcionalidades Activas**
- ✅ Desplegado dinámico de campos
- ✅ Cálculos automáticos de fechas
- ✅ Estados operacionales
- ✅ Validaciones en tiempo real
- ✅ Integración con envío de datos

### **Cómo Probar**
1. Navegar a: `/dashboard/configuration/products/create`
2. Seleccionar tipo: **INVENTARIO**
3. Marcar checkbox: **"Es un equipo o máquina..."**
4. **¡Los campos aparecen automáticamente!**

---

**Fecha de Implementación**: Enero 2025  
**Estado**: ✅ **LISTO PARA PRODUCCIÓN**  
**Desarrollado por**: Sistema de Gestión de Productos 