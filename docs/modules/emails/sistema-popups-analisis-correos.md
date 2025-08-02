# Sistema de Popups para Análisis de Correos

## 📋 Descripción General

Se ha implementado un sistema completo de ventanas emergentes (popups) que muestra el análisis de correos al usuario de forma proactiva. El sistema saluda al usuario por su nombre y presenta el resumen de análisis en momentos clave.

## 🎯 Funcionalidades Implementadas

### 1. **Popup al Iniciar Sesión**
- Se muestra automáticamente 2 segundos después de que el usuario accede al dashboard
- Saluda al usuario con su nombre y la hora del día correspondiente
- Muestra el análisis más reciente disponible
- Solo se muestra una vez por sesión (usando sessionStorage)

### 2. **Popup al Completar Análisis Automático**
- Se dispara cuando se completa un análisis (manual o automático)
- Indica que se ha completado un nuevo análisis
- Muestra los resultados inmediatamente

### 3. **Popup Manual**
- Botón "Ver Resumen" en el dashboard de emails
- Permite al usuario ver el popup cuando lo desee
- Útil para revisar análisis sin recargar la página

## 🏗️ Arquitectura del Sistema

### Componentes Principales

#### 1. **EmailAnalysisPopup.tsx**
```tsx
'use client';
import { useEmailAnalysisPopup } from '@/contexts/EmailAnalysisContext';

interface EmailAnalysisPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  trigger: 'login' | 'analysis' | 'manual';
}
```

**Características:**
- Diseño responsive con gradientes elegantes
- Saludo personalizado según la hora del día
- Muestra estadísticas en tiempo real
- Botones de acción (ver detalles, cerrar)
- Animaciones y loading states

#### 2. **EmailAnalysisContext.tsx**
```tsx
interface EmailAnalysisContextType {
  isPopupOpen: boolean;
  popupTrigger: 'login' | 'analysis' | 'manual';
  showPopup: (trigger) => void;
  hidePopup: () => void;
  hasShownLoginPopup: boolean;
}
```

**Funciones:**
- Gestión global del estado del popup
- Control de frecuencia (login una vez por sesión)
- Hooks personalizados para components

#### 3. **Integración en Dashboard Layout**
```tsx
// src/app/dashboard/layout.tsx
<EmailAnalysisProvider>
  <DashboardContent>
    {children}
    <EmailAnalysisPopup />
  </DashboardContent>
</EmailAnalysisProvider>
```

## 🕐 Triggers del Sistema

### 1. **Login Trigger**
```typescript
// Al cargar el dashboard
setTimeout(() => {
  showPopup('login');
}, 2000);
```

**Saludo:** "¡Buenos días/tardes/noches, [Nombre]! 🌟"
**Mensaje:** "Bienvenido de vuelta al sistema. Aquí tienes el resumen de correos del día"

### 2. **Analysis Trigger**
```typescript
// Después de completar análisis
if (result.success) {
  setTimeout(() => {
    showPopup('analysis');
  }, 1500);
}
```

**Saludo:** "¡Buenos días/tardes/noches, [Nombre]! 📧 Nuevo análisis completado"
**Mensaje:** "Se ha completado un nuevo análisis automático de correos electrónicos"

### 3. **Manual Trigger**
```typescript
// Botón "Ver Resumen"
<Button onClick={() => showPopup('manual')}>
  <Sparkles className="w-4 h-4" />
  Ver Resumen
</Button>
```

**Saludo:** "¡Hola [Nombre]! 📊 Análisis solicitado"
**Mensaje:** "Has solicitado ver el análisis de correos del día"

## 📊 Contenido del Popup

### Información Mostrada

1. **Header Personalizado**
   - Saludo con nombre del usuario
   - Fecha y hora actuales
   - Mensaje contextual según el trigger

2. **Resumen Principal**
   - Total de correos analizados
   - Correos urgentes detectados
   - Sentimiento general (positivo/negativo/neutral)
   - Hora del último análisis

3. **Temas Clave**
   - Lista de temas principales encontrados
   - Badges de colores para fácil identificación

4. **Acciones Recomendadas**
   - Lista de acciones sugeridas por ChatGPT
   - Priorización por urgencia

5. **Análisis Completo del Día**
   - Grid con todos los análisis del día
   - Estadísticas por franja horaria
   - Comparación entre franjas

6. **Botones de Acción**
   - "Ver detalles completos" → Abre `/dashboard/emails` en nueva pestaña
   - "Entendido" → Cierra el popup

## 🔧 Sistema de Notificaciones Automáticas

### Endpoint de Notificación
```
POST /api/emails/analysis-notification
Content-Type: application/json

{
  "timeSlot": "morning|midday|afternoon|evening",
  "success": true|false,
  "message": "Mensaje personalizado"
}
```

### Script de Cron Job
```bash
# scripts/cron-email-analysis.sh
#!/bin/bash

# Ejemplo crontab:
# 0 6 * * * /path/to/scripts/cron-email-analysis.sh morning
# 0 12 * * * /path/to/scripts/cron-email-analysis.sh midday
# 0 15 * * * /path/to/scripts/cron-email-analysis.sh afternoon
# 0 20 * * * /path/to/scripts/cron-email-analysis.sh evening

TIME_SLOT=$1
BASE_URL="http://localhost:3000"

# 1. Ejecutar análisis
curl -X POST "$BASE_URL/api/emails/analyze"

# 2. Notificar resultado
curl -X POST "$BASE_URL/api/emails/analysis-notification" \
  -d "{\"timeSlot\":\"$TIME_SLOT\",\"success\":true}"
```

