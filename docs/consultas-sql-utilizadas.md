# 🔧 Consultas SQL Utilizadas en el Análisis

## 📋 Índice de Consultas

### 1. [Consultas Básicas](#consultas-básicas)
### 2. [Análisis de Usuario vs Huésped](#análisis-de-usuario-vs-huésped)
### 3. [Análisis de Cliente](#análisis-de-cliente)
### 4. [Estadísticas Generales](#estadísticas-generales)
### 5. [Consultas Específicas Reserva 26](#consultas-específicas-reserva-26)

---

## 🔍 Consultas Básicas

### 1.1 Consulta Básica de Reserva
```sql
SELECT * FROM reservations WHERE id = 26;
```

### 1.2 Ver Todas las Reservas
```sql
SELECT 
    id,
    guest_name,
    guest_email,
    guest_phone,
    client_id,
    client_type,
    billing_name,
    billing_rut,
    check_in,
    check_out,
    guests,
    status,
    total_amount,
    paid_amount,
    pending_amount,
    payment_status,
    created_at
FROM reservations
ORDER BY created_at DESC
LIMIT 10;
```

### 1.3 Contar Reservas con y sin Cliente
```sql
SELECT 
    COUNT(*) as total_reservas,
    COUNT(client_id) as reservas_con_cliente,
    COUNT(*) - COUNT(client_id) as reservas_sin_cliente
FROM reservations;
```

---

## 👤 Análisis de Usuario vs Huésped

### 2.1 Verificar si el Huésped es Usuario del Sistema
```sql
SELECT 
    r.id,
    r.guest_name,
    r.guest_email,
    u.id as user_id,
    u.email as user_email,
    u.role,
    u.created_at as user_created_at
FROM reservations r
LEFT JOIN auth.users u ON r.guest_email = u.email
WHERE r.id = 26;
```

### 2.2 Comparar Emails de Usuarios vs Huéspedes
```sql
SELECT 
    'USUARIOS DEL SISTEMA' AS 'Tipo',
    COUNT(*) AS 'Cantidad',
    COUNT(DISTINCT email) AS 'Emails Únicos'
FROM auth.users
UNION ALL
SELECT 
    'HUÉSPEDES EN RESERVAS',
    COUNT(*) AS 'Cantidad',
    COUNT(DISTINCT guest_email) AS 'Emails Únicos'
FROM reservations;
```

### 2.3 Encontrar Coincidencias entre Usuarios y Huéspedes
```sql
SELECT 
    u.id AS 'ID Usuario Sistema',
    u.email AS 'Email Usuario Sistema',
    r.id AS 'ID Reserva',
    r.guest_name AS 'Nombre Huésped',
    r.guest_email AS 'Email Huésped',
    r.client_id AS 'ID Cliente',
    r.created_at AS 'Fecha Reserva',
    'COINCIDENCIA EXACTA' AS 'Tipo Coincidencia'
FROM auth.users u
INNER JOIN reservations r ON u.email = r.guest_email
ORDER BY r.created_at DESC
LIMIT 20;
```

---

## 🏢 Análisis de Cliente

### 3.1 Verificar si la Reserva tiene Cliente Asociado
```sql
SELECT 
    r.id as reservation_id,
    r.guest_name,
    r.guest_email,
    r.client_id,
    c."id" as client_table_id,
    c."nombrePrincipal",
    c."apellido",
    c."email" as client_email,
    c."telefono",
    c."tipoCliente",
    CASE 
        WHEN r.client_id IS NOT NULL THEN 'SÍ - Asociado en Reserva'
        WHEN c."id" IS NOT NULL THEN 'SÍ - Existe en Tabla Client'
        ELSE 'NO - No Registrado'
    END as estado_cliente
FROM reservations r
LEFT JOIN "Client" c ON r.guest_email = c."email"
WHERE r.id = 26;
```

### 3.2 Buscar Cliente por Email
```sql
SELECT 
    "id",
    "nombrePrincipal",
    "apellido",
    "email",
    "telefono",
    "tipoCliente",
    "fechaCreacion"
FROM "Client"
WHERE "email" = 'eduardo@termasllifen.cl';
```

### 3.3 Verificar Clientes sin Reservas
```sql
SELECT 
    c."id" AS 'ID Cliente',
    c."nombrePrincipal" AS 'Nombre',
    c."apellido" AS 'Apellido',
    c."email" AS 'Email',
    c."telefono" AS 'Teléfono',
    c."tipoCliente" AS 'Tipo',
    c."fechaCreacion" AS 'Fecha de Creación',
    'SIN RESERVAS' AS 'Estado'
FROM "Client" c
WHERE NOT EXISTS (
    SELECT 1 FROM reservations r WHERE r.client_id = c."id"
)
ORDER BY c."fechaCreacion" DESC
LIMIT 20;
```

---

## 📊 Estadísticas Generales

### 4.1 Resumen Estadístico General
```sql
SELECT 
    'RESUMEN GENERAL' AS 'Métrica',
    COUNT(*) AS 'Valor'
FROM reservations
UNION ALL
SELECT 
    'Reservas con Cliente Asociado',
    COUNT(client_id)
FROM reservations
UNION ALL
SELECT 
    'Reservas Individuales',
    COUNT(*)
FROM reservations
WHERE client_type = 'individual'
UNION ALL
SELECT 
    'Reservas Corporativas',
    COUNT(*)
FROM reservations
WHERE client_type = 'corporate'
UNION ALL
SELECT 
    'Reservas Modulares',
    COUNT(*)
FROM modular_reservations
UNION ALL
SELECT 
    'Total Facturado',
    SUM(total_amount)
FROM reservations
UNION ALL
SELECT 
    'Total Pagado',
    SUM(paid_amount)
FROM reservations
UNION ALL
SELECT 
    'Total Pendiente',
    SUM(pending_amount)
FROM reservations;
```

