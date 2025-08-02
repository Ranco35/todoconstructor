-- Trigger para registrar ventas automáticamente
-- Fecha: 2025-01-12
-- Descripción: Registra automáticamente cada producto vendido en sales_tracking

-- Función que se ejecutará en el trigger
CREATE OR REPLACE FUNCTION track_reservation_product_sales()
RETURNS TRIGGER AS $$
DECLARE
    reservation_data RECORD;
    product_data RECORD;
    category_data RECORD;
BEGIN
    -- Obtener datos de la reserva
    SELECT r.*, c.nombrePrincipal as client_name
    INTO reservation_data
    FROM reservations r
    LEFT JOIN "Client" c ON r.client_id = c.id
    WHERE r.id = NEW.reservation_id;

    -- Si es producto modular
    IF NEW.product_type = 'modular_product' AND NEW.modular_product_id IS NOT NULL THEN
        -- Obtener datos del producto modular
        SELECT pm.*, 'Modular' as product_type_name
        INTO product_data
        FROM products_modular pm
        WHERE pm.id = NEW.modular_product_id;

        -- Registrar en sales_tracking
        INSERT INTO sales_tracking (
            product_id,
            product_name,
            product_sku,
            category_id,
            category_name,
            quantity,
            unit_price,
            total_price,
            sale_type,
            package_name,
            reservation_id,
            created_at,
            updated_at
        ) VALUES (
            NEW.modular_product_id,
            COALESCE(product_data.name, 'Producto Modular'),
            COALESCE(product_data.sku, 'MOD-' || NEW.modular_product_id),
            COALESCE(product_data.id, 0), -- Usar el ID del producto como categoría
            COALESCE(product_data.category, 'modular'),
            NEW.quantity,
            NEW.unit_price,
            NEW.total_price,
            'reservation_modular',
            CASE 
                WHEN product_data.category = 'alojamiento' THEN 'Alojamiento'
                ELSE 'Servicios Adicionales'
            END,
            NEW.reservation_id,
            NOW(),
            NOW()
        );

    -- Si es producto spa/tradicional
    ELSIF NEW.product_type = 'spa_product' AND NEW.product_id IS NOT NULL THEN
        -- Obtener datos del producto spa
        SELECT sp.*, 'Spa' as product_type_name
        INTO product_data
        FROM spa_products sp
        WHERE sp.id = NEW.product_id;

        -- Registrar en sales_tracking
        INSERT INTO sales_tracking (
            product_id,
            product_name,
            product_sku,
            category_id,
            category_name,
            quantity,
            unit_price,
            total_price,
            sale_type,
            package_name,
            reservation_id,
            created_at,
            updated_at
        ) VALUES (
            NEW.product_id,
            COALESCE(product_data.name, 'Producto Spa'),
            COALESCE(product_data.sku, 'SPA-' || NEW.product_id),
            COALESCE(product_data.category_id, 0),
            COALESCE('spa', 'spa'),
            NEW.quantity,
            NEW.unit_price,
            NEW.total_price,
            'reservation_spa',
            'Servicios Spa',
            NEW.reservation_id,
            NOW(),
            NOW()
        );
    END IF;

    -- También registrar en product_sales_tracking para compatibilidad
    IF NEW.product_type = 'modular_product' AND NEW.modular_product_id IS NOT NULL THEN
        INSERT INTO product_sales_tracking (
            product_id,
            sale_date,
            sale_type,
            quantity,
            unit_price,
            total_amount,
            customer_info,
            reservation_id,
            notes,
            created_at,
            updated_at
        ) VALUES (
            NEW.modular_product_id,
            COALESCE(reservation_data.check_in::date, CURRENT_DATE),
            'reservation',
            NEW.quantity,
            NEW.unit_price,
            NEW.total_price,
            jsonb_build_object(
                'client_name', COALESCE(reservation_data.client_name, reservation_data.guest_name),
                'guest_name', reservation_data.guest_name,
                'guest_email', reservation_data.guest_email
            ),
            NEW.reservation_id,
            'Venta automática desde reserva ID: ' || NEW.reservation_id,
            NOW(),
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_track_reservation_sales ON reservation_products;
CREATE TRIGGER trigger_track_reservation_sales
    AFTER INSERT ON reservation_products
    FOR EACH ROW
    EXECUTE FUNCTION track_reservation_product_sales();

-- Comentario sobre el trigger
COMMENT ON TRIGGER trigger_track_reservation_sales ON reservation_products IS 
'Registra automáticamente las ventas en sales_tracking cuando se agregan productos a una reserva';

-- Procesar reservas existentes (opcional, ejecutar solo una vez)
-- IMPORTANTE: Comentado para evitar duplicados en producción
/*
INSERT INTO sales_tracking (
    product_id, product_name, product_sku, category_id, category_name,
    quantity, unit_price, total_price, sale_type, package_name,
    reservation_id, created_at, updated_at
)
SELECT 
    COALESCE(rp.modular_product_id, rp.product_id) as product_id,
    COALESCE(pm.name, sp.name, 'Producto') as product_name,
    COALESCE(pm.sku, sp.sku, 'SKU-' || rp.id) as product_sku,
    COALESCE(pm.id, sp.category_id, 0) as category_id,
    COALESCE(pm.category, 'spa') as category_name,
    rp.quantity,
    rp.unit_price,
    rp.total_price,
    CASE 
        WHEN rp.product_type = 'modular_product' THEN 'reservation_modular'
        ELSE 'reservation_spa'
    END as sale_type,
    CASE 
        WHEN pm.category = 'alojamiento' THEN 'Alojamiento'
        WHEN rp.product_type = 'modular_product' THEN 'Servicios Modulares'
        ELSE 'Servicios Spa'
    END as package_name,
    rp.reservation_id,
    r.created_at,
    r.updated_at
FROM reservation_products rp
INNER JOIN reservations r ON rp.reservation_id = r.id
LEFT JOIN products_modular pm ON rp.modular_product_id = pm.id
LEFT JOIN spa_products sp ON rp.product_id = sp.id
WHERE NOT EXISTS (
    SELECT 1 FROM sales_tracking st 
    WHERE st.reservation_id = rp.reservation_id 
    AND st.product_id = COALESCE(rp.modular_product_id, rp.product_id)
);
*/ 