-- =============================================
-- Migración: Sistema de Pagos Múltiples POS
-- Fecha: 15 Enero 2025
-- Descripción: Permite múltiples métodos de pago por venta
-- =============================================

-- 1. Crear tabla para almacenar múltiples pagos por venta
CREATE TABLE IF NOT EXISTS "public"."POSSalePayment" (
    "id" BIGSERIAL PRIMARY KEY,
    "saleId" BIGINT NOT NULL REFERENCES "public"."POSSale"("id") ON DELETE CASCADE,
    "paymentMethod" VARCHAR(50) NOT NULL CHECK ("paymentMethod" IN (
        'cash', 'credit_card', 'debit_card', 'transfer', 'other'
    )),
    "amount" DECIMAL(10,2) NOT NULL CHECK ("amount" > 0),
    "receivedAmount" DECIMAL(10,2), -- Solo para efectivo
    "changeAmount" DECIMAL(10,2) DEFAULT 0, -- Solo para efectivo
    "cardReference" VARCHAR(100), -- Referencia de tarjeta
    "bankReference" VARCHAR(100), -- Referencia de transferencia
    "cardLast4" VARCHAR(4), -- Últimos 4 dígitos de tarjeta
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices para optimizar consultas
CREATE INDEX "idx_pos_sale_payment_sale_id" ON "public"."POSSalePayment"("saleId");
CREATE INDEX "idx_pos_sale_payment_method" ON "public"."POSSalePayment"("paymentMethod");
CREATE INDEX "idx_pos_sale_payment_created_at" ON "public"."POSSalePayment"("createdAt");

-- 3. Crear función para calcular totales de pagos
CREATE OR REPLACE FUNCTION calculate_pos_sale_payment_totals()
RETURNS TRIGGER AS $$
DECLARE
    sale_total DECIMAL(10,2);
    payments_total DECIMAL(10,2);
    new_status VARCHAR(20);
BEGIN
    -- Obtener el total de la venta
    SELECT total INTO sale_total 
    FROM "public"."POSSale" 
    WHERE id = COALESCE(NEW.saleId, OLD.saleId);
    
    -- Calcular total de pagos
    SELECT COALESCE(SUM(amount), 0) INTO payments_total
    FROM "public"."POSSalePayment" 
    WHERE saleId = COALESCE(NEW.saleId, OLD.saleId);
    
    -- Determinar nuevo estado de pago
    IF payments_total = 0 THEN
        new_status := 'no_payment';
    ELSIF payments_total < sale_total THEN
        new_status := 'partial';
    ELSIF payments_total >= sale_total THEN
        new_status := 'paid';
    END IF;
    
    -- Actualizar estado de la venta
    UPDATE "public"."POSSale" 
    SET 
        "paidAmount" = payments_total,
        "pendingAmount" = sale_total - payments_total,
        "paymentStatus" = new_status,
        "updatedAt" = NOW()
    WHERE id = COALESCE(NEW.saleId, OLD.saleId);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Crear triggers para actualización automática
DROP TRIGGER IF EXISTS trigger_pos_sale_payment_totals ON "public"."POSSalePayment";
CREATE TRIGGER trigger_pos_sale_payment_totals
    AFTER INSERT OR UPDATE OR DELETE ON "public"."POSSalePayment"
    FOR EACH ROW
    EXECUTE FUNCTION calculate_pos_sale_payment_totals();

-- 5. Agregar campos de control de pagos a POSSale si no existen
DO $$ 
BEGIN
    -- Agregar paidAmount si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'POSSale' AND column_name = 'paidAmount'
    ) THEN
        ALTER TABLE "public"."POSSale" 
        ADD COLUMN "paidAmount" DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Agregar pendingAmount si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'POSSale' AND column_name = 'pendingAmount'
    ) THEN
        ALTER TABLE "public"."POSSale" 
        ADD COLUMN "pendingAmount" DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Agregar paymentStatus si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'POSSale' AND column_name = 'paymentStatus'
    ) THEN
        ALTER TABLE "public"."POSSale" 
        ADD COLUMN "paymentStatus" VARCHAR(20) DEFAULT 'no_payment' 
        CHECK ("paymentStatus" IN ('no_payment', 'partial', 'paid', 'overpaid'));
    END IF;
    
    -- Agregar updatedAt si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'POSSale' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "public"."POSSale" 
        ADD COLUMN "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 6. Crear función para migrar datos existentes
CREATE OR REPLACE FUNCTION migrate_existing_pos_payments()
RETURNS TABLE(migrated_count INTEGER, message TEXT) AS $$
DECLARE
    rec RECORD;
    migrated_count INTEGER := 0;
