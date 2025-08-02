-- =======================================================
-- VISTA UNIFICADA DE RESERVAS - ELIMINACIÓN DE IDs CONFUSOS
-- =======================================================
-- Esta vista resuelve definitivamente el problema de "dos IDs por reserva"
-- usando SIEMPRE el ID de la tabla reservations como identificador único

DROP VIEW IF EXISTS v_unified_reservations;

CREATE VIEW v_unified_reservations AS
SELECT 
    -- 🎯 SIEMPRE USAR ID DE TABLA PRINCIPAL
    r.id as reservation_id,
    
    -- 📊 DATOS DE RESERVA PRINCIPAL
    r.guest_name,
    r.guest_email,
    r.guest_phone,
    r.client_id,
    r.check_in,
    r.check_out,
    r.status,
    r.total_amount,
    r.paid_amount,
    r.payment_status,
    r.created_at,
    r.updated_at,
    
    -- 📋 DATOS DEL CLIENTE
    c.nombre as client_full_name,
    c.rut as client_rut,
    c.email as client_email,
    
    -- 🏨 DATOS MODULARES (SI EXISTEN)
    mr.id as modular_internal_id,        -- Solo para referencia interna
    mr.room_code,
    mr.package_modular_id,
    mr.adults,
    mr.children,
    mr.grand_total as modular_total,
    mr.final_price as modular_final_price,
    
    -- 📦 DATOS DEL PAQUETE
    pm.name as package_name,
    pm.code as package_code,
    
    -- 🏠 DATOS DE HABITACIÓN  
    rm.number as room_number,
    rm.type as room_type,
    
    -- 🎯 CAMPOS UNIFICADOS CALCULADOS
    COALESCE(mr.final_price, mr.grand_total, r.total_amount) as unified_total,
    CASE 
        WHEN c.nombre IS NOT NULL THEN c.nombre
        ELSE r.guest_name 
    END as unified_guest_name,
    
    -- 📊 METADATOS
    'unified_view' as source_table,
    CASE 
        WHEN mr.id IS NOT NULL THEN 'modular'
        ELSE 'simple' 
    END as reservation_type
    
FROM reservations r
    LEFT JOIN clients c ON r.client_id = c.id
    LEFT JOIN modular_reservations mr ON r.id = mr.reservation_id
    LEFT JOIN packages_modular pm ON mr.package_modular_id = pm.id
    LEFT JOIN rooms rm ON mr.room_code = CONCAT('habitacion_', rm.number)
        OR mr.room_code = rm.number::text;

-- =======================================================
-- POLÍTICAS DE SEGURIDAD (HEREDAR DE TABLAS BASE)
-- =======================================================
ALTER VIEW v_unified_reservations OWNER TO postgres;

-- =======================================================
-- ÍNDICES PARA PERFORMANCE
-- =======================================================
-- Nota: Las vistas no pueden tener índices directos,
-- pero las tablas base ya los tienen

-- =======================================================
-- COMENTARIOS EXPLICATIVOS
-- =======================================================
COMMENT ON VIEW v_unified_reservations IS 
'Vista unificada que resuelve el problema de IDs confusos.
SIEMPRE usa r.id (reservation_id) como identificador único.
Combina datos de reservations + modular_reservations + clientes.
Elimina la confusión entre ID principal vs ID modular.';

-- =======================================================
-- VERIFICACIÓN DE LA VISTA
-- =======================================================
SELECT 
    'VISTA CREADA EXITOSAMENTE' as status,
    COUNT(*) as total_reservations
FROM v_unified_reservations;

-- =======================================================
-- EJEMPLO DE USO
-- =======================================================
-- En lugar de manejar dos IDs confusos, ahora siempre usamos:
-- SELECT * FROM v_unified_reservations WHERE reservation_id = 64;
-- Esto SIEMPRE devuelve Karen Alejandra, nunca Victor Vilo

SELECT 
    reservation_id,
    unified_guest_name,
    client_full_name,
    package_name,
    room_code,
    check_in,
    check_out,
    unified_total
FROM v_unified_reservations 
WHERE reservation_id IN (64, 83)
ORDER BY reservation_id; 