# Guía de Usuario - Sistema de Caja Chica

## Introducción

Esta guía te ayudará a utilizar el sistema integrado de caja chica para gestionar gastos menores, realizar compras urgentes, registrar ajustes de efectivo y cerrar tu sesión de trabajo de manera eficiente.

## Acceso al Sistema

### Navegación
1. Desde el menú lateral, busca la sección **"Caja Chica"**
2. Haz clic en **"Dashboard"** para acceder a la vista principal
3. Si no ves esta opción, contacta a tu supervisor para verificar permisos

### Estados del Sistema
- **✅ Con Sesión Activa**: Puedes realizar todas las operaciones
- **🔒 Sin Sesión Activa**: Solo puedes ver información del sistema

## Vista Principal - Dashboard

### Pestañas Disponibles

#### 📊 Vista General
- **Resumen del día**: Estadísticas de gastos, ingresos y ventas
- **Accesos rápidos**: Botones para acciones frecuentes
- **Flujo integrado**: Visual del proceso completo del día

#### 💰 Caja Chica
- **Gestión detallada**: Lista completa de transacciones
- **Estadísticas de límites**: Montos disponibles y usados
- **Formularios**: Acceso directo a registro de gastos, compras e ingresos

#### 🔒 Cierre de Caja
- **Resumen de cierre**: Cálculos automáticos del día
- **Proceso de cierre**: Pasos para finalizar la sesión
- **Conciliación**: Comparación entre efectivo esperado y real

## 💰 Cómo Registrar un Ingreso de Dinero

### ¿Qué es un Ingreso de Dinero?

Un **ingreso de dinero** es un **ajuste de efectivo físico** que se realiza cuando:
- Alguien te presta dinero para la caja
- Recibes reposición de efectivo del banco
- Hay un reembolso de gastos personales
- Cualquier movimiento que **aumente el efectivo físico** en caja

**⚠️ IMPORTANTE**: Los ingresos de dinero **NO afectan**:
- Centros de costo
- Categorías contables
- Reportes de gastos
- Inventario

Es **solo un ajuste de caja** para mantener el saldo físico correcto.

### Paso a Paso

1. **Abrir Formulario**
   - Haz clic en el botón **"💰 Registrar Ingreso"**
   - Se abrirá un modal con el formulario

2. **Completar Información**
   ```
   Descripción*: Explica de dónde viene el dinero
   Monto*: Cantidad exacta recibida
   Categoría: Tipo de ingreso (selección automática)
   Método de Pago: Cómo se recibió el dinero
   Notas: Información adicional (opcional)
   ```

3. **Categorías de Ingreso Disponibles**
   - **Ingresos**: Ingresos generales
   - **Reposición**: Reposición de caja desde banco
   - **Depósito**: Depósito bancario a caja
   - **Reembolso**: Reembolso de gastos personales
   - **Otros**: Otros tipos de ingresos

4. **Métodos de Pago**
   - **Efectivo**: Dinero físico recibido
   - **Transferencia**: Transferencia bancaria
   - **Tarjeta**: Pago con tarjeta
   - **Otro**: Otros métodos

5. **Confirmación**
   - Haz clic en **"💰 Registrar Ingreso"**
   - El sistema actualizará automáticamente el saldo de caja

### Ejemplos de Ingresos

**Reposición de Caja**
```
Descripción: Reposición de caja desde banco
Monto: $50,000
Categoría: Reposición
Método: Transferencia
Notas: Transferencia #12345 desde cuenta corriente
```

**Préstamo Personal**
```
Descripción: Préstamo personal para caja
Monto: $25,000
Categoría: Otros
Método: Efectivo
Notas: Préstamo de María para cubrir gastos urgentes
```

**Reembolso de Gastos**
```
Descripción: Reembolso de almuerzo de cliente
Monto: $15,000
Categoría: Reembolso
Método: Efectivo
Notas: Cliente pagó almuerzo que había comprado con dinero personal
```

