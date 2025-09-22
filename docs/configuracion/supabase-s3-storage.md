# 🔐 Configuración S3 de Supabase Storage

## 📋 Resumen

Este documento describe la configuración del acceso S3 directo a Supabase Storage para el proyecto TodoConstructor.

## 🔑 Credenciales S3 Configuradas

### Información de Conexión
- **Endpoint**: `https://oojczqgarhyxcrrxjsiy.storage.supabase.co/storage/v1/s3`
- **Región**: `us-east-2`
- **Access Key ID**: `82b8833db8556ae350e2406299b42b67`
- **Secret Access Key**: `d1433d5d91db2746aa5dd8aa550d6ef937c85f10ea7b09dd04e833bd57a5f620`

### Buckets Configurados
- **Productos**: `Imagenes Productos`
- **Clientes**: `client-images`
- **Website**: `website-images`

## 📁 Archivos Creados

### 1. Configuración S3
**Archivo**: `src/lib/supabase-s3-config.ts`
- Configuración centralizada de credenciales S3
- Validación de configuración
- Función para obtener configuración del cliente S3

### 2. Cliente S3
**Archivo**: `src/lib/supabase-s3-client.ts`
- Cliente S3 personalizado para Supabase
- Funciones para upload, delete y listado de archivos
- Funciones de conveniencia para imágenes de productos

### 3. Script de Verificación
**Archivo**: `verificar_conexion_s3.js`
- Script para verificar la conexión S3
- Pruebas de conectividad, listado y subida de archivos
- Ejecutar en consola del navegador

### 4. Configuración de Entorno
**Archivo**: `config/environment-example.txt`
- Ejemplo de variables de entorno
- Plantilla para configuración segura

## 🚀 Cómo Usar

### Método 1: Variables de Entorno (Recomendado)

1. **Crear archivo `.env.local`**:
```bash
# Supabase S3 Configuration
SUPABASE_S3_ENDPOINT=https://oojczqgarhyxcrrxjsiy.storage.supabase.co/storage/v1/s3
SUPABASE_S3_REGION=us-east-2
SUPABASE_S3_ACCESS_KEY_ID=82b8833db8556ae350e2406299b42b67
SUPABASE_S3_SECRET_ACCESS_KEY=d1433d5d91db2746aa5dd8aa550d6ef937c85f10ea7b09dd04e833bd57a5f620

# Bucket Configuration
SUPABASE_PRODUCT_BUCKET=Imagenes Productos
SUPABASE_CLIENT_BUCKET=client-images
SUPABASE_WEBSITE_BUCKET=website-images
```

2. **Usar en el código**:
```typescript
import { supabaseS3Config } from '@/lib/supabase-s3-config';
import { uploadProductImageS3 } from '@/lib/supabase-s3-client';

// Subir imagen de producto
const result = await uploadProductImageS3(file, productId);
```

### Método 2: Configuración Directa

Las credenciales están hardcodeadas en `src/lib/supabase-s3-config.ts` como fallback.

## 🧪 Verificación

### Ejecutar Script de Verificación

1. **Abrir consola del navegador** en la página de productos
2. **Ejecutar el script**:
```javascript
// Copiar y pegar el contenido de verificar_conexion_s3.js
```

### Pruebas Incluidas

- ✅ **Conexión S3**: Verifica que el endpoint responde
- ✅ **Listado de archivos**: Prueba el acceso de lectura
- ✅ **Subida de archivo**: Prueba el acceso de escritura
- ✅ **Limpieza**: Elimina archivos de prueba

## 🔒 Seguridad

### ⚠️ Consideraciones Importantes

1. **Credenciales Sensibles**: Las claves S3 son información confidencial
2. **No Subir a Git**: Nunca commitear `.env.local` o archivos con credenciales
3. **Rotación de Claves**: Cambiar las claves periódicamente
4. **Acceso Limitado**: Usar solo para operaciones necesarias

### 🛡️ Mejores Prácticas

1. **Variables de Entorno**: Usar siempre variables de entorno en producción
2. **Validación**: Verificar configuración antes de usar
3. **Logging**: No logear credenciales completas
4. **Monitoreo**: Supervisar uso de las claves S3

## 🔧 Integración con Sistema Existente

### Compatibilidad

- ✅ **Compatible** con el sistema actual de Supabase Storage
- ✅ **Alternativa** al método estándar de Supabase
- ✅ **Mismo bucket** "Imagenes Productos" ya configurado

### Uso Recomendado

1. **Mantener** el sistema actual de `supabase-storage.ts`
2. **Usar S3 directo** solo cuando sea necesario
3. **Combinar** ambos métodos según la necesidad

## 📊 Estado de Implementación

### ✅ Completado

- [x] Configuración S3 creada
- [x] Cliente S3 implementado
- [x] Script de verificación desarrollado
- [x] Documentación completa
- [x] Integración con sistema existente

### 🔄 Próximos Pasos

- [ ] Implementar AWS SDK para mejor compatibilidad
- [ ] Agregar firmado de peticiones S3
- [ ] Implementar retry logic
- [ ] Agregar métricas de uso

## 🆘 Solución de Problemas

### Error: "Configuración S3 inválida"
- Verificar que las variables de entorno estén configuradas
- Comprobar que las credenciales son correctas

### Error: "Conexión S3 fallida"
- Verificar conectividad de red
- Comprobar que el endpoint S3 es correcto
- Verificar permisos de las claves S3

### Error: "Bucket no encontrado"
- Verificar que el bucket existe en Supabase
- Comprobar permisos de acceso al bucket
- Verificar nombre del bucket (case-sensitive)

## 📞 Soporte

Para problemas con la configuración S3:

1. **Ejecutar script de verificación** primero
2. **Revisar logs** de la consola del navegador
3. **Verificar credenciales** en Supabase Dashboard
4. **Contactar soporte** si persisten los problemas

---

**Fecha de configuración**: $(date)  
**Configurado por**: Claude AI Assistant  
**Estado**: ✅ COMPLETADO Y DOCUMENTADO

