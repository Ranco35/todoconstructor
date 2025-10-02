# Sistema de Gestión de Precios - TodoConstructor

## 📋 Resumen Ejecutivo

El **Sistema de Gestión de Precios** es un módulo completo que permite administrar precios de productos basados en costos, configurar utilidades por categorías, crear promociones temporales y realizar análisis de rentabilidad.

## 🎯 Funcionalidades Principales

### 1. **Ajuste de Precios por Costo + Utilidad**
- Configurar % de utilidad por categoría
- Configurar % de utilidad por producto específico
- Cálculo automático: `Precio Venta = Costo × (1 + %Utilidad/100)`
- Reglas de redondeo configurables

### 2. **Gestión por Categorías**
- Márgenes por defecto por categoría
- Márgenes mínimos y máximos
- Reglas de redondeo por categoría
- Configuración masiva de precios

### 3. **Productos Específicos**
- Sobrescribir márgenes de categoría
- Configuraciones individuales
- Análisis de rentabilidad por producto

### 4. **Promociones Temporales**
- Descuentos por fechas específicas
- Aumentos de precios (temporada alta)
- Precios especiales limitados
- Aplicación automática por prioridad

### 5. **Análisis de Precios**
- Comparación con mercado
- Recomendaciones automáticas
- Historial completo de cambios
- Reportes de rentabilidad

### 6. **Automatización**
- Actualización masiva de precios
- Sincronización con POS
- Aplicación de promociones
- Alertas de márgenes bajos

## 🗄️ Estructura de Base de Datos

### Tablas Principales

#### 1. `CategoryProfitConfig`
```sql
- id: BIGSERIAL PRIMARY KEY
- categoryId: BIGINT (FK a Category)
- defaultProfitMargin: DECIMAL(5,2) (30% por defecto)
- minProfitMargin: DECIMAL(5,2) (10% mínimo)
- maxProfitMargin: DECIMAL(5,2) (100% máximo)
- roundingRule: VARCHAR(20) ('none', 'tens', 'hundreds', 'thousands')
- isActive: BOOLEAN
- createdAt/updatedAt: TIMESTAMPTZ
- createdBy/updatedBy: UUID (FK a User)
```

#### 2. `ProductProfitConfig`
```sql
- id: BIGSERIAL PRIMARY KEY
- productId: BIGINT (FK a Product, UNIQUE)
- profitMargin: DECIMAL(5,2) (margen específico)
- roundingRule: VARCHAR(20)
- isActive: BOOLEAN
- createdAt/updatedAt: TIMESTAMPTZ
- createdBy/updatedBy: UUID (FK a User)
```

#### 3. `PricePromotions`
```sql
- id: BIGSERIAL PRIMARY KEY
- name: VARCHAR(255) (nombre de la promoción)
- description: TEXT
- promotionType: VARCHAR(50) ('discount_percentage', 'discount_fixed', 'markup_percentage', 'markup_fixed', 'special_price')
- value: DECIMAL(10,2) (valor del descuento/aumento)
- appliesTo: VARCHAR(50) ('all_products', 'categories', 'specific_products', 'suppliers')
- targetIds: INTEGER[] (IDs de categorías/productos/proveedores)
- startDate/endDate: TIMESTAMPTZ
- isActive: BOOLEAN
- priority: INTEGER (prioridad para múltiples promociones)
- maxUsage: INTEGER (límite de usos opcional)
- currentUsage: INTEGER (usos actuales)
- createdAt/updatedAt: TIMESTAMPTZ
- createdBy/updatedBy: UUID (FK a User)
```

#### 4. `PriceHistory`
```sql
- id: BIGSERIAL PRIMARY KEY
- productId: BIGINT (FK a Product)
- oldCostPrice/newCostPrice: DECIMAL(10,2)
- oldSalePrice/newSalePrice: DECIMAL(10,2)
- oldFinalPrice/newFinalPrice: DECIMAL(12,2)
- changeReason: VARCHAR(100) ('cost_update', 'margin_adjustment', 'promotion', 'manual')
- promotionId: BIGINT (FK a PricePromotions)
- profitMarginBefore/profitMarginAfter: DECIMAL(5,2)
- changedAt: TIMESTAMPTZ
- changedBy: UUID (FK a User)
```

