-- Migración: Sistema de Entrenamiento de IA para PDF Processor
-- Fecha: 19 de Julio 2025
-- Propósito: Permitir mejora continua de la IA mediante feedback del usuario

-- ====================
-- TABLA: pdf_training_corrections
-- ====================
CREATE TABLE public.pdf_training_corrections (
    id BIGSERIAL PRIMARY KEY,
    
    -- Datos originales extraídos por IA/OCR
    original_data JSONB NOT NULL,
    
    -- Datos corregidos por el usuario
    corrected_data JSONB NOT NULL,
    
    -- Texto original del PDF (truncado)
    pdf_text TEXT,
    pdf_file_name VARCHAR(255),
    
    -- Metadatos de extracción
    extraction_method VARCHAR(10) NOT NULL, -- 'ai' o 'ocr'
    original_confidence NUMERIC(3,2),
    correction_type VARCHAR(20) DEFAULT 'user_feedback', -- 'user_feedback', 'validation_error', 'manual_review'
    
    -- Análisis de errores para mejora
    error_fields TEXT[], -- ['invoiceNumber', 'taxAmount', 'supplierRut']
    error_patterns TEXT[], -- Patrones específicos que fallaron
    correction_notes TEXT, -- Notas del usuario sobre la corrección
    
    -- Información del proveedor (para patterns específicos)
    supplier_id BIGINT REFERENCES "Supplier"(id),
    supplier_format_type VARCHAR(50), -- 'standard', 'electronic', 'handwritten', 'retail', 'services'
    
    -- Metadatos del sistema
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Estado de procesamiento para entrenamiento
    used_for_training BOOLEAN DEFAULT false,
    training_batch_id VARCHAR(50),
    improvement_applied BOOLEAN DEFAULT false
);

