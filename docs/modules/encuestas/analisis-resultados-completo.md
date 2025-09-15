# Módulo de Análisis de Resultados de Encuestas

## 📊 Resumen Ejecutivo

El módulo de análisis de resultados de encuestas proporciona un dashboard completo para visualizar, analizar y exportar los datos de satisfacción de clientes. Incluye gráficos interactivos, filtros avanzados y exportación de datos para toma de decisiones basada en evidencia.

## 🎯 Características Principales

### 1. Dashboard Interactivo
- **Estadísticas Generales**: Total de respuestas, satisfacción promedio, tasas de recomendación
- **Vistas Múltiples**: Resumen general, análisis por fecha, análisis por encuesta individual
- **Gráficos Dinámicos**: Barras, líneas, pie charts y radar charts
- **Filtros Avanzados**: Por satisfacción, fecha, tipo de respuesta

### 2. Análisis Detallado
- **Satisfacción por Categoría**: Restaurante, piscinas, atención al cliente, limpieza
- **Tendencias Temporales**: Evolución de satisfacción a lo largo del tiempo
- **Análisis Individual**: Detalle completo de cada respuesta
- **Comentarios Categorizados**: Lo que más gustó vs. sugerencias de mejora

### 3. Exportación de Datos
- **Formato JSON**: Datos estructurados para análisis externo
- **Resumen Ejecutivo**: Métricas clave y tendencias
- **Datos Individuales**: Respuestas detalladas de cada cliente

## 🏗️ Arquitectura Técnica

### Backend (Server Actions)
```typescript
// src/actions/surveys/analytics.ts
- getSurveyAnalytics(surveyId): Obtiene análisis completo
- getSurveyList(): Lista todas las encuestas disponibles
- exportSurveyResults(surveyId): Exporta datos en formato JSON
```

### Frontend (React Components)
```typescript
// src/app/dashboard/marketing/surveys/analytics/page.tsx
- DashboardResultados: Componente principal
- VistaResumenGeneral: Gráficos y estadísticas generales
- VistaPorFecha: Análisis temporal
- VistaPorEncuesta: Análisis individual
- DetalleEncuesta: Vista detallada de respuesta específica
```

### Librerías de Gráficos
- **Recharts**: Gráficos interactivos (barras, líneas, pie, radar)
- **ResponsiveContainer**: Adaptación automática a diferentes pantallas
- **Tooltip**: Información contextual al hacer hover

## 📈 Métricas Calculadas

### Satisfacción General
```typescript
// Cálculo basado en 4 categorías clave:
const campos = ['restaurante_general', 'piscinas_general', 'atencion_bienvenida', 'limpieza_habitacion_llegada'];
const valores = { 'Excelente': 5, 'Muy Bueno': 4, 'Bueno': 3, 'Regular': 2, 'Malo': 1 };
const satisfaccion = (totalPuntos / camposValidos) * 20; // Escala 0-100%
```

### Tasas de Conversión
- **Recomendación**: % que recomendaría definitivamente o probablemente
- **Retorno**: % que visitaría nuevamente
- **Problemas**: % que reportó problemas durante su estadía

### Análisis Temporal
- **Tendencia de Satisfacción**: Evolución por fecha
- **Volumen de Respuestas**: Cantidad de encuestas por día
- **Problemas Reportados**: Incidencias por período

## 🎨 Interfaz de Usuario

### Navegación Principal
```
📊 Dashboard de Resultados
├── 📈 Resumen General
├── 📅 Por Fecha  
├── 👤 Por Encuesta
└── 📤 Exportar Datos
```

### Tarjetas de Estadísticas
- **Total Respuestas**: Número total de encuestas completadas
- **Satisfacción Promedio**: Porcentaje de satisfacción general
- **Recomendarían**: Porcentaje de clientes que recomendarían
- **Visitarían de Nuevo**: Porcentaje de clientes que regresarían
- **Tuvieron Problemas**: Porcentaje de clientes con incidencias

### Gráficos Disponibles

#### 1. Gráfico de Barras - Satisfacción por Categoría
```typescript
<BarChart data={procesarDatosCalidad('restaurante')}>
  <Bar dataKey="cantidad" fill={COLORES.primary} />
</BarChart>
```

#### 2. Gráfico de Líneas - Tendencia Temporal
```typescript
<LineChart data={analytics.responsesByDate}>
  <Line dataKey="averageSatisfaction" stroke={COLORES.primary} />
</LineChart>
```

#### 3. Gráfico Circular - Recomendaciones
```typescript
<PieChart>
  <Pie dataKey="cantidad" label={({ opcion, cantidad }) => cantidad} />
</PieChart>
```

#### 4. Gráfico Radar - Atención al Cliente
```typescript
<RadarChart data={generarDatosRadarAtencion(datos)}>
  <Radar dataKey="puntuacion" fill={COLORES.primary} />
</RadarChart>
```

## 🔧 Funcionalidades Avanzadas

