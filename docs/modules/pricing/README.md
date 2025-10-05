# Módulo de Gestión de Precios

## 📋 Descripción General
Sistema completo de gestión de precios para productos por categoría, con configuración de márgenes, reglas de redondeo, actualización masiva y auditoría completa.

## 🎯 Funcionalidades Principales
- ✅ Configuración de márgenes por categoría
- ✅ Reglas de redondeo (decenas, centenas, miles)
- ✅ Actualización masiva de precios
- ✅ Cálculo automático de precios con IVA
- ✅ Historial de cambios y auditoría
- ✅ Interfaz web completa
- ✅ API endpoints
- ✅ Triggers automáticos

## 📁 Estructura de Documentación

### Documentos Principales
- [`sistema-gestion-precios-completo.md`](./sistema-gestion-precios-completo.md) - Documentación completa del sistema
- [`database-structure.md`](./database-structure.md) - Estructura de base de datos
- [`server-actions.md`](./server-actions.md) - Server actions y funciones del backend
- [`frontend-components.md`](./frontend-components.md) - Componentes React del frontend
- [`api-endpoints.md`](./api-endpoints.md) - Endpoints API y documentación

### Archivos del Sistema
```
src/
├── actions/pricing/
│   └── price-management-actions.ts    # Server actions
├── utils/
│   └── price-utils.ts                 # Funciones de cálculo
├── components/
│   ├── pricing/
│   │   └── CategoryProfitConfigForm.tsx # Configuración
│   └── website/
│       ├── ProductCard.tsx            # Tarjeta de producto
│       └── WebsiteFooter.tsx          # Footer corregido
└── app/api/pricing/
    └── update-category-prices/
        └── route.ts                   # API endpoint

supabase/migrations/
├── 20250122000000_create_price_management_system.sql
├── 20250123000000_fix_trigger_final_price_vat.sql
├── 20250123000001_disable_problematic_trigger.sql
└── 20250123000002_fix_rounding_trigger.sql
```

## 🚀 Inicio Rápido

### 1. Configuración Inicial
1. Ir a `/dashboard/pricing/categories`
2. Seleccionar categoría (ej: "Tableros construcción")
3. Configurar margen (ej: 25%)
4. Seleccionar regla de redondeo (ej: "Decenas")
5. Guardar configuración

### 2. Actualización de Precios
1. En la tabla de configuraciones, hacer clic en el botón 💰
2. Confirmar la actualización
3. El sistema actualiza todos los productos de la categoría
4. Los precios se calculan con la nueva configuración

### 3. Visualización
1. Ir a `/website`
2. Los productos muestran precios redondeados
3. El precio mostrado es `finalPrice` (con IVA y redondeo)

## 🔧 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- Next.js 15+
- Supabase
- Base de datos PostgreSQL

### Pasos de Instalación
1. **Clonar el repositorio**
2. **Instalar dependencias**: `npm install`
3. **Configurar variables de entorno**
4. **Ejecutar migraciones de base de datos**
5. **Iniciar servidor de desarrollo**: `npm run dev`

### Variables de Entorno
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📊 Reglas de Redondeo

### Tipos Disponibles
1. **`none`** - Sin redondeo (mantiene decimales)
2. **`tens`** - Redondeo a decenas (ej: 1,234 → 1,230)
3. **`hundreds`** - Redondeo a centenas (ej: 1,234 → 1,200)
4. **`thousands`** - Redondeo a miles (ej: 1,234 → 1,000)

### Ejemplo de Cálculo
```
Producto: OSB 11mm Casa ULTU
Costo: $12,000
Margen: 25%
IVA: 19%
Regla de Redondeo: Decenas

Cálculo:
1. Precio con margen: $12,000 × 1.25 = $15,000
2. Precio con IVA: $15,000 × 1.19 = $17,850
3. Redondeo a decenas: ROUND(17,850 / 10) × 10 = $17,850
4. Precio final: $17,850
```

## 🗄️ Base de Datos

### Tablas Principales
- **`CategoryProfitConfig`** - Configuración de márgenes por categoría
- **`ProductProfitConfig`** - Configuración específica por producto
- **`PriceHistory`** - Historial de cambios para auditoría
- **`PricePromotions`** - Promociones temporales
- **`PriceAnalysis`** - Análisis y recomendaciones

