# Guía Técnica: Filtrado de Productos en Sistema de Reservas

## 🎯 Objetivo

Esta guía documenta el sistema de filtrado de productos en el módulo de reservas modulares, específicamente para resolver problemas donde aparecen productos incorrectos en secciones específicas.

---

## 🏗️ Arquitectura del Sistema

### Flujo de Datos
```
Base de Datos → getProductsModular() → ProductModular[] → Filtros → UI Components
```

### Componentes Clave
1. **`getProductsModular()`** - Obtiene productos de BD
2. **`mapCategoryToModular()`** - Mapea categorías de BD a categorías modulares
3. **Filtros en componente** - Filtran productos por tipo
4. **Componentes UI** - Renderizan productos filtrados

---

## 🔧 Sistema de Categorización

### Categorías Modulares
```typescript
type ModularCategory = 
  | 'alojamiento'    // Habitaciones, suites
  | 'comida'         // Desayuno, almuerzo, cena
  | 'spa'            // Tratamientos, masajes
  | 'entretenimiento' // Actividades, bar
  | 'servicios';     // WiFi, parking
```

### Mapeo de Categorías
```typescript
function mapCategoryToModular(categoryName?: string): string {
  if (!categoryName) return 'servicios';
  const name = categoryName.toLowerCase();
  
  if (name.includes('alojamiento') || name.includes('habitacion') || name.includes('programa')) 
    return 'alojamiento';
  if (name.includes('alimentacion') || name.includes('comida') || name.includes('bebida') || name.includes('restaurante')) 
    return 'comida';
  if (name.includes('spa') || name.includes('masaje') || name.includes('tratamiento') || name.includes('termal')) 
    return 'spa';
  if (name.includes('entretenimiento') || name.includes('actividad')) 
    return 'entretenimiento';
    
  return 'servicios';
}
```

---

## 🎯 Patrón de Filtrado Robusto

### Implementación Recomendada
```typescript
// ✅ Patrón robusto multi-criterio
const roomProducts = productsSafe.filter(p => 
  // Criterio principal: categoría
  p.category === 'alojamiento' || 
  
  // Criterios secundarios: contenido del nombre
  p.name?.toLowerCase().includes('habitacion') ||
  p.name?.toLowerCase().includes('suite') ||
  p.name?.toLowerCase().includes('cuarto') ||
  
  // Criterio terciario: descripción
  p.description?.toLowerCase().includes('habitacion')
) || []; // Protección contra undefined
```

### Beneficios del Patrón
- **Redundancia:** Múltiples criterios de captura
- **Flexibilidad:** Funciona con diferentes fuentes de datos
- **Robustez:** Resistente a errores de categorización
- **Mantenibilidad:** Fácil de extender

---

## 🚨 Problemas Comunes y Soluciones

### 1. Productos Incorrectos en Secciones
**Problema:** Aparecen productos de comida en sección de habitaciones

**Causa:**
```typescript
// ❌ Incorrecto - usa todos los productos
{productsSafe.map(room => (...))}
```

**Solución:**
```typescript
// ✅ Correcto - usa productos filtrados
{roomProducts.map(room => (...))}
```

### 2. Errores de Array Undefined
**Problema:** `TypeError: Cannot read properties of undefined (reading 'filter')`

**Causa:**
```typescript
// ❌ Incorrecto - no protege contra undefined
{pricing.breakdown.filter(item => ...)}
```

**Solución:**
```typescript
// ✅ Correcto - protege contra undefined
{(pricing.breakdown || []).filter(item => ...)}
```

### 3. Categorización Incorrecta
**Problema:** Productos mal categorizados por la función de mapeo

**Diagnóstico:**
```typescript
// Debug temporal
console.log('Productos:', products.map(p => ({ 
  name: p.name, 
  category: p.category,
  originalCategory: p.originalCategory 
})));
```

**Solución:** Ajustar criterios en `mapCategoryToModular()`

---

## 🔍 Herramientas de Debug

### 1. Debug de Productos Cargados
```typescript
console.log('🔍 DEBUG - Productos cargados:', 
  productsSafe.map(p => ({ name: p.name, category: p.category }))
);
```

### 2. Debug de Filtros
```typescript
console.log('🏨 DEBUG - Productos de habitación:', 
  roomProducts.map(p => ({ name: p.name, category: p.category }))
);
```

### 3. Debug de Mapeo de Categorías
```typescript
console.log('📊 DEBUG - Mapeo de categorías:', 
  products.map(p => ({ 
    original: p.originalCategory, 
    mapped: p.category 
  }))
);
```