### Filtros y Búsqueda
- **Por Satisfacción**: Alta (80%+), Media (60-79%), Baja (<60%)
- **Por Fecha**: Rango de fechas personalizable
- **Por Encuesta**: Selección de encuesta específica
- **Ordenamiento**: Por fecha, satisfacción, nombre

### Vista Individual
- **Información del Cliente**: Nombre, email, fecha de respuesta
- **Evaluaciones Detalladas**: Todas las respuestas categorizadas
- **Servicios Utilizados**: Lista de servicios consumidos
- **Comentarios**: Lo que más gustó y sugerencias de mejora
- **Métricas**: Puntuación de satisfacción individual

### Exportación de Datos
```json
{
  "surveyId": 3,
  "generatedAt": "2025-01-09T16:30:00Z",
  "summary": {
    "totalResponses": 6,
    "averageSatisfaction": 78,
    "recommendationRate": 83,
    "returnRate": 67,
    "problemRate": 33
  },
  "responses": [...],
  "questionAnalysis": [...]
}
```

## 🚀 Integración con el Sistema

### Navegación desde Dashboard
```typescript
// Desde página principal de encuestas
<Link href="/dashboard/marketing/surveys/analytics">
  📊 Ver Análisis
</Link>

// Desde encuesta específica
<Link href={`/dashboard/marketing/surveys/analytics?survey=${surveyId}`}>
  📊 Ver Análisis
</Link>
```

### Parámetros de URL
- `?survey=3`: Carga análisis de encuesta específica
- Navegación directa desde configuración de encuesta

### Permisos y Acceso
- **Solo Administradores**: Acceso completo al módulo
- **Integración con RLS**: Datos protegidos por políticas de Supabase
- **Logs de Acceso**: Registro de consultas y exportaciones

## 📊 Casos de Uso

### 1. Análisis Semanal de Satisfacción
```
1. Acceder a "Por Fecha"
2. Seleccionar rango de última semana
3. Revisar tendencia de satisfacción
4. Identificar días con menor satisfacción
5. Analizar comentarios de mejora
```

### 2. Seguimiento de Problemas
```
1. Filtrar por "Tuvieron Problemas"
2. Revisar respuestas individuales
3. Categorizar tipos de problemas
4. Generar reporte para gestión
```

### 3. Análisis de Servicios
```
1. Vista "Por Encuesta"
2. Revisar servicios más utilizados
3. Correlacionar con satisfacción
4. Identificar oportunidades de mejora
```

### 4. Exportación para Presentación
```
1. Generar análisis completo
2. Exportar datos en JSON
3. Crear presentación ejecutiva
4. Compartir con equipo directivo
```

## 🔍 Troubleshooting

### Problemas Comunes

#### 1. No se cargan los datos
```typescript
// Verificar conexión a base de datos
const { data, error } = await supabase
  .from('survey_responses')
  .select('*')
  .eq('survey_id', surveyId);
```

#### 2. Gráficos no se renderizan
```typescript
// Verificar que hay datos
if (analytics && analytics.totalResponses > 0) {
  // Renderizar gráficos
}
```

#### 3. Error de exportación
```typescript
// Verificar permisos y datos
if (result.success) {
  // Crear descarga
} else {
  console.error('Error:', result.error);
}
```

### Logs de Debug
```typescript
console.log('📊 Analytics cargados:', analytics);
console.log('📈 Total respuestas:', analytics.totalResponses);
console.log('⭐ Satisfacción promedio:', analytics.averageSatisfaction);
```

## 🎯 Próximas Mejoras

### Funcionalidades Planificadas
1. **Comparación de Períodos**: Análisis año sobre año
2. **Alertas Automáticas**: Notificaciones por baja satisfacción
3. **Dashboard en Tiempo Real**: Actualización automática
4. **Análisis Predictivo**: Tendencias futuras
5. **Integración con CRM**: Sincronización con datos de clientes

### Mejoras Técnicas
1. **Caché de Datos**: Optimización de consultas
2. **Paginación**: Manejo de grandes volúmenes
3. **Filtros Avanzados**: Búsqueda por texto
4. **Exportación PDF**: Reportes formateados
5. **API REST**: Endpoints para integración externa

## 📚 Referencias

### Documentación Relacionada
- [Sistema de Encuestas Completo](./README.md)
- [Guía de Uso Rápido](./guia-uso-rapido.md)
- [Arquitectura Técnica](./arquitectura-tecnica.md)
- [Troubleshooting](./troubleshooting.md)

### Archivos Clave
- `src/actions/surveys/analytics.ts` - Lógica de backend
- `src/app/dashboard/marketing/surveys/analytics/page.tsx` - Interfaz principal
- `src/types/surveys.ts` - Definiciones de tipos
- `docs/modules/encuestas/` - Documentación completa

---

**Estado**: ✅ Completamente funcional  
**Última actualización**: 9 de enero de 2025  
**Versión**: 1.0.0
