-- Crear tabla de plantillas de presupuesto
CREATE TABLE IF NOT EXISTS budget_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'custom',
  icon VARCHAR(10) DEFAULT '📋',
  color VARCHAR(20) DEFAULT 'blue',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  summary_template TEXT,
  notes_template TEXT,
  payment_terms VARCHAR(10) DEFAULT '0',
  currency VARCHAR(10) DEFAULT 'CLP',
  lines_template JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budget_templates_category ON budget_templates(category);
CREATE INDEX IF NOT EXISTS idx_budget_templates_active ON budget_templates(is_active);

CREATE OR REPLACE FUNCTION update_budget_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_budget_templates_updated_at ON budget_templates;
CREATE TRIGGER trg_budget_templates_updated_at
  BEFORE UPDATE ON budget_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_templates_updated_at();

-- RLS
ALTER TABLE budget_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_templates_select_all" ON budget_templates
  FOR SELECT USING (true);

CREATE POLICY "budget_templates_insert_authenticated" ON budget_templates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "budget_templates_update_authenticated" ON budget_templates
  FOR UPDATE USING (true);

CREATE POLICY "budget_templates_delete_authenticated" ON budget_templates
  FOR DELETE USING (true);

-- ============================================
-- SEED DATA: Plantillas de Presupuesto para Ferretería/Construcción
-- ============================================

INSERT INTO budget_templates (name, description, category, icon, color, sort_order, summary_template, notes_template, payment_terms, lines_template) VALUES

-- PINTURA
('Kit de Pintura Interior',
 'Presupuesto para pintura interior: pintura, rodillos, brochas, cinta y accesorios',
 'pintura', '🎨', 'blue', 1,
 'Presupuesto Pintura Interior - TodoConstructor',
 'Precios incluyen IVA. Validez 15 días. Stock sujeto a disponibilidad.',
 '0',
 '[
   {"displayType": "section", "sectionTitle": "Kit de Pintura Interior"},
   {"displayType": "product", "description": "Pintura latex interior (galón)", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "product", "description": "Rodillo antigoteo 23cm", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "product", "description": "Brocha 2 pulgadas", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "product", "description": "Cinta de enmascarar", "quantity": 2, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "note", "noteText": "Rendimiento estimado: 10-12 m2 por galón. Seleccione los productos del catálogo."}
 ]'::jsonb),

('Kit de Pintura Exterior',
 'Presupuesto para pintura exterior: esmalte, primer, brochas y herramientas',
 'pintura', '🏠', 'teal', 2,
 'Presupuesto Pintura Exterior - TodoConstructor',
 'Precios incluyen IVA. Validez 15 días. Recomendamos aplicar primer antes de pintar.',
 '0',
 '[
   {"displayType": "section", "sectionTitle": "Kit de Pintura Exterior"},
   {"displayType": "product", "description": "Esmalte al agua exterior (galón)", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "product", "description": "Primer sellador (galón)", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "product", "description": "Rodillo de lana 23cm", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "product", "description": "Brocha angular 3 pulgadas", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "note", "noteText": "Para superficies nuevas, aplicar 2 manos de primer. Seleccione los productos del catálogo."}
 ]'::jsonb),

-- PLOMERÍA
('Kit de Plomería Básico',
 'Materiales básicos para instalación o reparación de cañerías',
 'plomeria', '🔧', 'cyan', 10,
 'Presupuesto Plomería - TodoConstructor',
 'Precios incluyen IVA. Validez 15 días. No incluye mano de obra.',
 '0',
 '[
   {"displayType": "section", "sectionTitle": "Materiales de Plomería"},
   {"displayType": "product", "description": "Cañería PVC/PPR según requerimiento", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "product", "description": "Codos y fittings", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "product", "description": "Llave de paso", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "product", "description": "Teflón y pegamento PVC", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "note", "noteText": "Presupuesto de materiales. No incluye instalación. Seleccione los productos del catálogo."}
 ]'::jsonb),

-- ELECTRICIDAD
('Kit Eléctrico Básico',
 'Materiales para instalación eléctrica domiciliaria',
 'electricidad', '⚡', 'amber', 20,
 'Presupuesto Eléctrico - TodoConstructor',
 'Precios incluyen IVA. Validez 15 días. Instalación debe ser realizada por electricista certificado.',
 '0',
 '[
   {"displayType": "section", "sectionTitle": "Materiales Eléctricos"},
   {"displayType": "product", "description": "Cable eléctrico (rollo)", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "product", "description": "Interruptores/enchufes", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "product", "description": "Tablero eléctrico", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "product", "description": "Protecciones automáticas", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "note", "noteText": "Instalación debe ser realizada por electricista autorizado SEC. Seleccione los productos del catálogo."}
 ]'::jsonb),

-- CONSTRUCCIÓN
('Presupuesto Construcción General',
 'Materiales de construcción: cemento, fierro, ladrillos, áridos',
 'construccion', '🏗️', 'green', 30,
 'Presupuesto Construcción - TodoConstructor',
 'Precios incluyen IVA. Validez 7 días por volatilidad de precios. Despacho según disponibilidad.',
 '0',
 '[
   {"displayType": "section", "sectionTitle": "Materiales de Construcción"},
   {"displayType": "product", "description": "Cemento (saco 25kg)", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "product", "description": "Arena (m3)", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "product", "description": "Ripio (m3)", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "product", "description": "Fierro construcción", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "product", "description": "Ladrillos/Bloques", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "note", "noteText": "Cantidades estimadas. Consultar disponibilidad de despacho. Seleccione los productos del catálogo."}
 ]'::jsonb),

('Set de Herramientas',
 'Kit de herramientas manuales y eléctricas para obra',
 'construccion', '🔨', 'indigo', 31,
 'Presupuesto Herramientas - TodoConstructor',
 'Precios incluyen IVA. Validez 15 días. Garantía según fabricante.',
 '0',
 '[
   {"displayType": "section", "sectionTitle": "Kit de Herramientas"},
   {"displayType": "product", "description": "Herramienta eléctrica (taladro/atornillador)", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "product", "description": "Set de brocas", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "product", "description": "Herramientas manuales", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "product", "description": "Elementos de seguridad (EPP)", "quantity": 1, "unitPrice": 0, "discountPercent": 0},
   {"displayType": "note", "noteText": "Garantía de herramientas eléctricas según fabricante. Seleccione los productos del catálogo."}
 ]'::jsonb),

-- PRESUPUESTO EN BLANCO
('Presupuesto en Blanco',
 'Crear un presupuesto desde cero sin plantilla predefinida',
 'custom', '📋', 'gray', 99,
 '',
 '',
 '0',
 '[]'::jsonb);
