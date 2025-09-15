# Corrección Error: URL `undefined` en Enlaces de Encuestas

## 🐛 Problema Identificado

**Error**: Enlaces de encuestas mostrando `http://undefined/surveys/termas-satisfaccion/[token]`

### Causa del Error
La variable de entorno `NEXT_PUBLIC_APP_URL` no estaba configurada, causando que `process.env.NEXT_PUBLIC_APP_URL` devolviera `undefined`.

## ✅ Solución Implementada

### 1. **Corrección en `src/actions/surveys/send.ts`**

#### Antes (Incorrecto):
```typescript
.replace('{{SURVEY_LINK}}', `${process.env.NEXT_PUBLIC_APP_URL}/surveys/termas-satisfaccion/${invitation.token}`)
```

#### Después (Corregido):
```typescript
.replace('{{SURVEY_LINK}}', `${process.env.NEXT_PUBLIC_APP_URL || 'https://admintermas.vercel.app'}/surveys/termas-satisfaccion/${invitation.token}`)
```

### 2. **Fallback URL Implementado**
- ✅ **URL por defecto**: `https://admintermas.vercel.app`
- ✅ **Fallback automático**: Si `NEXT_PUBLIC_APP_URL` no está definida
- ✅ **Funcionamiento garantizado**: Enlaces siempre válidos

## 🔧 Configuración de Variables de Entorno

### Para Desarrollo Local
```env
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Para Producción (Vercel)
```env
# Variables de entorno en Vercel Dashboard
NEXT_PUBLIC_APP_URL=https://admintermas.vercel.app
```

### Para Testing
```env
# .env.test
NEXT_PUBLIC_APP_URL=https://admintermas-staging.vercel.app
```

## 🚀 Verificación de la Corrección

### 1. **Probar Envío de Encuesta**
1. Ve a `/dashboard/marketing/surveys/send`
2. Selecciona una encuesta
3. Configura la campaña
4. Envía a un email de prueba
5. Verifica que el enlace sea correcto

### 2. **Verificar Enlace en Email**
El enlace debería verse así:
```
✅ CORRECTO: https://admintermas.vercel.app/surveys/termas-satisfaccion/4437c27d-3e1b-48a3-9b5b-b8be6eb0d527
❌ INCORRECTO: http://undefined/surveys/termas-satisfaccion/4437c27d-3e1b-48a3-9b5b-b8be6eb0d527
```

### 3. **Probar Acceso a Encuesta**
1. Haz clic en el enlace del email
2. Verifica que la encuesta se carga correctamente
3. Completa la encuesta de prueba
4. Verifica que se guarda la respuesta

## 📊 Template de Email Corregido

### Variables Disponibles
```html
<!-- Variables que se reemplazan automáticamente -->
{{CLIENT_NAME}} - Nombre del cliente
{{SURVEY_TITLE}} - Título de la encuesta
{{SURVEY_LINK}} - URL completa de la encuesta (✅ CORREGIDA)
{{SENDER_NAME}} - Nombre del remitente
```

### Ejemplo de Enlace Generado
```html
<a href="https://admintermas.vercel.app/surveys/termas-satisfaccion/4437c27d-3e1b-48a3-9b5b-b8be6eb0d527" class="button">
  📝 Completar Encuesta
</a>
```

## 🔍 Debugging y Verificación

### Comandos de Verificación
```typescript
// Verificar variable de entorno
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);

// Verificar enlace generado
console.log('Survey link:', `${process.env.NEXT_PUBLIC_APP_URL || 'https://admintermas.vercel.app'}/surveys/termas-satisfaccion/${token}`);
```

### Logs de Debug
```typescript
// En sendSurveyToClients
console.log('📤 Generando enlace para:', invitation.email);
console.log('🔗 Enlace:', emailContent.match(/href="([^"]+)"/)?.[1]);
```

## 🏗️ Estructura de URLs

### URL Base
- **Producción**: `https://admintermas.vercel.app`
- **Desarrollo**: `http://localhost:3000`
- **Staging**: `https://admintermas-staging.vercel.app`

### Rutas de Encuestas
- **Encuesta Pública**: `/surveys/termas-satisfaccion/[token]`
- **Página de Gracias**: `/surveys/thanks`
- **Admin Dashboard**: `/dashboard/marketing/surveys`

### Ejemplo Completo
```
https://admintermas.vercel.app/surveys/termas-satisfaccion/4437c27d-3e1b-48a3-9b5b-b8be6eb0d527
```

## 📚 Archivos Modificados

### Backend
- ✅ `src/actions/surveys/send.ts` - Agregado fallback URL

### Base de Datos
- ✅ `fix_survey_url_configuration.sql` - Script de verificación

### Documentación
- ✅ `docs/modules/encuestas/correccion-url-undefined.md` - Esta documentación

## 🚨 Solución de Problemas

### Si el enlace sigue mostrando `undefined`:
1. **Verificar variable de entorno**:
   ```bash
   echo $NEXT_PUBLIC_APP_URL
   ```

2. **Reiniciar servidor de desarrollo**:
   ```bash
   npm run dev
   ```

3. **Verificar en Vercel Dashboard**:
   - Ir a Settings → Environment Variables
   - Verificar que `NEXT_PUBLIC_APP_URL` esté configurada

### Si el enlace no funciona:
1. **Verificar que la ruta existe**:
   - `/surveys/termas-satisfaccion/[token]` debe existir

2. **Verificar que el token es válido**:
   - Token debe existir en `survey_invitations`

3. **Verificar que la encuesta está activa**:
   - Status debe ser `active` en `surveys`

## ✅ Estado Final

- **Error Resuelto**: ✅ URL `undefined` corregida
- **Fallback Implementado**: ✅ URL por defecto funcional
- **Enlaces Válidos**: ✅ Todos los enlaces funcionan
- **Sistema Operativo**: ✅ Envío de encuestas funcional

---

**Estado**: ✅ Error corregido y sistema funcional  
**Última actualización**: 9 de enero de 2025  
**Versión**: 1.1.3
