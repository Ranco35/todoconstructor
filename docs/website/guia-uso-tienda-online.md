# Guía de Uso - Tienda Online Ferretería

## 🏪 **ACCESO AL SISTEMA**

### **URLs Principales**
- **Tienda Online**: `http://localhost:3000/website`
- **Panel Admin**: `http://localhost:3000/admin/website`
- **Dashboard**: `http://localhost:3000/dashboard`

## 👥 **PARA CLIENTES**

### **Navegación Principal**
1. **Inicio**: Página principal con todos los productos
2. **Productos**: Catálogo completo con filtros
3. **Categorías**: Lista de categorías disponibles
4. **Sobre Nosotros**: Información de la empresa
5. **Contacto**: Formulario y datos de contacto

### **Cómo Buscar Productos**

#### **Búsqueda por Texto**
1. Usar el campo de búsqueda en la parte superior
2. Escribir nombre, marca o descripción del producto
3. Ejemplo: "FIBROCEMENTO", "VOLCANBOARD", "4mm"

#### **Filtros Disponibles**
- **Categoría**: Seleccionar tipo de producto
- **Precio**: Rango mínimo y máximo
- **Stock**: Solo productos disponibles

#### **Vista de Productos**
- **Vista Grid**: Tarjetas organizadas en cuadrícula
- **Vista Lista**: Lista vertical compacta
- **Información mostrada**: Imagen, nombre, precio, stock, bodega

### **Contacto por WhatsApp**

#### **Por Producto Específico**
1. Hacer clic en "Consultar por WhatsApp" en la tarjeta del producto
2. Se abre WhatsApp con mensaje predefinido
3. Mensaje incluye nombre del producto

#### **Consulta General**
1. Usar el botón flotante verde en la esquina inferior derecha
2. Mensaje general para consultas sobre ferretería
3. Número: +56 9 1234 5678

## 👨‍💼 **PARA ADMINISTRADORES**

### **Gestión de Productos**
- **Stock**: Se actualiza automáticamente desde el inventario
- **Precios**: Configurados en el sistema POS
- **Categorías**: Gestionadas desde el panel admin
- **Imágenes**: Se pueden subir o usar genéricas

### **Monitoreo del Sistema**
- **Logs**: Revisar consola del navegador para errores
- **Variables de entorno**: Verificar configuración en `.env.local`
- **Base de datos**: Monitorear conexión a Supabase

### **Mantenimiento Regular**
1. **Verificar stock**: Asegurar que los números sean correctos
2. **Actualizar precios**: Si hay cambios en el sistema POS
3. **Revisar imágenes**: Verificar que se muestren correctamente
4. **Probar WhatsApp**: Confirmar que los enlaces funcionen

## 🔧 **SOLUCIÓN DE PROBLEMAS**

### **Problemas Comunes**

#### **No se muestran productos**
- Verificar variables de entorno en `.env.local`
- Revisar conexión a Supabase
- Comprobar que hay productos con stock > 0

#### **Error de importación**
- Verificar que todas las dependencias estén instaladas
- Revisar imports en componentes React
- Reiniciar servidor de desarrollo

#### **WhatsApp no funciona**
- Verificar número de teléfono
- Comprobar formato del mensaje
- Probar en diferentes navegadores

### **Comandos de Diagnóstico**
```bash
# Verificar variables de entorno
Write-Host "NEXT_PUBLIC_SUPABASE_URL: $env:NEXT_PUBLIC_SUPABASE_URL"

# Reiniciar servidor
npm run dev

# Verificar procesos
Get-Process | Where-Object {$_.ProcessName -like "*node*"}
```

## 📱 **OPTIMIZACIÓN MÓVIL**

### **Características Responsive**
- **Navegación**: Menú hamburguesa en móviles
- **Productos**: Grid adaptativo (1-4 columnas según pantalla)
- **WhatsApp**: Botón flotante siempre visible
- **Filtros**: Panel colapsable en móviles

### **Mejores Prácticas**
- Usar en modo horizontal para mejor visualización
- Mantener conexión estable para carga rápida
- Permitir notificaciones para WhatsApp

## 📊 **MÉTRICAS DE USO**

### **Productos Destacados**
- **FIBROCEMENTO VOLCANBOARD**: Stock 10 unidades
- **Categorías populares**: Herramientas, Materiales, Eléctricos
- **Búsquedas frecuentes**: Por nombre de producto

### **Estadísticas del Sistema**
- **Productos disponibles**: Variable según stock
- **Categorías activas**: Múltiples categorías
- **Tiempo de carga**: Optimizado para velocidad
- **Compatibilidad**: Todos los navegadores modernos

## 🚀 **MEJORAS FUTURAS**

### **Funcionalidades Sugeridas**
- **Carrito de compras**: Para pedidos múltiples
- **Sistema de pedidos**: Integración con WhatsApp Business
- **Reseñas de productos**: Feedback de clientes
- **Notificaciones**: Stock bajo, nuevos productos
- **Integración POS**: Sincronización en tiempo real

### **Optimizaciones Técnicas**
- **Cache de productos**: Para mejor rendimiento
- **Imágenes optimizadas**: WebP, lazy loading
- **SEO mejorado**: Meta tags, sitemap
- **Analytics**: Google Analytics, métricas de uso

## 📞 **SOPORTE**

### **Contacto Técnico**
- **WhatsApp**: +56 9 1234 5678
- **Email**: soporte@tcconstructor.cl
- **Horario**: 24/7 (sistema automatizado)

### **Recursos Adicionales**
- **Documentación técnica**: `docs/website/`
- **Código fuente**: Repositorio Git
- **Logs del sistema**: Consola del navegador

---

*Esta guía debe actualizarse conforme se implementen nuevas funcionalidades o se realicen cambios en el sistema.*

