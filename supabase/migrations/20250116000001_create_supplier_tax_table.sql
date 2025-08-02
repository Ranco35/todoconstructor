-- Migración: Tabla de Configuración de Impuestos por Proveedor
-- Fecha: 16 de Enero 2025
-- Propósito: Sistema de gestión de impuestos específicos por proveedor

-- ====================
-- TABLA: SupplierTax
-- ====================
CREATE TABLE IF NOT EXISTS public."SupplierTax" (
    id BIGSERIAL PRIMARY KEY,
    "supplierId" BIGINT NOT NULL REFERENCES "Supplier"(id) ON DELETE CASCADE,
    
    -- Configuración del impuesto
    "taxType" VARCHAR(100) NOT NULL, -- Tipo de impuesto (IVA, IVA_ANTICIPADO_CARNE, etc.)
    "taxRate" NUMERIC(5,2) NOT NULL, -- Porcentaje del impuesto (ej: 19.00 para 19%)
    "taxCode" VARCHAR(50), -- Código fiscal del impuesto
    description TEXT, -- Descripción del impuesto
    
    -- Configuración adicional
    active BOOLEAN NOT NULL DEFAULT true,
    "isRetention" BOOLEAN DEFAULT false, -- Si es una retención
    "appliesToCategory" VARCHAR(100), -- Categoría de producto a la que aplica (opcional)
    
    -- Metadatos
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Restricciones
    CONSTRAINT valid_tax_rate CHECK ("taxRate" >= 0 AND "taxRate" <= 100),
    CONSTRAINT unique_supplier_tax_type UNIQUE ("supplierId", "taxType")
);

-- Índices para optimizar consultas
CREATE INDEX idx_supplier_tax_supplier_id ON public."SupplierTax" ("supplierId");
CREATE INDEX idx_supplier_tax_active ON public."SupplierTax" (active);
CREATE INDEX idx_supplier_tax_type ON public."SupplierTax" ("taxType");

-- Trigger para actualizar updatedAt
CREATE OR REPLACE FUNCTION update_supplier_tax_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_supplier_tax_updated_at
    BEFORE UPDATE ON public."SupplierTax"
    FOR EACH ROW
    EXECUTE FUNCTION update_supplier_tax_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public."SupplierTax" ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "Allow read SupplierTax for authenticated users"
ON public."SupplierTax"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert SupplierTax for admin users"
ON public."SupplierTax"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow update SupplierTax for admin users"
ON public."SupplierTax"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow delete SupplierTax for admin users"
ON public."SupplierTax"
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Permisos para roles
GRANT ALL ON public."SupplierTax" TO authenticated;
GRANT ALL ON public."SupplierTax" TO service_role;
GRANT USAGE, SELECT ON SEQUENCE "SupplierTax_id_seq" TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE "SupplierTax_id_seq" TO service_role;

-- Comentarios
COMMENT ON TABLE public."SupplierTax" IS 'Configuración de impuestos específicos por proveedor';
COMMENT ON COLUMN public."SupplierTax"."taxType" IS 'Tipo de impuesto específico';
COMMENT ON COLUMN public."SupplierTax"."taxRate" IS 'Porcentaje del impuesto (0-100)';
COMMENT ON COLUMN public."SupplierTax"."isRetention" IS 'Indica si es una retención';
COMMENT ON COLUMN public."SupplierTax"."appliesToCategory" IS 'Categoría de producto específica (opcional)'; 