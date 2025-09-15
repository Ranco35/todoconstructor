# 🚀 Guía de Uso Rápido - Módulo de Encuestas

## ⚡ Inicio en 5 Minutos

### 1️⃣ Acceder al Módulo
- Ir a **Dashboard Principal** (`/dashboard`)
- Hacer clic en la tarjeta **"Encuestas"** (púrpura con ícono 📊)
- Solo visible para **Administradores**

### 2️⃣ Crear Primera Encuesta
```
Título: "Satisfacción Hotel Q1 2025"
Descripción: "Ayúdanos a mejorar tu experiencia"
```
- Hacer clic en **"Crear"**
- La encuesta aparece en la lista

### 3️⃣ Agregar Preguntas
- Hacer clic en **"Configurar"** en la encuesta creada
- Agregar preguntas:

**Pregunta 1:**
- Tipo: **Rating**
- Texto: "¿Cómo calificarías tu experiencia general?"
- Obligatoria: ✅

**Pregunta 2:**
- Tipo: **Selección única**
- Texto: "¿Qué servicio te gustó más?"
- Opciones: "Masajes", "Restaurante", "Habitación", "Piscina"

**Pregunta 3:**
- Tipo: **Texto**
- Texto: "¿Qué mejorarías?"
- Obligatoria: ❌

### 4️⃣ Crear Campaña
- En la misma página, completar:
```
Nombre: "Campaña Q1 2025"
Remitente: "Termas Llifén"
Email: "marketing@termasllifen.cl"
```
- Hacer clic en **"Crear campaña"**

### 5️⃣ Enviar Invitaciones
**Opción A: API Directa**
```bash
curl -X POST /api/surveys/send \
  -H "Content-Type: application/json" \
  -d '{"campaignId": 1}'
```

**Opción B: Desde Código**
```typescript
import { sendSurveyInvitations } from '@/actions/surveys';
await sendSurveyInvitations(1);
```

### 6️⃣ Clientes Responden
- Clientes reciben correo con enlace único
- Hacen clic en enlace → `/surveys/{token}`
- Completan formulario y envían
- Ven página de agradecimiento

---

## 📊 Ver Resultados

### En Base de Datos
```sql
-- Ver todas las respuestas
SELECT 
  s.title as encuesta,
  q.question_text as pregunta,
  a.answer_text as respuesta
FROM surveys s
JOIN survey_questions q ON s.id = q.survey_id
JOIN survey_answers a ON q.id = a.question_id
JOIN survey_responses r ON a.response_id = r.id
ORDER BY s.title, q.order_index;
```

### Estadísticas Rápidas
```sql
-- Tasa de respuesta por encuesta
SELECT 
  s.title,
  COUNT(DISTINCT si.id) as invitaciones,
  COUNT(DISTINCT sr.id) as respuestas,
  ROUND(COUNT(DISTINCT sr.id) * 100.0 / COUNT(DISTINCT si.id), 1) as tasa_respuesta
FROM surveys s
LEFT JOIN survey_invitations si ON s.id = si.survey_id
LEFT JOIN survey_responses sr ON si.id = sr.invitation_id
GROUP BY s.id, s.title;
```

---

## 🎯 Casos de Uso Comunes

### 📝 Encuesta de Satisfacción Post-Reserva
```
Título: "¿Cómo fue tu estadía?"
Preguntas:
1. Rating: "Califica tu experiencia general (1-5)"
2. Selección única: "Servicio destacado"
3. Texto: "Comentarios adicionales"
```

### 🍽️ Feedback del Restaurante
```
Título: "Opinión sobre nuestro restaurante"
Preguntas:
1. Rating: "Calidad de la comida"
2. Rating: "Atención del personal"
3. Selección múltiple: "Platos favoritos"
4. Texto: "Sugerencias de mejora"
```

### 🏊 Evaluación de Servicios Spa
```
Título: "Experiencia en nuestro spa"
Preguntas:
1. Rating: "Satisfacción con masajes"
2. Selección única: "Tipo de masaje preferido"
3. Rating: "Ambiente y relajación"
4. Texto: "¿Recomendarías nuestros servicios?"
```

---

## ⚙️ Configuración Técnica

### Variables de Entorno Requeridas
```env
# Email (ya configurado en el sistema)
GMAIL_USER=reservas@termasllifen.cl
GMAIL_APP_PASSWORD=your_app_password

# URL para enlaces en correos
NEXT_PUBLIC_APP_URL=https://admintermas.vercel.app
```

### Permisos de Usuario
- **Solo Administradores** pueden acceder al módulo
- **Autenticación requerida** para todas las operaciones
- **RLS habilitado** en todas las tablas

---

## 🚨 Solución de Problemas Rápida

### ❌ "No puedo crear encuesta"
1. Verificar que eres administrador
2. Revisar consola del navegador (F12)
3. Verificar que las tablas existen en Supabase

### ❌ "No se envían correos"
1. Verificar configuración de Gmail
2. Verificar `NEXT_PUBLIC_APP_URL`
3. Revisar logs en terminal del servidor

### ❌ "Token inválido"
1. Verificar que el token existe en `survey_invitations`
2. Verificar que no ha expirado
3. Verificar que no se ha respondido ya

### ❌ "No aparecen encuestas"
1. Verificar políticas RLS
2. Verificar autenticación del usuario
3. Revisar logs de `listSurveys()`

---

## 📞 Soporte

### Logs Importantes
- **Consola del navegador**: Errores de frontend
- **Terminal del servidor**: Errores de server actions
- **Supabase Logs**: Errores de base de datos

### Comandos de Debug
```sql
-- Verificar encuestas
SELECT * FROM surveys ORDER BY created_at DESC;

-- Verificar invitaciones
SELECT * FROM survey_invitations WHERE status = 'pending';

-- Verificar respuestas
SELECT * FROM survey_responses ORDER BY created_at DESC;
```

---

*Guía actualizada: Enero 2025*