### ⚠️ Consideraciones Importantes

- **Solo para ajustes de efectivo**: No uses para registrar ventas normales
- **Documenta siempre**: Explica claramente el origen del dinero
- **Verifica montos**: Confirma la cantidad antes de registrar
- **Comunica al supervisor**: Para montos grandes o situaciones especiales

## Cómo Registrar un Gasto

### Paso a Paso

1. **Abrir Formulario**
   - Haz clic en el botón **"💸 Nuevo Gasto"**
   - Se abrirá un modal con el formulario

2. **Completar Información**
   ```
   Descripción*: Detalla qué se compró o para qué fue el gasto
   Monto*: Cantidad exacta gastada
   Categoría*: Selecciona la categoría apropiada
   Notas: Información adicional (opcional)
   ```

3. **Categorías Disponibles**
   - **Suministros de Oficina**: Papel, bolígrafos, etc.
   - **Transporte**: Combustible, peajes, etc.
   - **Alimentación**: Almuerzos, refrigerios
   - **Servicios**: Reparaciones menores, etc.
   - **Mantenimiento**: Limpieza, materiales básicos
   - **Otros**: Gastos no clasificados

4. **Validación Automática**
   - El sistema verifica que no excedas tu límite diario
   - Si el monto es mayor a $15,000, requerirá aprobación

5. **Confirmación**
   - Haz clic en **"💾 Registrar Gasto"**
   - Recibirás confirmación del registro

### Límites y Aprobaciones

| Monto | Estado | Tiempo |
|-------|--------|--------|
| $0 - $15,000 | ✅ Aprobación automática | Inmediato |
| $15,001 - $30,000 | ⏳ Requiere aprobación | 1-4 horas |
| Más de $30,000 | ❌ Excede límite diario | No permitido |

## Cómo Realizar una Compra

### Paso a Paso

1. **Abrir Formulario**
   - Haz clic en **"🛒 Comprar Productos"**
   - Se abrirá el formulario de compras

2. **Completar Datos del Producto**
   ```
   Descripción*: Breve descripción de la compra
   Proveedor*: Nombre de la tienda o proveedor
   Producto*: Nombre específico del producto
   Cantidad*: Número de unidades
   Precio Unitario*: Precio por unidad
   ```

3. **Cálculo Automático**
   - El sistema calcula automáticamente el total
   - Muestra si excede los límites disponibles

4. **Información Importante**
   - Las compras aprobadas actualizan automáticamente el inventario
   - Los productos quedan disponibles para venta inmediatamente
   - Se genera registro de movimiento de inventario

5. **Confirmación**
   - Verifica que toda la información sea correcta
   - Haz clic en **"🛒 Registrar Compra"**

### Ejemplos Comunes

**Compra de Suministros**
```
Descripción: Suministros de oficina urgentes
Proveedor: Librería Central
Producto: Papel A4 500 hojas
Cantidad: 3
Precio Unitario: $4,500
Total: $13,500
```

**Compra de Productos para Venta**
```
Descripción: Restock productos agotados
Proveedor: Distribuidora XYZ
Producto: Agua embotellada 500ml
Cantidad: 24
Precio Unitario: $800
Total: $19,200
```

## Monitoreo de Transacciones

### Tipos de Transacciones

#### 💰 Ingresos de Dinero
- **Color**: Verde (➕)
- **Descripción**: Ajustes de efectivo físico
- **Efecto**: Aumenta el saldo de caja
- **Ejemplos**: Reposición, préstamos, reembolsos

#### 💸 Gastos
- **Color**: Rojo (➖)
- **Descripción**: Gastos menores del día
- **Efecto**: Disminuye el saldo de caja
- **Ejemplos**: Suministros, transporte, alimentación

#### 🛒 Compras
- **Color**: Naranja (🛒)
- **Descripción**: Compras de productos/inventario
- **Efecto**: Disminuye el saldo de caja
- **Ejemplos**: Productos para venta, suministros

