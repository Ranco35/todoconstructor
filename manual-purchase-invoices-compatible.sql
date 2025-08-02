-- =====================================================
-- MÓDULO COMPLETO DE FACTURAS DE COMPRAS CON IA
-- COMPATIBLE con esquema existente (PascalCase/camelCase)
-- Para ejecutar directamente en Supabase SQL Editor
-- =====================================================

-- ====================
-- VERIFICAR Y CREAR TABLAS BÁSICAS SI NO EXISTEN
-- ====================

-- Crear tabla de centros de costo si no existe (compatible con Cost_Center)
CREATE TABLE IF NOT EXISTS public."Cost_Center" (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de proveedores si no existe (compatible con Supplier)
CREATE TABLE IF NOT EXISTS public."Supplier" (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    vat VARCHAR(20), -- RUT en Chile
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Chile',
    active BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de categorías si no existe
CREATE TABLE IF NOT EXISTS public."Category" (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de sesiones de caja si no existe
CREATE TABLE IF NOT EXISTS public."CashSession" (
    id BIGSERIAL PRIMARY KEY,
    "sessionDate" DATE NOT NULL DEFAULT CURRENT_DATE,
    "initialAmount" NUMERIC(18,2) DEFAULT 0,
    "finalAmount" NUMERIC(18,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open',
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insertar datos básicos si las tablas están vacías
INSERT INTO "Cost_Center" (name, code, description)
SELECT 'Administración', 'ADMIN', 'Centro de costo administrativo'
WHERE NOT EXISTS (SELECT 1 FROM "Cost_Center" LIMIT 1);

INSERT INTO "Supplier" (name, vat, email, active)
SELECT 'Proveedor de Ejemplo', '12.345.678-9', 'proveedor@ejemplo.cl', true
WHERE NOT EXISTS (SELECT 1 FROM "Supplier" LIMIT 1);

INSERT INTO "Category" (name, description)
SELECT 'General', 'Categoría general para productos'
WHERE NOT EXISTS (SELECT 1 FROM "Category" LIMIT 1);

-- ====================
-- TABLA: PurchaseInvoice (Facturas de Compra)
-- ====================
CREATE TABLE IF NOT EXISTS public."PurchaseInvoice" (
    id BIGSERIAL PRIMARY KEY,
    "invoiceNumber" VARCHAR(100) NOT NULL,
    "supplierId" BIGINT REFERENCES "Supplier"(id) ON DELETE RESTRICT,
    "invoiceDate" DATE NOT NULL,
    "dueDate" DATE,
    currency VARCHAR(8) NOT NULL DEFAULT 'CLP',
    
    -- Montos
    subtotal NUMERIC(18,2) NOT NULL DEFAULT 0,
    "taxAmount" NUMERIC(18,2) NOT NULL DEFAULT 0,
    "totalAmount" NUMERIC(18,2) NOT NULL DEFAULT 0,
    
    -- Estados
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, approved, paid, disputed, cancelled
    "paymentStatus" VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, partial, paid
    
    -- Archivos y procesamiento
    "pdfFilePath" TEXT, -- Ruta del archivo PDF original
    "pdfFileName" VARCHAR(255), -- Nombre original del archivo
    "pdfFileSize" INTEGER, -- Tamaño en bytes
    
    -- Datos extraídos por IA
    "extractedData" JSONB, -- Información completa extraída del PDF
    "extractionConfidence" NUMERIC(3,2), -- Confianza de 0.00 a 1.00
    "manualReviewRequired" BOOLEAN DEFAULT false,
    
    -- Notas y observaciones
    notes TEXT,
    "internalNotes" TEXT, -- Notas internas no visibles al proveedor
    
    -- Metadatos
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "createdBy" UUID REFERENCES auth.users(id),
    "approvedBy" UUID REFERENCES auth.users(id),
    "approvedAt" TIMESTAMP WITH TIME ZONE,
    
    -- Índice único
    UNIQUE("supplierId", "invoiceNumber")
);

-- ====================
-- TABLA: PurchaseInvoiceLine (Líneas de Factura)
-- ====================
CREATE TABLE IF NOT EXISTS public."PurchaseInvoiceLine" (
    id BIGSERIAL PRIMARY KEY,
    "purchaseInvoiceId" BIGINT REFERENCES "PurchaseInvoice"(id) ON DELETE CASCADE,
    
    -- Información del producto/servicio
    "productId" BIGINT REFERENCES "Product"(id), -- Opcional: vinculación con producto existente
    description TEXT NOT NULL,
    "productCode" VARCHAR(100), -- Código del proveedor
    
    -- Cantidades y precios
    quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
    "unitPrice" NUMERIC(18,2) NOT NULL DEFAULT 0,
    "discountPercent" NUMERIC(5,2) DEFAULT 0,
    "discountAmount" NUMERIC(18,2) DEFAULT 0,
    
    -- Impuestos
    "taxRate" NUMERIC(5,2) DEFAULT 19.00, -- IVA por defecto 19%
    "taxAmount" NUMERIC(18,2) DEFAULT 0,
    "lineTotal" NUMERIC(18,2) NOT NULL DEFAULT 0,
    
    -- Centro de costo
    "costCenterId" BIGINT REFERENCES "Cost_Center"(id),
    
    -- Orden de líneas
    "lineOrder" INTEGER DEFAULT 1,
    
    -- Metadatos
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ====================
-- TABLA: PurchaseInvoicePayment (Pagos de Factura)
-- ====================
CREATE TABLE IF NOT EXISTS public."PurchaseInvoicePayment" (
    id BIGSERIAL PRIMARY KEY,
    "purchaseInvoiceId" BIGINT REFERENCES "PurchaseInvoice"(id) ON DELETE CASCADE,
    
    -- Información del pago
    "paymentDate" DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(18,2) NOT NULL,
    "paymentMethod" VARCHAR(50) NOT NULL, -- cash, transfer, check, credit
    reference VARCHAR(100), -- Número de transferencia, cheque, etc.
    
    -- Relación con caja chica si aplica
    "cashSessionId" BIGINT REFERENCES "CashSession"(id),
    
    -- Notas del pago
    notes TEXT,
    
    -- Metadatos
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "createdBy" UUID REFERENCES auth.users(id)
);

-- ====================
-- TABLA: PDFExtractionLog (Log de Extracción PDF)
-- ====================
CREATE TABLE IF NOT EXISTS public."PDFExtractionLog" (
    id BIGSERIAL PRIMARY KEY,
    "purchaseInvoiceId" BIGINT REFERENCES "PurchaseInvoice"(id) ON DELETE CASCADE,
    
    -- Información del procesamiento
    "extractionMethod" VARCHAR(50) NOT NULL, -- 'chatgpt', 'ocr', 'manual'
    "rawText" TEXT, -- Texto extraído del PDF
    "chatgptPrompt" TEXT, -- Prompt usado para ChatGPT
    "chatgptResponse" JSONB, -- Respuesta completa de ChatGPT
    
    -- Métricas
    "processingTimeMs" INTEGER,
    "tokensUsed" INTEGER,
    "confidenceScore" NUMERIC(3,2),
    
    -- Errores
    "errorMessage" TEXT,
    success BOOLEAN DEFAULT true,
    
    -- Metadatos
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "createdBy" UUID REFERENCES auth.users(id)
);

-- ====================
-- ÍNDICES
-- ====================
CREATE INDEX IF NOT EXISTS "idx_PurchaseInvoice_supplierId" ON "PurchaseInvoice"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_PurchaseInvoice_status" ON "PurchaseInvoice"(status);
CREATE INDEX IF NOT EXISTS "idx_PurchaseInvoice_invoiceDate" ON "PurchaseInvoice"("invoiceDate");
CREATE INDEX IF NOT EXISTS "idx_PurchaseInvoice_dueDate" ON "PurchaseInvoice"("dueDate");
CREATE INDEX IF NOT EXISTS "idx_PurchaseInvoiceLine_purchaseInvoiceId" ON "PurchaseInvoiceLine"("purchaseInvoiceId");
CREATE INDEX IF NOT EXISTS "idx_PurchaseInvoiceLine_productId" ON "PurchaseInvoiceLine"("productId");
CREATE INDEX IF NOT EXISTS "idx_PurchaseInvoicePayment_purchaseInvoiceId" ON "PurchaseInvoicePayment"("purchaseInvoiceId");
CREATE INDEX IF NOT EXISTS "idx_PDFExtractionLog_purchaseInvoiceId" ON "PDFExtractionLog"("purchaseInvoiceId");

-- Índices para tablas básicas
CREATE INDEX IF NOT EXISTS "idx_Product_active" ON "Product"(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS "idx_Supplier_active" ON "Supplier"(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS "idx_Cost_Center_active" ON "Cost_Center"(active) WHERE active = true;

-- ====================
-- TRIGGERS PARA UPDATED_AT
-- ====================
CREATE OR REPLACE FUNCTION "updateUpdatedAtColumn"()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers a tablas principales
DROP TRIGGER IF EXISTS "updatePurchaseInvoiceUpdatedAt" ON "PurchaseInvoice";
CREATE TRIGGER "updatePurchaseInvoiceUpdatedAt" 
    BEFORE UPDATE ON "PurchaseInvoice" 
    FOR EACH ROW EXECUTE FUNCTION "updateUpdatedAtColumn"();

DROP TRIGGER IF EXISTS "updateSupplierUpdatedAt" ON "Supplier";
CREATE TRIGGER "updateSupplierUpdatedAt" 
    BEFORE UPDATE ON "Supplier" 
    FOR EACH ROW EXECUTE FUNCTION "updateUpdatedAtColumn"();

DROP TRIGGER IF EXISTS "updateCostCenterUpdatedAt" ON "Cost_Center";
CREATE TRIGGER "updateCostCenterUpdatedAt" 
    BEFORE UPDATE ON "Cost_Center" 
    FOR EACH ROW EXECUTE FUNCTION "updateUpdatedAtColumn"();

-- ====================
-- RLS POLICIES
-- ====================
ALTER TABLE "PurchaseInvoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PurchaseInvoiceLine" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PurchaseInvoicePayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PDFExtractionLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cost_Center" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CashSession" ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view purchase invoices" ON "PurchaseInvoice";
DROP POLICY IF EXISTS "Users can create purchase invoices" ON "PurchaseInvoice";
DROP POLICY IF EXISTS "Users can update purchase invoices" ON "PurchaseInvoice";
DROP POLICY IF EXISTS "Users can view purchase invoice lines" ON "PurchaseInvoiceLine";
DROP POLICY IF EXISTS "Users can view purchase invoice payments" ON "PurchaseInvoicePayment";
DROP POLICY IF EXISTS "Users can view pdf extraction logs" ON "PDFExtractionLog";
DROP POLICY IF EXISTS "Users can access suppliers" ON "Supplier";
DROP POLICY IF EXISTS "Users can access cost centers" ON "Cost_Center";
DROP POLICY IF EXISTS "Users can access cash sessions" ON "CashSession";

-- Crear políticas para facturas
CREATE POLICY "Users can view purchase invoices" ON "PurchaseInvoice"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create purchase invoices" ON "PurchaseInvoice"
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update purchase invoices" ON "PurchaseInvoice"
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view purchase invoice lines" ON "PurchaseInvoiceLine"
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view purchase invoice payments" ON "PurchaseInvoicePayment"
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view pdf extraction logs" ON "PDFExtractionLog"
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para tablas básicas
CREATE POLICY "Users can access suppliers" ON "Supplier"
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can access cost centers" ON "Cost_Center"
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can access cash sessions" ON "CashSession"
    FOR ALL USING (auth.role() = 'authenticated');

-- ====================
-- FUNCIONES AUXILIARES
-- ====================

-- Función para calcular totales automáticamente
CREATE OR REPLACE FUNCTION "calculatePurchaseInvoiceTotals"("invoiceId" BIGINT)
RETURNS JSON AS $$
DECLARE
    result JSON;
    "subtotalCalc" NUMERIC(18,2) := 0;
    "taxCalc" NUMERIC(18,2) := 0;
    "totalCalc" NUMERIC(18,2) := 0;
BEGIN
    -- Calcular totales desde las líneas
    SELECT 
        COALESCE(SUM("lineTotal" - "taxAmount"), 0),
        COALESCE(SUM("taxAmount"), 0),
        COALESCE(SUM("lineTotal"), 0)
    INTO "subtotalCalc", "taxCalc", "totalCalc"
    FROM "PurchaseInvoiceLine"
    WHERE "purchaseInvoiceId" = "invoiceId";
    
    -- Actualizar la factura
    UPDATE "PurchaseInvoice" 
    SET 
        subtotal = "subtotalCalc",
        "taxAmount" = "taxCalc",
        "totalAmount" = "totalCalc",
        "updatedAt" = now()
    WHERE id = "invoiceId";
    
    -- Retornar resultado
    SELECT json_build_object(
        'subtotal', "subtotalCalc",
        'taxAmount', "taxCalc",
        'totalAmount', "totalCalc"
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular totales cuando se modifican líneas
CREATE OR REPLACE FUNCTION "recalculateInvoiceTotals"()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular tanto para INSERT, UPDATE como DELETE
    IF TG_OP = 'DELETE' THEN
        PERFORM "calculatePurchaseInvoiceTotals"(OLD."purchaseInvoiceId");
        RETURN OLD;
    ELSE
        PERFORM "calculatePurchaseInvoiceTotals"(NEW."purchaseInvoiceId");
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "recalculatePurchaseInvoiceTotals" ON "PurchaseInvoiceLine";
CREATE TRIGGER "recalculatePurchaseInvoiceTotals"
    AFTER INSERT OR UPDATE OR DELETE ON "PurchaseInvoiceLine"
    FOR EACH ROW EXECUTE FUNCTION "recalculateInvoiceTotals"();

-- ====================
-- DATOS DE EJEMPLO
-- ====================

-- Insertar centros de costo adicionales
INSERT INTO "Cost_Center" (name, code, description)
VALUES 
    ('Recepción', 'RECEP', 'Área de recepción y atención al cliente'),
    ('Restaurante', 'REST', 'Área de restaurante y cocina'),
    ('Spa', 'SPA', 'Área de spa y tratamientos'),
    ('Mantenimiento', 'MANT', 'Área de mantenimiento general'),
    ('Marketing', 'MKT', 'Área de marketing y publicidad')
ON CONFLICT (code) DO NOTHING;

-- Insertar proveedores adicionales
INSERT INTO "Supplier" (name, vat, email, phone, city, active)
VALUES 
    ('Distribuidora Papelería Central', '96.789.123-4', 'ventas@papeleriacentral.cl', '+56912345678', 'Santiago', true),
    ('Servicios de Limpieza ProClean', '78.456.789-1', 'contacto@proclean.cl', '+56987654321', 'Temuco', true),
    ('Tecnología y Oficina Ltda.', '85.123.456-7', 'info@tecnooficina.cl', '+56945678912', 'Valdivia', true),
    ('Mantenimiento Integral Sur', '92.345.678-9', 'servicios@mantesur.cl', '+56923456789', 'Pucón', true)
ON CONFLICT (vat) DO NOTHING;

-- Insertar categorías adicionales
INSERT INTO "Category" (name, description)
VALUES 
    ('Oficina', 'Productos de oficina y papelería'),
    ('Limpieza', 'Productos de limpieza e higiene'),
    ('Mantenimiento', 'Servicios y productos de mantenimiento'),
    ('Tecnología', 'Equipos y servicios tecnológicos')
ON CONFLICT (name) DO NOTHING;

-- Insertar factura de ejemplo usando el primer proveedor disponible
INSERT INTO "PurchaseInvoice" (
    "invoiceNumber", 
    "supplierId", 
    "invoiceDate", 
    subtotal, 
    "taxAmount", 
    "totalAmount",
    status,
    notes
) 
SELECT 
    'FACT-DEMO-001',
    s.id,
    CURRENT_DATE,
    84034.00,
    15966.00,
    100000.00,
    'draft',
    'Factura de ejemplo - Compra de materiales de oficina con IA'
FROM "Supplier" s 
WHERE s.active = true 
LIMIT 1
ON CONFLICT ("supplierId", "invoiceNumber") DO NOTHING;

-- ====================
-- COMENTARIOS TÉCNICOS
-- ====================
COMMENT ON TABLE "PurchaseInvoice" IS 'Facturas de compras a proveedores con análisis automático por IA';
COMMENT ON COLUMN "PurchaseInvoice"."extractedData" IS 'Datos JSON extraídos automáticamente del PDF por ChatGPT';
COMMENT ON COLUMN "PurchaseInvoice"."extractionConfidence" IS 'Nivel de confianza de la extracción automática (0.00-1.00)';
COMMENT ON TABLE "PDFExtractionLog" IS 'Log completo del procesamiento de PDFs por IA';
COMMENT ON TABLE "Supplier" IS 'Proveedores para el sistema de facturas de compra';
COMMENT ON TABLE "Cost_Center" IS 'Centros de costo para categorizar gastos';

-- ====================
-- VERIFICACIÓN FINAL
-- ====================
DO $$
DECLARE
    tables_created INTEGER := 0;
    example_invoices INTEGER := 0;
    example_suppliers INTEGER := 0;
    products_count INTEGER := 0;
BEGIN
    -- Contar tablas creadas
    SELECT COUNT(*) INTO tables_created
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('PurchaseInvoice', 'PurchaseInvoiceLine', 'PDFExtractionLog', 'Product', 'Supplier');
    
    -- Contar datos de ejemplo
    SELECT COUNT(*) INTO example_invoices FROM "PurchaseInvoice" WHERE "invoiceNumber" LIKE 'FACT-DEMO-%';
    SELECT COUNT(*) INTO example_suppliers FROM "Supplier" WHERE active = true;
    
    -- Contar productos existentes
    SELECT COUNT(*) INTO products_count FROM "Product" WHERE name IS NOT NULL;
    
    RAISE NOTICE '🎉 MÓDULO DE FACTURAS DE COMPRAS CON IA INSTALADO EXITOSAMENTE';
    RAISE NOTICE '✅ Tablas creadas: % de 5', tables_created;
    RAISE NOTICE '✅ Proveedores disponibles: %', example_suppliers;
    RAISE NOTICE '✅ Facturas de ejemplo: %', example_invoices;
    RAISE NOTICE '✅ Productos existentes: %', products_count;
    RAISE NOTICE '';
    RAISE NOTICE '📄 Funcionalidades disponibles:';
    RAISE NOTICE '   • Procesamiento automático de PDFs con ChatGPT';
    RAISE NOTICE '   • Extracción inteligente de datos de facturas chilenas';
    RAISE NOTICE '   • Gestión completa de facturas de compras';
    RAISE NOTICE '   • Sistema de borradores con revisión manual';
    RAISE NOTICE '   • Integración con productos y proveedores existentes';
    RAISE NOTICE '   • Logging completo de procesamiento IA';
    RAISE NOTICE '   • Compatible con estructura PascalCase/camelCase';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Próximo paso: Ir a /dashboard/purchases para probar el sistema';
    RAISE NOTICE '📝 El sistema está integrado con tu catálogo de productos existente';
    
    IF tables_created < 4 THEN
        RAISE WARNING '⚠️  Algunas tablas no se crearon correctamente. Revisa los errores arriba.';
    END IF;
END
$$; 