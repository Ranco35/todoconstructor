-- =============================================
-- Migración: Agregar clientId a POSSale
-- Fecha: 15 Enero 2025
-- Descripción: Permite asociar ventas POS con clientes
-- =============================================

-- 1. Agregar campo clientId a la tabla POSSale
DO $$ 
BEGIN
    -- Agregar clientId si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'POSSale' AND column_name = 'clientId'
    ) THEN
        ALTER TABLE "public"."POSSale" 
        ADD COLUMN "clientId" BIGINT;
        
        RAISE NOTICE 'Campo clientId agregado a POSSale';
    ELSE
        RAISE NOTICE 'Campo clientId ya existe en POSSale';
    END IF;
END $$;

-- 2. Agregar restricción de clave foránea
DO $$
BEGIN
    -- Verificar si la restricción ya existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'POSSale_clientId_fkey'
    ) THEN
        ALTER TABLE "public"."POSSale" 
        ADD CONSTRAINT "POSSale_clientId_fkey" 
        FOREIGN KEY ("clientId") 
        REFERENCES "public"."Client"("id")
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Restricción de clave foránea agregada';
    ELSE
        RAISE NOTICE 'Restricción de clave foránea ya existe';
    END IF;
END $$;

-- 3. Crear índice para optimizar consultas por cliente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_pos_sale_client_id'
    ) THEN
        CREATE INDEX "idx_pos_sale_client_id" 
        ON "public"."POSSale"("clientId");
        
        RAISE NOTICE 'Índice idx_pos_sale_client_id creado';
    ELSE
        RAISE NOTICE 'Índice idx_pos_sale_client_id ya existe';
    END IF;
END $$;

-- 4. Crear índice compuesto para consultas por cliente y fecha
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_pos_sale_client_date'
    ) THEN
        CREATE INDEX "idx_pos_sale_client_date" 
        ON "public"."POSSale"("clientId", "createdAt")
        WHERE "clientId" IS NOT NULL;
        
        RAISE NOTICE 'Índice compuesto cliente-fecha creado';
    ELSE
        RAISE NOTICE 'Índice compuesto cliente-fecha ya existe';
    END IF;
END $$;

-- 5. Agregar comentarios descriptivos
COMMENT ON COLUMN "public"."POSSale"."clientId" IS 'ID del cliente asociado a la venta (opcional)';

-- 6. Crear función para obtener historial de ventas por cliente
CREATE OR REPLACE FUNCTION get_client_pos_sales_history(
    p_client_id BIGINT,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
    sale_id BIGINT,
    sale_number TEXT,
    sale_date TIMESTAMP WITH TIME ZONE,
    customer_name TEXT,
    table_number TEXT,
    room_number TEXT,
    subtotal DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    total DECIMAL(10,2),
    payment_status VARCHAR(20),
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.id,
        ps.saleNumber,
        ps.createdAt,
        ps.customerName,
        ps.tableNumber,
        ps.roomNumber,
        ps.subtotal,
        ps.discountAmount,
        ps.taxAmount,
        ps.total,
        ps.paymentStatus,
        ps.notes
    FROM "public"."POSSale" ps
    WHERE 
        ps.clientId = p_client_id
        AND (p_date_from IS NULL OR DATE(ps.createdAt) >= p_date_from)
        AND (p_date_to IS NULL OR DATE(ps.createdAt) <= p_date_to)
    ORDER BY ps.createdAt DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear función para obtener estadísticas de ventas por cliente
CREATE OR REPLACE FUNCTION get_client_pos_sales_stats(
    p_client_id BIGINT
)
RETURNS TABLE(
    total_sales BIGINT,
    total_amount DECIMAL(10,2),
    avg_sale_amount DECIMAL(10,2),
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    favorite_table TEXT,
    total_visits_with_room BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(ps.id) as total_sales,
        COALESCE(SUM(ps.total), 0) as total_amount,
        COALESCE(AVG(ps.total), 0) as avg_sale_amount,
        MAX(ps.createdAt) as last_purchase_date,
        MODE() WITHIN GROUP (ORDER BY ps.tableNumber) as favorite_table,
        COUNT(ps.id) FILTER (WHERE ps.roomNumber IS NOT NULL) as total_visits_with_room
    FROM "public"."POSSale" ps
    WHERE ps.clientId = p_client_id
    AND ps.paymentStatus = 'paid';
END;
$$ LANGUAGE plpgsql;

-- Verificación final
DO $$
BEGIN
    RAISE NOTICE '=== MIGRACIÓN COMPLETADA ===';
    RAISE NOTICE 'Campo clientId agregado a POSSale: ✓';
    RAISE NOTICE 'Restricción de clave foránea: ✓';
    RAISE NOTICE 'Índices de optimización: ✓';
    RAISE NOTICE 'Funciones de consulta: ✓';
    RAISE NOTICE 'Las ventas POS ahora se pueden asociar con clientes';
END $$; 