#### 5. `PriceAnalysis`
```sql
- id: BIGSERIAL PRIMARY KEY
- productId: BIGINT (FK a Product)
- analysisDate: DATE
- costPrice: DECIMAL(10,2)
- salePrice: DECIMAL(10,2)
- finalPrice: DECIMAL(12,2)
- profitMargin: DECIMAL(5,2)
- profitAmount: DECIMAL(10,2)
- categoryAverageMargin: DECIMAL(5,2)
- marketPosition: VARCHAR(20) ('below_market', 'market_average', 'above_market')
- competitorPrice: DECIMAL(10,2)
- recommendation: TEXT
- createdAt: TIMESTAMPTZ
```

#### 6. `PriceRoundingRules`
```sql
- id: BIGSERIAL PRIMARY KEY
- name: VARCHAR(100)
- description: TEXT
- ruleType: VARCHAR(20) ('none', 'tens', 'hundreds', 'thousands', 'custom')
- customValue: INTEGER (para reglas personalizadas)
- isActive: BOOLEAN
- createdAt/updatedAt: TIMESTAMPTZ
```

## ⚙️ Funciones SQL Automáticas

### 1. `calculate_sale_price_from_cost()`
```sql
-- Calcula precio de venta basado en costo y margen
SELECT calculate_sale_price_from_cost(10000, 30, 'hundreds');
-- Resultado: 13000 (redondeado a centenas)
```

### 2. `get_category_profit_margin()`
```sql
-- Obtiene margen de utilidad por categoría
SELECT get_category_profit_margin(1);
-- Resultado: 30.00 (o margen configurado)
```

### 3. `get_product_profit_margin()`
```sql
-- Obtiene margen específico del producto o de su categoría
SELECT get_product_profit_margin(123);
-- Resultado: 35.00 (margen específico o de categoría)
```

### 4. `apply_active_promotions()`
```sql
-- Aplica promociones activas a un precio
SELECT apply_active_promotions(123, 13000, NOW());
-- Resultado: 11050 (precio con promoción aplicada)
```

## 🔧 Funcionalidades de la Interfaz

### Dashboard Principal (`/dashboard/pricing`)
- **Estadísticas en tiempo real**:
  - Categorías configuradas
  - Promociones activas
  - Cambios de precios hoy
  - Margen promedio
  - Productos con margen bajo
  - Promociones por vencer

- **Cambios recientes**: Lista de últimos cambios de precios
- **Productos con margen bajo**: Alertas de productos con rentabilidad baja
- **Acciones rápidas**: Botones para configurar utilidades, crear promociones, etc.

### Configuración de Utilidades (`/dashboard/pricing/categories`)
- **Formulario de configuración**:
  - Selección de categoría
  - Margen por defecto (10-100%)
  - Margen mínimo y máximo
  - Regla de redondeo
  - Estado activo/inactivo

- **Tabla de configuraciones**:
  - Lista de todas las configuraciones
  - Edición y eliminación
  - Estado visual (activo/inactivo)
  - Información de márgenes y redondeo

### Gestión de Promociones (`/dashboard/pricing/promotions`)
- **Crear promociones**:
  - Nombre y descripción
  - Tipo: descuento %, descuento fijo, aumento %, aumento fijo, precio especial
  - Valor de la promoción
  - Aplicación: todos los productos, categorías, productos específicos, proveedores
  - Fechas de inicio y fin
  - Prioridad (para múltiples promociones)
  - Límite de uso opcional

- **Filtros**:
  - Todas las promociones
  - Solo activas
  - Solo expiradas

- **Estados visuales**:
  - Activa (verde)
  - Por vencer (naranja)
  - Programada (azul)
  - Expirada (rojo)
  - Inactiva (gris)

## 📊 Flujo de Trabajo

### 1. Configuración Inicial
```
1. Configurar márgenes por categoría (30% por defecto)
2. Ajustar productos específicos si es necesario
3. Crear promociones temporales
4. Configurar reglas de redondeo
```