### Estados de las Transacciones

#### ⏳ Pendiente
- **Qué significa**: Esperando aprobación de supervisor
- **Tiempo estimado**: 1-4 horas en horario laboral
- **Acción requerida**: Ninguna, solo esperar

#### ✅ Aprobado
- **Qué significa**: Transacción aprobada y procesada
- **Efecto**: Se descuenta del efectivo de caja
- **Para compras**: Se actualiza inventario automáticamente

#### ❌ Rechazado
- **Qué significa**: Supervisor rechazó la transacción
- **Efecto**: No se procesa, no afecta límites
- **Siguiente paso**: Contactar supervisor para más detalles

### Historial de Transacciones

En la pestaña **"💰 Caja Chica"** encontrarás:
- Lista completa de transacciones del día
- Hora exacta de cada registro
- Estado actual de cada transacción
- Montos y descripciones detalladas
- **Distinción visual** entre ingresos (verde), gastos (rojo) y compras (naranja)

## Proceso de Cierre de Caja

### Cuándo Cerrar
- Al final de tu turno de trabajo
- Cuando se te solicite específicamente
- En caso de emergencia o cambio de turno

### Pasos del Cierre

1. **Revisar Resumen**
   - Ve a la pestaña **"🔒 Cierre de Caja"**
   - Revisa los cálculos automáticos
   - Verifica que todas las transacciones estén procesadas

2. **Contar Efectivo**
   - Cuenta físicamente todo el efectivo en caja
   - Incluye billetes y monedas
   - Verifica tres veces para exactitud

3. **Registrar Conteo**
   - Haz clic en **"🔒 Proceder al Cierre de Caja"**
   - Ingresa la cantidad exacta contada
   - El sistema calculará automáticamente las diferencias

4. **Interpretar Resultados**

   **✅ Caja Cuadrada (diferencia = $0)**
   - ¡Perfecto! Cierre aprobado automáticamente
   - Tu sesión se cierra inmediatamente

   **💰 Sobrante (≤ $1,000)**
   - Diferencia dentro de tolerancia
   - Aprobación automática
   - Anota posible causa en observaciones

   **⚠️ Faltante (≤ $1,000)**
   - Diferencia dentro de tolerancia
   - Aprobación automática
   - Revisa posibles gastos no registrados

   **🚨 Diferencia > $1,000**
   - Requiere aprobación de supervisor
   - Revisa cuidadosamente el conteo
   - Verifica todas las transacciones del día

5. **Observaciones**
   - Siempre anota comentarios relevantes
   - Explica diferencias conocidas
   - Menciona eventos especiales del día

### Ejemplo de Cierre

```
Efectivo esperado: $85,300
Efectivo contado: $85,800
Diferencia: +$500 (sobrante)

Observaciones: "Cliente pagó con billete de $50,000 
por compra de $49,500. Cambio correcto entregado."

Estado: ✅ Aprobado automáticamente
```

## Resolución de Problemas Comunes

### "¿Cuándo debo registrar un ingreso de dinero?"

**Registra un ingreso cuando:**
- Alguien te presta dinero para la caja
- Recibes reposición desde el banco
- Hay un reembolso de gastos personales
- Cualquier situación que **aumente el efectivo físico**

**NO registres como ingreso:**
- Ventas normales del negocio
- Pagos de clientes por productos/servicios
- Dinero que ya estaba en caja

### "¿Los ingresos afectan los reportes contables?"

**NO**, los ingresos de dinero son **solo ajustes de caja**:
- No afectan centros de costo
- No aparecen en reportes de gastos
- No modifican categorías contables
- Solo ajustan el saldo físico de efectivo

### "No puedo registrar un gasto"

**Posibles causas:**
- Excedes el límite diario ($30,000)
- No hay sesión activa
- Problemas de conexión

