# 📊 Encuesta de Satisfacción - Hotel Spa Termas Llifén

## 📋 Resumen

Encuesta completa de satisfacción del cliente diseñada específicamente para evaluar todos los servicios del Hotel Spa Termas Llifén. Incluye 22 preguntas organizadas en 6 pasos que cubren desde información personal hasta comentarios detallados.

---

## 🎯 Objetivos

- **Evaluar satisfacción general** del cliente con todos los servicios
- **Identificar áreas de mejora** en restaurante, spa, habitaciones y atención
- **Medir intención de recomendación** y retorno del cliente
- **Recopilar feedback específico** sobre limpieza, atención y calidad
- **Analizar relación calidad-precio** percibida por el cliente

---

## 📝 Estructura de la Encuesta

### Paso 1: Información Personal
- **Nombre de usuario** (opcional)
- **Nombre y Apellido** (obligatorio)

### Paso 2: Calidad del Servicio
- **Información del producto** - ¿Encontró fácilmente información?
- **Restaurante general** - Calificación general
- **Piscinas Termales** - Calificación general

### Paso 3: Atención al Cliente
- **Bienvenida** a su llegada
- **Cortesía en Recepción**
- **Cortesía en Restaurante**
- **Cortesía en Piscinas Termales**

### Paso 4: Limpieza
- **Limpieza de habitación/cabaña** a su llegada
- **Limpieza del Restaurante**
- **Limpieza de las Piscinas Termales**
- **Limpieza de los parques**

### Paso 5: Experiencia General
- **¿Nos visitaría nuevamente?**
- **¿Recomendaría estas Termas?**
- **¿Tuvo algún problema?**
- **Calidad de la información web**
- **Relación calidad/precio**
- **Satisfacción con resolución de problemas** (condicional)

### Paso 6: Comentarios
- **¿Qué mejoraría?** (texto libre)
- **¿Qué más le gustó?** (texto libre)
- **Servicios que ocupó** (selección múltiple)

---

## 🎨 Tipos de Preguntas

### Escala de Calidad (5 opciones)
- Excelente
- Muy Bueno
- Bueno
- Regular
- Malo

**Aplicada a:** Calidad de servicios, atención, limpieza, información web, relación calidad-precio

### Opciones Sí/No
- Sí
- No

**Aplicada a:** ¿Tuvo algún problema?

### Opciones de Recomendación (5 opciones)
- Definitivamente
- Probablemente
- No estoy seguro/a
- Probablemente no
- Definitivamente no

**Aplicada a:** ¿Recomendaría estas Termas?

### Opciones de Visita (5 opciones)
- Sí, me encantó
- Sí
- No estoy seguro/a
- Probablemente no
- No

**Aplicada a:** ¿Nos visitaría nuevamente?

### Servicios Disponibles (selección múltiple)
- Habitaciones Termas
- Cabañas
- Piscinas Termales
- Restaurante
- Masajes
- Mascaras Faciales

### Campos de Texto Libre
- Nombre de usuario (opcional)
- Nombre y Apellido (obligatorio)
- ¿Qué mejoraría? (opcional)
- ¿Qué más le gustó? (opcional)

---

## 🚀 Implementación

### Archivos Creados

1. **Página de Encuesta**: `src/app/surveys/termas-satisfaccion/[token]/page.tsx`
2. **Script SQL**: `crear_encuesta_completa_termas.sql`
3. **Script de IDs**: `actualizar_ids_preguntas_encuesta.sql`
4. **Script de Campaña**: `crear_campana_prueba_encuesta.sql`

### Pasos de Implementación

1. **Ejecutar script SQL** en Supabase SQL Editor:
   ```sql
   -- Ejecutar: crear_encuesta_completa_termas.sql
   ```

2. **Obtener IDs reales** de las preguntas:
   ```sql
   -- Ejecutar: actualizar_ids_preguntas_encuesta.sql
   ```

3. **Actualizar mapeo** en el código si es necesario:
   ```typescript
   // En src/app/surveys/termas-satisfaccion/[token]/page.tsx
   const getQuestionIdByField = (field: string): number => {
     // Actualizar con IDs reales obtenidos del paso 2
   };
   ```

4. **Crear campaña de prueba** (opcional):
   ```sql
   -- Ejecutar: crear_campana_prueba_encuesta.sql
   ```

### Acceso a la Encuesta

- **URL**: `/surveys/termas-satisfaccion/{token}`
- **Token**: Generado automáticamente para cada invitación
- **Duración estimada**: 5-8 minutos
- **Dispositivos**: Responsive (móvil, tablet, desktop)

---

## 📊 Análisis de Datos

### Métricas Clave

**Satisfacción General:**
- Promedio de calificaciones por servicio
- Distribución de respuestas (Excelente, Muy Bueno, etc.)
- Comparación entre servicios

**Intención de Recomendación:**
- Porcentaje de clientes que "Definitivamente" recomendarían
- Porcentaje de clientes que "Probablemente" recomendarían
- Net Promoter Score (NPS) calculado

**Retención:**
- Porcentaje que "Sí, me encantó" volvería
- Porcentaje que "Sí" volvería
- Análisis de clientes indecisos

**Problemas y Resolución:**
- Porcentaje de clientes que tuvieron problemas
- Satisfacción con la resolución de problemas
- Identificación de problemas recurrentes

### Consultas SQL Útiles