### 2. Cálculo de Precios
```
1. Usuario actualiza precio de costo
2. Sistema obtiene margen de utilidad:
   - Busca margen específico del producto
   - Si no existe, usa margen de la categoría
   - Si no existe, usa margen por defecto (30%)
3. Calcula precio de venta: Costo × (1 + %Utilidad/100)
4. Aplica regla de redondeo
5. Calcula precio final con IVA
6. Aplica promociones activas (si las hay)
7. Actualiza producto en base de datos
8. Registra cambio en historial
```

### 3. Aplicación de Promociones
```
1. Usuario accede a producto
2. Sistema busca promociones activas:
   - Filtra por fecha (startDate <= now <= endDate)
   - Filtra por aplicación (categoría, producto, etc.)
   - Ordena por prioridad (mayor primero)
3. Aplica primera promoción encontrada
4. Calcula precio final con promoción
5. Muestra precio promocional al usuario
```

## 🎨 Componentes de Interfaz

### 1. `PriceManagementDashboard`
- Dashboard principal con estadísticas
- Cards de métricas clave
- Listas de cambios recientes y alertas
- Botones de acción rápida

### 2. `CategoryProfitConfigForm`
- Formulario para configurar utilidades por categoría
- Tabla de configuraciones existentes
- Validaciones de márgenes
- Estados visuales

### 3. `PricePromotionsManager`
- Gestión completa de promociones
- Formulario de creación/edición
- Filtros por estado
- Estados visuales con colores

### 4. Utilidades (`price-utils.ts`)
- Funciones de cálculo de precios
- Formateo de moneda y porcentajes
- Validaciones de precios
- Análisis de rentabilidad

## 🔗 Integración con Sistema Existente

### 1. **Productos**
- Extiende la tabla `Product` existente
- Mantiene compatibilidad con precios actuales
- Integra con sistema de categorías existente

### 2. **POS**
- Sincroniza precios automáticamente
- Aplica promociones en tiempo real
- Mantiene consistencia de precios

### 3. **Reservas**
- Integra con sistema de temporadas existente
- Compatible con descuentos de reservas
- Mantiene precios base y promocionales

### 4. **Usuarios**
- Registra cambios con usuario responsable
- Mantiene auditoría completa
- Compatible con sistema de roles existente

## 📈 Beneficios del Sistema

### Para el Negocio
- ✅ **Automatización completa** del cálculo de precios
- ✅ **Flexibilidad** para ajustar por categoría o producto
- ✅ **Promociones temporales** sin afectar precios base
- ✅ **Análisis de rentabilidad** en tiempo real
- ✅ **Historial completo** para auditoría
- ✅ **Reportes** para toma de decisiones

### Para los Usuarios
- ✅ **Interfaz intuitiva** y fácil de usar
- ✅ **Configuración masiva** de precios
- ✅ **Alertas automáticas** de márgenes bajos
- ✅ **Validaciones** para evitar errores
- ✅ **Estados visuales** claros
- ✅ **Acciones rápidas** desde el dashboard

### Para el Sistema
- ✅ **Integración perfecta** con módulos existentes
- ✅ **Base de datos optimizada** con índices
- ✅ **Funciones SQL** para cálculos eficientes
- ✅ **Triggers automáticos** para historial
- ✅ **RLS habilitado** para seguridad
- ✅ **Escalabilidad** para crecer con el negocio

## 🚀 Próximos Pasos

1. **Implementar integración con POS** para sincronización automática
2. **Crear reportes avanzados** de rentabilidad por categoría
3. **Agregar comparación con competencia** usando APIs externas
4. **Implementar notificaciones** para promociones por vencer
5. **Crear exportación** de configuraciones a Excel
6. **Agregar análisis predictivo** de tendencias de precios

## 📝 Notas Técnicas

- **Base de datos**: PostgreSQL con Supabase
- **Frontend**: Next.js 14 con TypeScript
- **Estilos**: Tailwind CSS
- **Iconos**: Heroicons
- **Validaciones**: Cliente y servidor
- **Seguridad**: RLS habilitado en todas las tablas
- **Performance**: Índices optimizados para consultas frecuentes

---

**Fecha de creación**: 2025-01-22  
**Versión**: 1.0.0  
**Estado**: Implementado y funcional