-- ====================
-- TABLA: pdf_extraction_patterns
-- ====================
CREATE TABLE public.pdf_extraction_patterns (
    id BIGSERIAL PRIMARY KEY,
    
    -- Definición del pattern
    pattern_type VARCHAR(30) NOT NULL, -- 'invoice_number', 'supplier_rut', 'amounts', 'dates'
    regex_pattern TEXT NOT NULL,
    confidence_boost NUMERIC(3,2) DEFAULT 0.1, -- Cuánto mejora la confianza
    
    -- Contexto de aplicación
    supplier_types TEXT[], -- ['empresa', 'individual', 'retail', 'services']
    pdf_formats TEXT[], -- ['electronic', 'scanned', 'mixed', 'low_quality']
    language VARCHAR(5) DEFAULT 'es-CL',
    
    -- Estadísticas de rendimiento
    success_rate NUMERIC(3,2) DEFAULT 0.0,
    total_applications INTEGER DEFAULT 0,
    successful_applications INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Origen y estado
    created_from_training_id BIGINT REFERENCES pdf_training_corrections(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ====================
-- TABLA: prompt_performance_log
-- ====================
CREATE TABLE public.prompt_performance_log (
    id BIGSERIAL PRIMARY KEY,
    
    -- Identificación del prompt
    prompt_version VARCHAR(50) NOT NULL,
    prompt_hash VARCHAR(64), -- Hash para identificar prompts únicos
    
    -- Configuración usada
    extraction_method VARCHAR(10), -- 'ai' o 'ocr'
    model_used VARCHAR(30), -- 'gpt-4', 'gpt-3.5-turbo', 'ocr'
    supplier_type VARCHAR(30),
    pdf_format VARCHAR(20),
    
    -- Métricas de rendimiento
    accuracy_score NUMERIC(3,2) NOT NULL, -- 0.00 - 1.00
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    confidence_avg NUMERIC(3,2),
    
    -- Análisis de errores
    error_fields TEXT[],
    total_corrections INTEGER DEFAULT 0,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    pdf_file_name VARCHAR(255),
    created_by UUID REFERENCES auth.users(id)
);

-- ====================
-- TABLA: supplier_templates (Futuro)
-- ====================
CREATE TABLE public.supplier_templates (
    id BIGSERIAL PRIMARY KEY,
    
    -- Identificación del proveedor
    supplier_id BIGINT REFERENCES "Supplier"(id),
    supplier_name VARCHAR(255),
    
    -- Características del formato
    characteristics JSONB, -- {hasElectronicHeader, hasBarcode, hasTimbre, layout}
    
    -- Reglas de extracción específicas
    extraction_rules JSONB, -- Reglas personalizadas para este proveedor
    field_mappings JSONB, -- Mapeo específico de campos
    
    -- Estadísticas
    success_rate NUMERIC(3,2) DEFAULT 0.0,
    usage_count INTEGER DEFAULT 0,
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- ====================
-- ÍNDICES PARA PERFORMANCE
-- ====================

-- Índices para pdf_training_corrections
CREATE INDEX idx_pdf_training_corrections_method ON pdf_training_corrections(extraction_method);
CREATE INDEX idx_pdf_training_corrections_supplier ON pdf_training_corrections(supplier_id);
CREATE INDEX idx_pdf_training_corrections_created_at ON pdf_training_corrections(created_at);
CREATE INDEX idx_pdf_training_corrections_error_fields ON pdf_training_corrections USING gin(error_fields);
CREATE INDEX idx_pdf_training_corrections_training ON pdf_training_corrections(used_for_training, training_batch_id);

-- Índices para pdf_extraction_patterns
CREATE INDEX idx_pdf_extraction_patterns_type ON pdf_extraction_patterns(pattern_type);
CREATE INDEX idx_pdf_extraction_patterns_active ON pdf_extraction_patterns(is_active);
CREATE INDEX idx_pdf_extraction_patterns_success_rate ON pdf_extraction_patterns(success_rate DESC);
CREATE INDEX idx_pdf_extraction_patterns_supplier_types ON pdf_extraction_patterns USING gin(supplier_types);

-- Índices para prompt_performance_log
CREATE INDEX idx_prompt_performance_log_version ON prompt_performance_log(prompt_version);
CREATE INDEX idx_prompt_performance_log_accuracy ON prompt_performance_log(accuracy_score DESC);
CREATE INDEX idx_prompt_performance_log_created_at ON prompt_performance_log(created_at);
CREATE INDEX idx_prompt_performance_log_method ON prompt_performance_log(extraction_method);

-- Índices para supplier_templates
CREATE INDEX idx_supplier_templates_supplier ON supplier_templates(supplier_id);
CREATE INDEX idx_supplier_templates_active ON supplier_templates(is_active);
CREATE INDEX idx_supplier_templates_success_rate ON supplier_templates(success_rate DESC);

-- ====================
-- TRIGGERS PARA AUDITORÍA
-- ====================

-- Trigger para actualizar updated_at en pdf_extraction_patterns
CREATE OR REPLACE FUNCTION update_pdf_extraction_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pdf_extraction_patterns_updated_at
    BEFORE UPDATE ON pdf_extraction_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_pdf_extraction_patterns_updated_at();

-- Trigger para actualizar updated_at en supplier_templates
CREATE OR REPLACE FUNCTION update_supplier_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_supplier_templates_updated_at
    BEFORE UPDATE ON supplier_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_supplier_templates_updated_at();

-- ====================
-- RLS POLICIES
-- ====================

-- Habilitar RLS
ALTER TABLE pdf_training_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_extraction_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_performance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para pdf_training_corrections
CREATE POLICY "Users can view their own corrections" ON pdf_training_corrections
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create corrections" ON pdf_training_corrections
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admin users can view all corrections" ON pdf_training_corrections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "User" u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Políticas para pdf_extraction_patterns
CREATE POLICY "Users can view active patterns" ON pdf_extraction_patterns
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin users can manage patterns" ON pdf_extraction_patterns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "User" u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Políticas para prompt_performance_log
CREATE POLICY "Users can view their own logs" ON prompt_performance_log
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create logs" ON prompt_performance_log
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Políticas para supplier_templates
CREATE POLICY "Users can view active templates" ON supplier_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin users can manage templates" ON supplier_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "User" u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- ====================
-- FUNCIONES HELPER
-- ====================

-- Función para calcular accuracy de un prompt
CREATE OR REPLACE FUNCTION calculate_prompt_accuracy(
    p_prompt_version VARCHAR(50),
    p_days_back INTEGER DEFAULT 7
)
RETURNS NUMERIC AS $$
DECLARE
    total_extractions INTEGER;
    total_corrections INTEGER;
    accuracy NUMERIC;
BEGIN
    -- Contar total de extracciones con este prompt
    SELECT COUNT(*) INTO total_extractions
    FROM prompt_performance_log 
    WHERE prompt_version = p_prompt_version
    AND created_at >= NOW() - INTERVAL '1 day' * p_days_back;
    
    -- Contar correcciones necesarias
    SELECT COUNT(*) INTO total_corrections
    FROM pdf_training_corrections ptc
    JOIN prompt_performance_log ppl ON DATE(ptc.created_at) = DATE(ppl.created_at)
    WHERE ppl.prompt_version = p_prompt_version
    AND ptc.created_at >= NOW() - INTERVAL '1 day' * p_days_back;
    
    -- Calcular accuracy
    IF total_extractions > 0 THEN
        accuracy = (total_extractions - total_corrections)::NUMERIC / total_extractions;
    ELSE
        accuracy = 0.0;
    END IF;
    
    RETURN GREATEST(0.0, LEAST(1.0, accuracy));
END;
$$ LANGUAGE plpgsql;

-- Función para obtener patterns más exitosos
CREATE OR REPLACE FUNCTION get_best_patterns(
    p_pattern_type VARCHAR(30),
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    pattern_id BIGINT,
    regex_pattern TEXT,
    success_rate NUMERIC,
    confidence_boost NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pep.id,
        pep.regex_pattern,
        pep.success_rate,
        pep.confidence_boost
    FROM pdf_extraction_patterns pep
    WHERE pep.pattern_type = p_pattern_type
    AND pep.is_active = true
    AND pep.total_applications >= 3
    ORDER BY pep.success_rate DESC, pep.total_applications DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ====================
-- COMENTARIOS EXPLICATIVOS
-- ====================

COMMENT ON TABLE pdf_training_corrections IS 'Almacena correcciones del usuario para entrenar la IA';
COMMENT ON TABLE pdf_extraction_patterns IS 'Patrones de extracción aprendidos para mejorar OCR';
COMMENT ON TABLE prompt_performance_log IS 'Log de rendimiento de diferentes versiones de prompts';
COMMENT ON TABLE supplier_templates IS 'Templates específicos por proveedor para extracción optimizada';

COMMENT ON COLUMN pdf_training_corrections.error_fields IS 'Campos que fueron corregidos por el usuario';
COMMENT ON COLUMN pdf_training_corrections.supplier_format_type IS 'Tipo de formato del proveedor para personalización';
COMMENT ON COLUMN pdf_extraction_patterns.confidence_boost IS 'Incremento de confianza cuando se aplica este pattern';
COMMENT ON COLUMN prompt_performance_log.accuracy_score IS 'Porcentaje de precisión del prompt (0.00-1.00)';

-- ====================
-- DATOS INICIALES
-- ====================

-- Insertar algunos patterns base para empezar
INSERT INTO pdf_extraction_patterns (pattern_type, regex_pattern, confidence_boost, supplier_types, pdf_formats) VALUES
('invoice_number', '(?:factura|n[°º]?\.?)\s*:?\s*([a-z]?[\d\-]+)', 0.15, ARRAY['empresa', 'individual'], ARRAY['electronic', 'scanned']),
('supplier_rut', '(\d{1,2}\.\d{3}\.\d{3}-[\dk])', 0.20, ARRAY['empresa', 'individual'], ARRAY['electronic', 'scanned', 'mixed']),
('amounts', '(?:total|suma)\s*:?\s*\$?\s*([\d,\.]+)', 0.10, ARRAY['empresa', 'individual'], ARRAY['electronic', 'scanned']),
('amounts', '(?:iva|impuesto)\s*:?\s*\$?\s*([\d,\.]+)', 0.12, ARRAY['empresa'], ARRAY['electronic']),
('dates', '(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', 0.08, ARRAY['empresa', 'individual'], ARRAY['electronic', 'scanned', 'mixed']);

-- Configurar success_rate inicial
UPDATE pdf_extraction_patterns SET 
    success_rate = 0.8,
    total_applications = 1,
    successful_applications = 1
WHERE id IN (SELECT id FROM pdf_extraction_patterns LIMIT 5);

-- ====================
-- FINALIZACIÓN
-- ====================

-- Registrar migración exitosa
DO $$
BEGIN
    RAISE NOTICE 'Migración de entrenamiento IA completada exitosamente';
    RAISE NOTICE 'Tablas creadas: pdf_training_corrections, pdf_extraction_patterns, prompt_performance_log, supplier_templates';
    RAISE NOTICE 'Funciones disponibles: calculate_prompt_accuracy(), get_best_patterns()';
    RAISE NOTICE 'Sistema listo para mejora continua de IA';
END $$; 