---

## 🧪 Testing y Validación

### Casos de Prueba Esenciales
```typescript
describe('Product Filtering', () => {
  test('should filter rooms correctly', () => {
    const products = [
      { name: 'Habitación Estándar', category: 'alojamiento' },
      { name: 'Desayuno Buffet', category: 'comida' },
      { name: 'Suite Junior', category: 'alojamiento' }
    ];
    
    const rooms = filterRoomProducts(products);
    expect(rooms).toHaveLength(2);
    expect(rooms[0].name).toBe('Habitación Estándar');
    expect(rooms[1].name).toBe('Suite Junior');
  });
  
  test('should handle undefined arrays', () => {
    const rooms = filterRoomProducts(undefined);
    expect(rooms).toEqual([]);
  });
});
```

### Validación Manual
1. **Verificar secciones:** Cada sección debe mostrar solo productos relevantes
2. **Verificar errores:** No debe haber errores de JavaScript en consola
3. **Verificar funcionalidad:** Selección y cálculos deben funcionar correctamente

---

## 🛠️ Extensión del Sistema

### Agregar Nueva Categoría
```typescript
// 1. Agregar al tipo
type ModularCategory = 
  | 'alojamiento' 
  | 'comida' 
  | 'spa' 
  | 'entretenimiento' 
  | 'servicios'
  | 'nueva_categoria'; // ← Nueva categoría

// 2. Actualizar función de mapeo
function mapCategoryToModular(categoryName?: string): string {
  // ... casos existentes ...
  if (name.includes('nueva_palabra_clave')) 
    return 'nueva_categoria';
  // ...
}

// 3. Crear filtro específico
const newCategoryProducts = productsSafe.filter(p => 
  p.category === 'nueva_categoria' || 
  p.name?.toLowerCase().includes('palabra_clave')
) || [];
```

### Agregar Criterios de Filtro
```typescript
const roomProducts = productsSafe.filter(p => 
  p.category === 'alojamiento' || 
  p.name?.toLowerCase().includes('habitacion') ||
  p.name?.toLowerCase().includes('suite') ||
  p.name?.toLowerCase().includes('cuarto') ||
  p.description?.toLowerCase().includes('habitacion') ||
  // ← Nuevos criterios aquí
  p.sku?.startsWith('ROOM-') ||
  p.tags?.includes('alojamiento')
) || [];
```

---

## 📋 Checklist de Implementación

### Al Crear Nuevos Filtros
- [ ] Definir criterios múltiples (categoría + nombre + descripción)
- [ ] Agregar protección contra undefined (`|| []`)
- [ ] Usar operadores opcionales (`?.`)
- [ ] Agregar debug temporal para verificación
- [ ] Probar con datos reales
- [ ] Verificar que no aparezcan productos incorrectos
- [ ] Remover debug logs en producción

### Al Modificar Filtros Existentes
- [ ] Verificar que no rompa funcionalidad existente
- [ ] Probar todos los casos de uso
- [ ] Verificar performance con datasets grandes
- [ ] Actualizar tests unitarios
- [ ] Documentar cambios realizados

---

## 🚀 Mejores Prácticas

### 1. Siempre Usar Filtros Específicos
```typescript
// ✅ Correcto
{roomProducts.map(room => ...)}

// ❌ Incorrecto
{products.map(room => ...)}
```

### 2. Proteger Contra Undefined
```typescript
// ✅ Correcto
const filtered = (array || []).filter(...)

// ❌ Incorrecto
const filtered = array.filter(...)
```

### 3. Múltiples Criterios de Filtro
```typescript
// ✅ Correcto - robusto
const filtered = items.filter(item => 
  primaryCriteria || 
  secondaryCriteria ||
  tertiaryCriteria
);

// ❌ Incorrecto - frágil
const filtered = items.filter(item => 
  item.category === 'specific'
);
```

### 4. Debug Temporal Durante Desarrollo
```typescript
// Durante desarrollo
console.log('DEBUG:', filteredItems);

// En producción - remover
// console.log('DEBUG:', filteredItems);
```

---

## 🎉 Conclusión

El sistema de filtrado robusto garantiza que:
- Los productos correctos aparezcan en las secciones correctas
- El sistema sea resistente a errores de datos
- Sea fácil de mantener y extender
- Proporcione una experiencia de usuario consistente

Siguiendo estos patrones y mejores prácticas, se evitan problemas comunes y se mantiene un sistema confiable y escalable.

---

**Última Actualización:** 2025-01-29  
**Versión:** 1.0  
**Mantenedor:** Equipo de Desarrollo 