**Solución:**
1. Verifica tus límites en la vista principal
2. Contacta supervisor para abrir sesión si es necesario
3. Intenta nuevamente en unos minutos

### "Mi transacción está pendiente mucho tiempo"

**Qué revisar:**
- ¿Es horario laboral? (Las aprobaciones solo ocurren en horario de oficina)
- ¿El monto requiere aprobación? (>$15,000)
- ¿Hay supervisores disponibles?

**Acción:**
- Contacta directamente al supervisor
- Pregunta por transacciones pendientes

### "No puedo cerrar la caja"

**Posibles problemas:**
- Transacciones pendientes sin procesar
- Diferencia muy grande (>$1,000)
- Error en el conteo de efectivo

**Pasos de solución:**
1. Espera a que se procesen transacciones pendientes
2. Cuenta nuevamente el efectivo
3. Revisa el historial del día
4. Contacta supervisor si persiste el problema

### "El sistema muestra números incorrectos"

**Verificaciones:**
- ¿Estás viendo el día correcto?
- ¿Hay ventas no registradas?
- ¿Todas las transacciones están en el estado correcto?

**Solución:**
1. Refresca la página (F5)
2. Verifica filtros de fecha
3. Reporta el problema a IT si persiste

## Consejos y Mejores Prácticas

### Para Ingresos de Dinero
- **Documenta el origen**: Siempre explica de dónde viene el dinero
- **Verifica montos**: Confirma la cantidad antes de registrar
- **Usa categorías apropiadas**: Selecciona la categoría que mejor describa el tipo de ingreso
- **Comunica al supervisor**: Para montos grandes o situaciones especiales
- **No confundas con ventas**: Los ingresos son ajustes de caja, no ventas normales

### Para Gastos
- **Sé específico**: "Papel A4 - 2 resmas" mejor que "papelería"
- **Guarda recibos**: Aunque no los subas al sistema
- **Categoriza correctamente**: Facilita reportes y auditorías
- **Registra inmediatamente**: No esperes al final del día

### Para Compras
- **Verifica precios**: Compara con proveedores habituales
- **Productos existentes**: Revisa si ya hay en inventario
- **Cantidad apropiada**: No compres exceso innecesario
- **Proveedor confiable**: Usa proveedores conocidos cuando sea posible

### Para Cierre
- **Cuenta en privado**: Evita distracciones durante el conteo
- **Organiza billetes**: Por denominación para facilitar conteo
- **Doble verificación**: Cuenta dos veces antes de registrar
- **Documenta todo**: Las observaciones ayudan en futuras revisiones

### Comunicación
- **Reporta problemas rápido**: No esperes que se resuelvan solos
- **Mantén informado al supervisor**: Sobre gastos importantes o urgentes
- **Usa el chat/teléfono**: Para dudas inmediatas
- **Documenta decisiones**: En las notas del sistema

## Contactos de Soporte

### Problemas del Sistema
- **IT Support**: ext. 123 o it@empresa.com
- **Disponibilidad**: Lunes a viernes, 8:00 AM - 6:00 PM

### Aprobaciones y Políticas
- **Supervisor Directo**: [Nombre y contacto]
- **Gerencia**: ext. 456 o gerencia@empresa.com

### Emergencias
- **Fuera de horario**: [Número de emergencia]
- **Problemas graves**: Contacta inmediatamente

## Recursos Adicionales

### Documentación
- Manual completo del sistema
- Políticas de gastos de la empresa
- Procedimientos de emergencia

### Capacitación
- Videos tutoriales disponibles en intranet
- Sesiones de entrenamiento mensuales
- Capacitación individual disponible bajo solicitud

### Actualizaciones
- Las mejoras del sistema se anuncian por email
- Cambios en políticas se comunican oficialmente
- Feedback y sugerencias son bienvenidas

¡Recuerda que este sistema está diseñado para hacer tu trabajo más fácil y eficiente! 🚀 