### 4.2 Análisis de Tipos de Cliente
```sql
SELECT 
    r.client_type AS 'Tipo de Cliente',
    COUNT(*) AS 'Cantidad de Reservas',
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reservations)), 2) AS 'Porcentaje (%)',
    AVG(r.total_amount) AS 'Promedio Monto Total',
    SUM(r.total_amount) AS 'Total Facturado'
FROM reservations r
GROUP BY r.client_type
ORDER BY COUNT(*) DESC;
```

### 4.3 Resumen de Tipos de Usuarios
```sql
SELECT 
    'TOTAL USUARIOS DEL SISTEMA' AS 'Categoría',
    COUNT(*) AS 'Cantidad'
FROM auth.users
UNION ALL
SELECT 
    'USUARIOS QUE HAN HECHO RESERVAS',
    COUNT(DISTINCT u.id)
FROM auth.users u
INNER JOIN reservations r ON u.email = r.guest_email
UNION ALL
SELECT 
    'TOTAL CLIENTES REGISTRADOS',
    COUNT(*)
FROM "Client"
UNION ALL
SELECT 
    'CLIENTES QUE SON USUARIOS',
    COUNT(DISTINCT c."id")
FROM "Client" c
INNER JOIN auth.users u ON c."email" = u.email
UNION ALL
SELECT 
    'TOTAL RESERVAS',
    COUNT(*)
FROM reservations
UNION ALL
SELECT 
    'RESERVAS DE USUARIOS DEL SISTEMA',
    COUNT(*)
FROM reservations r
INNER JOIN auth.users u ON r.guest_email = u.email
UNION ALL
SELECT 
    'RESERVAS DE CLIENTES REGISTRADOS',
    COUNT(*)
FROM reservations r
INNER JOIN "Client" c ON r.guest_email = c."email"
UNION ALL
SELECT 
    'RESERVAS SIN USUARIO NI CLIENTE',
    COUNT(*)
FROM reservations r
LEFT JOIN auth.users u ON r.guest_email = u.email
LEFT JOIN "Client" c ON r.guest_email = c."email"
WHERE u.id IS NULL AND c."id" IS NULL;
```

---

## 🎯 Consultas Específicas Reserva 26

### 5.1 Datos Completos de la Reserva 26
```sql
SELECT 
    id,
    guest_name,
    guest_email,
    guest_phone,
    client_id,
    client_type,
    billing_name,
    billing_rut,
    billing_address,
    authorized_by,
    check_in,
    check_out,
    guests,
    status,
    total_amount,
    paid_amount,
    pending_amount,
    payment_status,
    created_at,
    updated_at
FROM reservations
WHERE id = 26;
```

### 5.2 Verificar Reserva Modular
```sql
SELECT 
    id,
    reservation_id,
    client_id,
    adults,
    children,
    children_ages,
    room_code,
    package_code,
    grand_total,
    nights,
    status,
    created_at
FROM modular_reservations
WHERE reservation_id = 26;
```

### 5.3 Verificar Historial de Pagos
```sql
SELECT 
    id,
    reservation_id,
    amount,
    payment_type,
    payment_method,
    previous_paid_amount,
    new_total_paid,
    remaining_balance,
    total_reservation_amount,
    reference_number,
    processed_by,
    created_at
FROM reservation_payments
WHERE reservation_id = 26
ORDER BY created_at DESC;
```

### 5.4 Comparar Datos de Facturación vs Huésped
```sql
SELECT 
    id,
    guest_name as "Nombre Huésped",
    billing_name as "Nombre Facturación",
    guest_email as "Email Huésped",
    billing_rut as "RUT Facturación",
    CASE 
        WHEN guest_name = billing_name THEN 'IGUAL'
        ELSE 'DIFERENTE'
    END as "Comparación Nombre",
    client_type as "Tipo Cliente",
    authorized_by as "Autorizado por"
FROM reservations
WHERE id = 26;
```

### 5.5 Otras Reservas del Mismo Usuario
```sql
SELECT 
    id,
    guest_name,
    guest_email,
    client_id,
    client_type,
    check_in,
    check_out,
    status,
    total_amount,
    created_at
FROM reservations
WHERE guest_email = 'eduardo@termasllifen.cl'
ORDER BY created_at DESC;
```

---

## 📁 Archivos de Consultas Creados

1. **`scripts/consultas-corregidas.sql`** - Consultas principales corregidas
2. **`scripts/consulta-reserva-26-completa.sql`** - Análisis específico de la reserva 26
3. **`scripts/analisis-final-reserva-26.sql`** - Análisis final completo
4. **`scripts/verificar-datos-reservas.sql`** - Consultas generales de verificación
5. **`scripts/analisis-usuarios-vs-huespedes.sql`** - Análisis comparativo

---

## ⚠️ Notas Importantes

### 🔧 Correcciones Aplicadas
- **Comillas dobles** para columnas con mayúsculas en PostgreSQL
- **Alias corregidos** para evitar errores de sintaxis
- **Consultas optimizadas** para mejor rendimiento

### 📊 Resultados Clave
- **Reserva 26**: Completa con usuario, cliente y reserva modular
- **Integridad**: Todas las relaciones funcionan correctamente
- **Flexibilidad**: Sistema soporta múltiples tipos de reserva

---

**Fecha:** Julio 2025  
**Sistema:** Admin Termas v0.1.0  
**Base de Datos:** Supabase PostgreSQL 