## 🎨 Diseño y UX

### Características Visuales

1. **Header con Gradiente**
   - `bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700`
   - Overlay semitransparente para mejor legibilidad

2. **Cards de Estadísticas**
   - Grid responsive (1-3 columnas)
   - Iconos contextuales (📧, 🚨, 😊)
   - Números destacados con colores temáticos

3. **Badges Dinámicos**
   - Temas clave con fondo azul
   - Sentimientos con colores apropiados (verde/rojo/gris)
   - Estados con iconos (✅, ⏳, ❌)

4. **Animaciones**
   - Fade in/out del modal
   - Loading spinners
   - Hover effects en botones

### Responsividad
- Popup adaptable (max-w-4xl, max-h-90vh)
- Grid que se adapta a pantalla (1-4 columnas)
- Scrolling interno para contenido largo

## 🔐 Control de Frecuencia

### Prevención de Spam
```typescript
// Login: Solo una vez por sesión
if (trigger === 'login' && hasShownLoginPopup) {
  return; // No mostrar
}

// Analysis: Siempre mostrar
// Manual: Siempre mostrar
```

### SessionStorage
```typescript
// Guardar estado en sessionStorage
sessionStorage.setItem('email-analysis-popup-shown', 'true');

// Verificar al inicializar
const popupShown = sessionStorage.getItem('email-analysis-popup-shown');
```

## 📈 Beneficios del Sistema

1. **Proactividad**
   - Usuario informado sin necesidad de buscar información
   - Notificaciones inmediatas de análisis completados

2. **Personalización**
   - Saludo con nombre del usuario
   - Mensajes contextuales según la acción

3. **Eficiencia**
   - Resumen visual rápido de entender
   - Acceso directo a detalles completos

4. **Automatización**
   - Integración con cron jobs
   - Sistema escalable para notificaciones push

## 🚀 Instalación y Configuración

### 1. Verificar Dependencias
```bash
# Ya incluidas en el proyecto
npm install # Instala todas las dependencias
```

### 2. Variables de Entorno
```env
# .env.local
OPENAI_API_KEY=tu_api_key_aqui
GMAIL_USER=tu_email@gmail.com
GMAIL_APP_PASSWORD=tu_app_password
```

### 3. Configurar Cron Jobs (Opcional)
```bash
# Editar crontab
crontab -e

# Agregar líneas (ajustar rutas):
0 6 * * * /ruta/a/tu/proyecto/scripts/cron-email-analysis.sh morning
0 12 * * * /ruta/a/tu/proyecto/scripts/cron-email-analysis.sh midday
0 15 * * * /ruta/a/tu/proyecto/scripts/cron-email-analysis.sh afternoon
0 20 * * * /ruta/a/tu/proyecto/scripts/cron-email-analysis.sh evening
```

### 4. Hacer Script Ejecutable
```bash
chmod +x scripts/cron-email-analysis.sh
```

## 🧪 Testing

### Probar Popup Manual
1. Ir a `/dashboard/emails`
2. Hacer clic en "Ver Resumen"
3. Verificar que aparece popup con análisis

### Probar Popup de Login
1. Cerrar sesión
2. Hacer login nuevamente
3. Ir al dashboard
4. Popup debería aparecer automáticamente después de 2 segundos

### Probar Popup de Análisis
1. En `/dashboard/emails`
2. Hacer clic en "Ejecutar Análisis"
3. Popup debería aparecer después del análisis exitoso

### Probar Notificación Externa
```bash
# Probar endpoint de notificación
curl -X POST http://localhost:3000/api/emails/analysis-notification \
  -H "Content-Type: application/json" \
  -d '{"timeSlot":"morning","success":true,"message":"Test notification"}'
```

## 🔧 Troubleshooting

### Popup No Aparece
- Verificar que EmailAnalysisProvider esté en el layout
- Comprobar errores en console del navegador
- Verificar que el usuario esté autenticado

### Análisis No Disponible
- Verificar variables de entorno (OPENAI_API_KEY, GMAIL_*)
- Ejecutar análisis manual primero
- Revisar logs de la aplicación

### Cron Jobs No Funcionan
- Verificar permisos del script (`chmod +x`)
- Comprobar rutas absolutas en crontab
- Revisar logs del sistema: `/var/log/cron.log`

## 📝 Próximas Mejoras

1. **Notificaciones Push** - Integración con service workers
2. **WebSocket** - Notificaciones en tiempo real
3. **Configuración Usuario** - Permitir desactivar popups
4. **Análisis Histórico** - Comparación con días anteriores
5. **Filtros Avanzados** - Análisis por remitente, tema, etc.

## 💡 Conclusión

El sistema de popups de análisis de correos proporciona una experiencia proactiva y personalizada que mantiene a los usuarios informados sin interrumpir su flujo de trabajo. La integración con el sistema de análisis automático asegura que la información esté siempre actualizada y sea relevante. 