### Campos en Product
- **`costprice`** - Precio de costo
- **`saleprice`** - Precio de venta (sin IVA)
- **`finalPrice`** - Precio final con IVA y redondeo
- **`vat`** - Porcentaje de IVA
- **`categoryid`** - Referencia a categoría

### Triggers
- **`trg_update_final_price_with_vat`** - Actualiza `finalPrice` automáticamente

## 🎨 Frontend

### Componentes Principales
- **`CategoryProfitConfigForm`** - Configuración de márgenes
- **`ProductCard`** - Visualización de productos
- **`WebsiteFooter`** - Footer corregido

### Páginas
- **`/dashboard/pricing/categories`** - Configuración de precios
- **`/website`** - Tienda web con productos

## 🌐 API

### Endpoints
- **`POST /api/pricing/update-category-prices`** - Actualización masiva

### Server Actions
- **`updateCategoryPricesFromCost`** - Actualizar precios por categoría
- **`updateProductPriceFromCost`** - Actualizar precio individual
- **`getCategoryProfitConfig`** - Obtener configuración
- **`createCategoryProfitConfig`** - Crear configuración
- **`updateCategoryProfitConfig`** - Actualizar configuración
- **`deleteCategoryProfitConfig`** - Eliminar configuración

## 🐛 Problemas Resueltos

### 1. Error de Columna
- **Problema**: `column Product.categoryId does not exist`
- **Solución**: Usar `categoryid` (snake_case) en lugar de `categoryId`

### 2. Redondeos No Aplicados
- **Problema**: Los precios no respetaban las reglas de redondeo
- **Solución**: Corregir trigger para usar `finalPrice` y aplicar reglas

### 3. Error de Hidratación
- **Problema**: `hydration mismatch` en WebsiteFooter
- **Solución**: Agregar `'use client'` y estilos específicos

### 4. Campo Incorrecto
- **Problema**: Trigger usaba `final_price_with_vat` inexistente
- **Solución**: Usar `finalPrice` (camelCase)

## ✅ Estado Actual
- ✅ Configuración por categoría funcionando
- ✅ Reglas de redondeo aplicadas correctamente
- ✅ Actualización masiva operativa
- ✅ Cálculo automático con IVA
- ✅ Trigger funcionando correctamente
- ✅ Frontend actualizado y funcionando
- ✅ API endpoint operativo
- ✅ Historial de cambios implementado
- ✅ Auditoría completa

## 📈 Beneficios

### Para el Negocio
- **Consistencia**: Precios uniformes por categoría
- **Automatización**: Menos errores manuales
- **Flexibilidad**: Diferentes márgenes por categoría
- **Auditoría**: Historial completo de cambios
- **Eficiencia**: Actualización masiva de precios

### Para los Usuarios
- **Transparencia**: Precios claros con IVA incluido
- **Simplicidad**: Interfaz intuitiva
- **Rapidez**: Cálculos automáticos
- **Confiabilidad**: Precios consistentes

### Para el Desarrollo
- **Mantenibilidad**: Código bien estructurado
- **Escalabilidad**: Fácil agregar nuevas funcionalidades
- **Robustez**: Manejo de errores completo
- **Documentación**: Sistema completamente documentado

## 🔧 Mantenimiento

### Para Agregar Nuevas Reglas de Redondeo
1. Actualizar el enum en la base de datos
2. Modificar el switch en `calculateSalePriceFromCost()`
3. Actualizar el CASE en el trigger SQL
4. Agregar opción en el frontend

### Para Cambiar la Lógica de Cálculo
1. Modificar funciones en `price-utils.ts`
2. Actualizar server actions
3. Probar con diferentes escenarios
4. Actualizar documentación

### Para Monitorear el Sistema
1. Revisar `PriceHistory` regularmente
2. Verificar que los triggers funcionen
3. Monitorear errores en la consola
4. Validar precios en el frontend

## 📞 Soporte

### Documentación Adicional
- Revisar archivos en `docs/modules/pricing/`
- Consultar comentarios en el código
- Verificar logs de la aplicación

### Troubleshooting
1. Verificar configuración de base de datos
2. Comprobar que los triggers estén activos
3. Revisar logs de errores
4. Validar datos de entrada

---

**Sistema de gestión de precios completamente funcional y documentado.**
