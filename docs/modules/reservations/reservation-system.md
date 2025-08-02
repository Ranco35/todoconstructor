# Módulo de Reservas - Hotel Spa Termas Llifen

## Descripción General

El módulo de reservas es un sistema completo para la gestión de reservas de hotel y spa, diseñado específicamente para el Hotel Spa Termas Llifen. Permite gestionar reservas individuales y corporativas, habitaciones, productos del spa, pagos y comentarios.

## Características Principales

### 🏨 Gestión de Habitaciones
- Registro de habitaciones con tipos, capacidades y precios
- Control de disponibilidad en tiempo real
- Gestión de amenidades por habitación

### 👥 Gestión de Clientes
- **Clientes Individuales**: Reservas directas de personas
- **Clientes Corporativos**: Empresas con contactos autorizados
- Sistema de límites de gasto por contacto
- Gestión de términos de pago y límites de crédito

### 📅 Sistema de Calendario
- Vista mensual, semanal y diaria
- Filtros avanzados por estado, cliente, habitación, etc.
- Búsqueda en tiempo real
- Estadísticas de ocupación

### 💰 Gestión de Pagos
- Múltiples métodos de pago
- Control de pagos parciales
- Seguimiento de deudas pendientes
- Historial completo de transacciones

### 🧖‍♀️ Productos del Spa
- Catálogo de servicios y paquetes
- Precios y duraciones
- Integración con reservas
- Categorización por tipo

## Estructura de Base de Datos

### Tablas Principales

#### 1. `companies` - Empresas
```sql
- id (BIGSERIAL PRIMARY KEY)
- name (VARCHAR(255))
- rut (VARCHAR(20) UNIQUE)
- address (TEXT)
- contact_email (VARCHAR(255))
- contact_phone (VARCHAR(50))
- payment_terms (VARCHAR(50))
- credit_limit (DECIMAL(12,2))
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

#### 2. `company_contacts` - Contactos de Empresa
```sql
- id (BIGSERIAL PRIMARY KEY)
- company_id (BIGINT REFERENCES companies)
- name (VARCHAR(255))
- email (VARCHAR(255))
- phone (VARCHAR(50))
- position (VARCHAR(100))
- can_make_reservations (BOOLEAN)
- can_authorize_expenses (BOOLEAN)
- spending_limit (DECIMAL(10,2))
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

#### 3. `rooms` - Habitaciones
```sql
- id (BIGSERIAL PRIMARY KEY)
- number (VARCHAR(10) UNIQUE)
- type (VARCHAR(100))
- capacity (INTEGER)
- floor (INTEGER)
- amenities (TEXT)
- price_per_night (DECIMAL(10,2))
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

#### 4. `spa_products` - Productos del Spa
```sql
- id (BIGSERIAL PRIMARY KEY)
- name (VARCHAR(255))
- description (TEXT)
- category (VARCHAR(100))
- type (VARCHAR(50)) -- 'SERVICIO', 'COMBO', 'HOSPEDAJE'
- price (DECIMAL(10,2))
- duration (VARCHAR(50))
- sku (VARCHAR(50) UNIQUE)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

#### 5. `reservations` - Reservas (Tabla Principal)
```sql
- id (BIGSERIAL PRIMARY KEY)
- guest_name, guest_email, guest_phone (VARCHAR)
- check_in, check_out (DATE)
- guests (INTEGER)
- room_id (BIGINT REFERENCES rooms)
- client_type (VARCHAR(20)) -- 'individual', 'corporate'
- contact_id (BIGINT REFERENCES company_contacts)
- company_id (BIGINT REFERENCES companies)
- billing_name, billing_rut, billing_address (VARCHAR/TEXT)
- authorized_by (VARCHAR(255))
- status (VARCHAR(20)) -- 'pending', 'confirmed', 'cancelled', 'completed'
- total_amount, deposit_amount, paid_amount, pending_amount (DECIMAL)
- payment_status (VARCHAR(20)) -- 'no_payment', 'partial', 'paid', 'overdue'
- payment_method (VARCHAR(50))
- created_at, updated_at (TIMESTAMP)
```

#### 6. `reservation_products` - Productos por Reserva
```sql
- id (BIGSERIAL PRIMARY KEY)
- reservation_id (BIGINT REFERENCES reservations)
- product_id (BIGINT REFERENCES spa_products)
- quantity (INTEGER)
- unit_price, total_price (DECIMAL(10,2))
- created_at (TIMESTAMP)
```

#### 7. `reservation_comments` - Comentarios
```sql
- id (BIGSERIAL PRIMARY KEY)
- reservation_id (BIGINT REFERENCES reservations)
- text (TEXT)
- author (VARCHAR(255))
- comment_type (VARCHAR(50)) -- 'general', 'payment', 'service', 'cancellation'
- created_at (TIMESTAMP)
```