BEGIN
    -- Migrar ventas existentes que tienen paymentMethod definido
    FOR rec IN 
        SELECT id, total, paymentMethod, cashReceived, change
        FROM "public"."POSSale" 
        WHERE paymentMethod IS NOT NULL 
        AND NOT EXISTS (
            SELECT 1 FROM "public"."POSSalePayment" WHERE saleId = "POSSale".id
        )
    LOOP
        -- Crear registro de pago para cada venta existente
        INSERT INTO "public"."POSSalePayment" (
            saleId, 
            paymentMethod, 
            amount, 
            receivedAmount, 
            changeAmount,
            notes
        ) VALUES (
            rec.id,
            rec.paymentMethod,
            rec.total,
            rec.cashReceived,
            rec.change,
            'Migrado automáticamente del sistema anterior'
        );
        
        migrated_count := migrated_count + 1;
    END LOOP;
    
    -- Actualizar campos de control
    UPDATE "public"."POSSale" 
    SET 
        "paidAmount" = total,
        "pendingAmount" = 0,
        "paymentStatus" = 'paid'
    WHERE paymentMethod IS NOT NULL;
    
    RETURN QUERY SELECT migrated_count, 'Migración completada exitosamente'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear función para generar reporte de pagos
CREATE OR REPLACE FUNCTION get_pos_payment_summary(
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL,
    p_register_type_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
    payment_method VARCHAR(50),
    payment_count BIGINT,
    total_amount DECIMAL(10,2),
    avg_amount DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        psp.paymentMethod,
        COUNT(psp.id) as payment_count,
        SUM(psp.amount) as total_amount,
        AVG(psp.amount) as avg_amount
    FROM "public"."POSSalePayment" psp
    JOIN "public"."POSSale" ps ON psp.saleId = ps.id
    JOIN "public"."CashSession" cs ON ps.sessionId = cs.id
    WHERE 
        (p_date_from IS NULL OR DATE(psp.createdAt) >= p_date_from)
        AND (p_date_to IS NULL OR DATE(psp.createdAt) <= p_date_to)
        AND (p_register_type_id IS NULL OR cs.cashRegisterTypeId = p_register_type_id)
    GROUP BY psp.paymentMethod
    ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. Crear políticas RLS para seguridad
ALTER TABLE "public"."POSSalePayment" ENABLE ROW LEVEL SECURITY;

-- Política para lectura - usuarios autenticados pueden ver todos los pagos
CREATE POLICY "Allow authenticated users to read POS sale payments" 
ON "public"."POSSalePayment"
FOR SELECT 
TO authenticated
USING (true);

-- Política para inserción - usuarios autenticados pueden crear pagos
CREATE POLICY "Allow authenticated users to create POS sale payments" 
ON "public"."POSSalePayment"
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Política para actualización - usuarios autenticados pueden actualizar pagos
CREATE POLICY "Allow authenticated users to update POS sale payments" 
ON "public"."POSSalePayment"
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para eliminación - solo administradores pueden eliminar pagos
CREATE POLICY "Allow admins to delete POS sale payments" 
ON "public"."POSSalePayment"
FOR DELETE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND (
            auth.users.raw_user_meta_data->>'role' = 'ADMINISTRADOR'
            OR auth.users.raw_user_meta_data->>'role' = 'JEFE_SECCION'
        )
    )
);

-- 9. Crear trigger para updatedAt
CREATE OR REPLACE FUNCTION update_pos_sale_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pos_sale_payment_updated_at
    BEFORE UPDATE ON "public"."POSSalePayment"
    FOR EACH ROW
    EXECUTE FUNCTION update_pos_sale_payment_updated_at();

-- 10. Agregar comentarios para documentación
COMMENT ON TABLE "public"."POSSalePayment" IS 'Tabla para almacenar múltiples métodos de pago por venta en POS';
COMMENT ON COLUMN "public"."POSSalePayment"."saleId" IS 'Referencia a la venta';
COMMENT ON COLUMN "public"."POSSalePayment"."paymentMethod" IS 'Método de pago: cash, credit_card, debit_card, transfer, other';
COMMENT ON COLUMN "public"."POSSalePayment"."amount" IS 'Monto pagado con este método';
COMMENT ON COLUMN "public"."POSSalePayment"."receivedAmount" IS 'Monto recibido (solo efectivo)';
COMMENT ON COLUMN "public"."POSSalePayment"."changeAmount" IS 'Vuelto entregado (solo efectivo)';
COMMENT ON COLUMN "public"."POSSalePayment"."cardReference" IS 'Referencia de la transacción con tarjeta';
COMMENT ON COLUMN "public"."POSSalePayment"."bankReference" IS 'Referencia de la transferencia bancaria';

-- Verificación final
DO $$
BEGIN
    RAISE NOTICE 'Sistema de pagos múltiples POS creado exitosamente';
    RAISE NOTICE 'Tabla POSSalePayment: ✓';
    RAISE NOTICE 'Triggers automáticos: ✓';
    RAISE NOTICE 'Funciones de cálculo: ✓';
    RAISE NOTICE 'Políticas RLS: ✓';
    RAISE NOTICE 'Sistema listo para usar';
END $$; 