**Satisfacción promedio por servicio:**
```sql
SELECT 
    q.question_text as servicio,
    AVG(CASE 
        WHEN a.answer_text = 'Excelente' THEN 5
        WHEN a.answer_text = 'Muy Bueno' THEN 4
        WHEN a.answer_text = 'Bueno' THEN 3
        WHEN a.answer_text = 'Regular' THEN 2
        WHEN a.answer_text = 'Malo' THEN 1
    END) as promedio_satisfaccion
FROM survey_answers a
JOIN survey_questions q ON a.question_id = q.id
WHERE q.question_type = 'single_choice'
  AND a.answer_text IN ('Excelente', 'Muy Bueno', 'Bueno', 'Regular', 'Malo')
GROUP BY q.id, q.question_text
ORDER BY promedio_satisfaccion DESC;
```

**Análisis de recomendación:**
```sql
SELECT 
    a.answer_text as recomendacion,
    COUNT(*) as cantidad,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as porcentaje
FROM survey_answers a
JOIN survey_questions q ON a.question_id = q.id
WHERE q.question_text LIKE '%Recomendaría%'
GROUP BY a.answer_text
ORDER BY cantidad DESC;
```

**Servicios más utilizados:**
```sql
SELECT 
    TRIM(unnest(string_to_array(a.answer_text, ','))) as servicio,
    COUNT(*) as veces_utilizado
FROM survey_answers a
JOIN survey_questions q ON a.question_id = q.id
WHERE q.question_text = 'Servicios que ocupó'
GROUP BY servicio
ORDER BY veces_utilizado DESC;
```

---

## 🎯 Casos de Uso

### 1. Evaluación Post-Reserva
- **Cuándo**: 2-3 días después del checkout
- **Segmento**: Todos los huéspedes
- **Objetivo**: Feedback inmediato de la experiencia

### 2. Evaluación Trimestral
- **Cuándo**: Cada 3 meses
- **Segmento**: Clientes que visitaron en el trimestre
- **Objetivo**: Análisis de tendencias y mejoras

### 3. Evaluación Post-Evento
- **Cuándo**: Después de eventos especiales
- **Segmento**: Participantes del evento
- **Objetivo**: Feedback específico del evento

### 4. Evaluación de Servicios Específicos
- **Cuándo**: Después de usar servicios específicos
- **Segmento**: Clientes que usaron el servicio
- **Objetivo**: Mejora de servicios específicos

---

## 📈 Dashboard de Resultados

### Métricas en Tiempo Real
- **Respuestas recibidas**: Total y por día
- **Tasa de respuesta**: Porcentaje de invitaciones respondidas
- **Satisfacción promedio**: Por servicio y general
- **NPS Score**: Net Promoter Score calculado
- **Problemas reportados**: Cantidad y tipos

### Gráficos y Visualizaciones
- **Gráfico de barras**: Satisfacción por servicio
- **Gráfico circular**: Distribución de recomendaciones
- **Gráfico de líneas**: Tendencias en el tiempo
- **Mapa de calor**: Satisfacción por período

### Alertas Automáticas
- **Satisfacción baja**: < 3.5 en cualquier servicio
- **Problemas frecuentes**: > 20% reportan problemas
- **NPS bajo**: < 50 puntos
- **Respuestas negativas**: Comentarios con palabras clave negativas

---

## 🔧 Personalización

### Modificar Preguntas
1. Editar en Supabase: `survey_questions` table
2. Actualizar opciones: `survey_options` table
3. Modificar validaciones en el frontend

### Agregar Nuevos Servicios
1. Agregar opción en `survey_options` para pregunta "Servicios que ocupó"
2. Actualizar constante `SERVICIOS` en el frontend

### Cambiar Escalas
1. Modificar opciones en `survey_options`
2. Actualizar constantes en el frontend (`OPC_CALIDAD`, etc.)

### Personalizar Diseño
1. Modificar estilos en `src/app/surveys/termas-satisfaccion/[token]/page.tsx`
2. Cambiar colores, fuentes, espaciado
3. Agregar logo o branding

---

## 🚨 Troubleshooting

### Problemas Comunes

**1. IDs de preguntas incorrectos**
- Verificar IDs reales con script `actualizar_ids_preguntas_encuesta.sql`
- Actualizar mapeo en `getQuestionIdByField()`

**2. Opciones no aparecen**
- Verificar que se crearon en `survey_options`
- Verificar que `question_id` coincide

**3. Validación falla**
- Verificar que campos obligatorios están marcados correctamente
- Verificar lógica de validación en `validarPasoActual()`

**4. Respuestas no se guardan**
- Verificar que `submitSurveyAnswers` funciona
- Verificar que token es válido
- Verificar logs de error en consola

### Comandos de Debug

```sql
-- Verificar encuesta
SELECT * FROM surveys WHERE title LIKE '%Satisfacción%';

-- Verificar preguntas
SELECT * FROM survey_questions WHERE survey_id = [ID];

-- Verificar opciones
SELECT * FROM survey_options WHERE question_id IN (SELECT id FROM survey_questions WHERE survey_id = [ID]);

-- Verificar respuestas
SELECT * FROM survey_responses WHERE survey_id = [ID];
```

---

## 📞 Soporte

### Logs Importantes
- **Frontend**: Consola del navegador (F12)
- **Backend**: Terminal del servidor
- **Base de datos**: Supabase Dashboard

### Información para Reportar Bugs
- ID de la encuesta
- ID de la pregunta problemática
- Token de la invitación (sin exponer datos sensibles)
- Mensaje de error exacto
- Pasos para reproducir

---

*Documentación actualizada: Enero 2025*