#### 8. `payments` - Pagos
```sql
- id (BIGSERIAL PRIMARY KEY)
- reservation_id (BIGINT REFERENCES reservations)
- amount (DECIMAL(10,2))
- method (VARCHAR(50))
- reference (VARCHAR(255))
- notes (TEXT)
- processed_by (VARCHAR(255))
- created_at (TIMESTAMP)
```

## Arquitectura del Sistema

### Estructura de Archivos

```
src/
├── actions/reservations/
│   ├── create.ts          # Crear reservas
│   ├── get.ts            # Obtener datos
│   ├── update.ts         # Actualizar reservas
│   └── index.ts          # Exportaciones
├── components/reservations/
│   ├── ReservationCalendar.tsx    # Componente principal
│   ├── ReservationCard.tsx        # Tarjeta de reserva
│   ├── ReservationStats.tsx       # Estadísticas
│   ├── ReservationFilters.tsx     # Filtros
│   └── ReservationModal.tsx       # Modal de formulario
├── types/
│   └── reservation.ts    # Tipos TypeScript
└── app/dashboard/reservations/
    └── page.tsx          # Página principal
```

### Server Actions

#### Crear Reserva
```typescript
createReservation(formData: FormData)
```
- Valida datos del huésped
- Verifica disponibilidad de habitación
- Crea la reserva y productos asociados
- Agrega comentarios si existen

#### Obtener Datos
```typescript
getReservations(filters?: ReservationFilters)
getRooms(filters?: RoomFilters)
getSpaProducts(filters?: SpaProductFilters)
getCompanies()
getCompanyContacts(companyId: number)
getReservationStats()
getRoomAvailability(checkIn: string, checkOut: string)
```

#### Actualizar Reserva
```typescript
updateReservation(id: number, formData: FormData)
updateReservationStatus(id: number, status: string, comment?: string)
addPayment(reservationId: number, formData: FormData)
addComment(reservationId: number, formData: FormData)
```

## Flujo de Trabajo

### 1. Crear Nueva Reserva
1. Usuario hace clic en "Nueva Reserva"
2. Se abre modal con formulario
3. Usuario selecciona:
   - Datos del huésped
   - Fechas de check-in/check-out
   - Habitación (con verificación de disponibilidad)
   - Tipo de cliente (individual/corporativo)
   - Productos del spa
   - Información de facturación
4. Sistema valida disponibilidad
5. Se crea la reserva con estado "pending"

### 2. Gestión de Estados
- **Pending**: Reserva creada, pendiente de confirmación
- **Confirmed**: Reserva confirmada, habitación bloqueada
- **Cancelled**: Reserva cancelada, habitación liberada
- **Completed**: Estancia completada

### 3. Gestión de Pagos
- **No Payment**: Sin pagos realizados
- **Partial**: Pago parcial realizado
- **Paid**: Pago completo
- **Overdue**: Pago vencido

## Características Técnicas

### Validaciones
- Verificación de disponibilidad de habitaciones
- Validación de fechas (check-out > check-in)
- Validación de datos obligatorios
- Verificación de límites de crédito corporativo

### Seguridad
- Autenticación requerida para todas las operaciones
- Validación de permisos por rol
- Sanitización de datos de entrada
- Logs de auditoría para cambios críticos

### Performance
- Consultas optimizadas con índices
- Paginación para listas grandes
- Caché de datos frecuentemente accedidos
- Lazy loading de componentes

## Instalación y Configuración

### 1. Aplicar Migración
```bash
node scripts/apply-reservations-migration.js
```

### 2. Verificar Tablas
```bash
npx supabase db diff --schema public
```

### 3. Acceder al Sistema
- URL: `http://localhost:3000/dashboard/reservations`
- Dashboard Supabase: `http://localhost:54323`

## Datos de Ejemplo

El sistema incluye datos de ejemplo para:
- 3 empresas con diferentes términos de pago
- 6 habitaciones de diferentes tipos y precios
- 6 productos del spa (servicios y paquetes)
- Contactos autorizados para empresas

## Mantenimiento

### Backup de Datos
- Backup automático diario en Supabase
- Exportación manual disponible
- Logs de auditoría preservados

### Monitoreo
- Métricas de ocupación
- Reportes de ingresos
- Alertas de pagos vencidos
- Estadísticas de cancelaciones

## Próximas Mejoras

### Funcionalidades Planificadas
- [ ] Integración con sistemas de pago externos
- [ ] Notificaciones automáticas por email/SMS
- [ ] Reportes avanzados y analytics
- [ ] API para integración con otros sistemas
- [ ] Aplicación móvil para recepción
- [ ] Sistema de fidelización de clientes

### Optimizaciones Técnicas
- [ ] Implementación de WebSockets para actualizaciones en tiempo real
- [ ] Optimización de consultas complejas
- [ ] Sistema de caché distribuido
- [ ] Mejoras en la interfaz de usuario

## Soporte

Para soporte técnico o consultas sobre el módulo de reservas:
- Revisar logs en Supabase Dashboard
- Verificar estado de las migraciones
- Consultar documentación de API
- Contactar al equipo de desarrollo 