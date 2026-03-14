-- Migración: Módulo CRM para TodoConstructor (Ferretería/Construcción)
-- Adaptado de admintermas: sin reservation_id, terminología de ferretería

-- ============================================
-- Tabla de etapas del pipeline
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_stages (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_final BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Etapas del pipeline adaptadas a ferretería/construcción
INSERT INTO public.crm_stages (name, description, color, order_index, is_final)
SELECT * FROM (VALUES
    ('nuevo_contacto', 'Nuevo Contacto', '#EF4444', 1, false),
    ('cliente_interesado', 'Cliente Interesado', '#F97316', 2, false),
    ('contacto_calificado', 'Contacto Calificado', '#EAB308', 3, false),
    ('cotizacion_enviada', 'Cotizacion Enviada', '#3B82F6', 4, false),
    ('negociacion', 'Negociacion', '#8B5CF6', 5, false),
    ('confirmado', 'Confirmado / Pedido', '#10B981', 6, false),
    ('ganado', 'Ganado', '#059669', 7, true),
    ('perdido', 'Perdido', '#6B7280', 8, true)
) AS new_stages(name, description, color, order_index, is_final)
WHERE NOT EXISTS (
    SELECT 1 FROM public.crm_stages
    WHERE crm_stages.name = new_stages.name
);

-- ============================================
-- Tabla principal de leads/oportunidades
-- SIN reservation_id (hotel-only)
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_leads (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT REFERENCES public."Client"(id) ON DELETE SET NULL,
    budget_id BIGINT REFERENCES public.sales_quotes(id) ON DELETE SET NULL,

    -- Información básica del lead
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source VARCHAR(50) NOT NULL DEFAULT 'manual',

    -- Pipeline y seguimiento
    stage_id BIGINT REFERENCES public.crm_stages(id) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',

    -- Información comercial
    estimated_value DECIMAL(12,2) DEFAULT 0,
    probability INTEGER DEFAULT 50,
    expected_close_date DATE,
    actual_close_date DATE,

    -- Loss tracking
    loss_reason VARCHAR(255),
    loss_reason_category VARCHAR(50),

    -- Asignación
    assigned_to UUID REFERENCES public."User"(id) ON DELETE SET NULL,

    -- Metadatos
    notes TEXT,
    tags JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES public."User"(id) ON DELETE SET NULL
);

-- ============================================
-- Tabla de actividades/seguimiento
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_activities (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT REFERENCES public.crm_leads(id) ON DELETE CASCADE NOT NULL,

    type VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,

    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,

    status VARCHAR(20) DEFAULT 'pending',
    outcome VARCHAR(100),
    next_action VARCHAR(255),

    assigned_to UUID REFERENCES public."User"(id) ON DELETE SET NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES public."User"(id) ON DELETE SET NULL
);

-- ============================================
-- Tabla de plantillas de email CRM (adaptadas a ferretería)
-- ============================================
CREATE TABLE IF NOT EXISTS crm_email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plantillas por defecto adaptadas a ferretería/construcción
INSERT INTO crm_email_templates (name, slug, subject, body, category, is_default) VALUES
(
  'Disponibilidad confirmada',
  'disponibilidad_si',
  'Disponibilidad de productos - TodoConstructor',
  'Le informamos que tenemos disponibilidad de los productos consultados.

Estamos preparando un presupuesto detallado con precios y opciones disponibles. Se lo enviaremos a la brevedad.

Si tiene alguna consulta adicional, no dude en contactarnos.',
  'ventas',
  true
),
(
  'Sin stock',
  'disponibilidad_no',
  'Consulta de disponibilidad - TodoConstructor',
  'Agradecemos su interes en TodoConstructor.

Lamentablemente, algunos de los productos solicitados no se encuentran disponibles actualmente. Sin embargo, le sugerimos las siguientes alternativas:

- [Indicar productos alternativos disponibles]
- [Indicar fecha estimada de reposicion]

Quedamos atentos a cualquier consulta.',
  'ventas',
  true
),
(
  'Solicitar mas informacion',
  'solicitar_info',
  'Re: Consulta de materiales - TodoConstructor',
  'Agradecemos su interes en TodoConstructor.

Para poder preparar un presupuesto adecuado a sus necesidades, necesitamos la siguiente informacion adicional:

- Cantidades requeridas de cada material
- Lugar de despacho o retiro en tienda
- Plazo estimado del proyecto

Quedamos atentos a su respuesta.',
  'ventas',
  true
),
(
  'Confirmacion de pedido',
  'confirmacion_pedido',
  'Confirmacion de pedido - TodoConstructor',
  'Nos complace confirmar su pedido en TodoConstructor.

A continuacion encontrara los detalles de su compra. Si necesita realizar algun cambio o tiene consultas, no dude en contactarnos.

Le informaremos cuando su pedido este listo para despacho o retiro.

Gracias por su preferencia.',
  'ventas',
  true
),
(
  'Seguimiento post-cotizacion',
  'seguimiento_cotizacion',
  'Seguimiento de cotizacion - TodoConstructor',
  'Esperamos que se encuentre bien. Nos ponemos en contacto para hacer seguimiento de la cotizacion que le enviamos anteriormente.

Tuvo oportunidad de revisarla? Estamos disponibles para resolver cualquier duda o ajustar la propuesta segun sus necesidades.

Quedamos atentos a su respuesta.',
  'seguimiento',
  true
),
(
  'Bienvenida',
  'bienvenida',
  'Bienvenido/a a TodoConstructor',
  'Es un placer darle la bienvenida a TodoConstructor.

Somos su proveedor de confianza en materiales de construccion, herramientas y ferreteria en general. Contamos con una amplia gama de productos y precios competitivos.

Estamos a su disposicion para ayudarle con sus proyectos. No dude en contactarnos para cualquier consulta o cotizacion.',
  'general',
  true
);

-- ============================================
-- Índices
-- ============================================
CREATE INDEX IF NOT EXISTS idx_crm_leads_client_id ON public.crm_leads(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_stage_id ON public.crm_leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned_to ON public.crm_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON public.crm_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON public.crm_leads(source);
CREATE INDEX IF NOT EXISTS idx_crm_leads_actual_close_date ON crm_leads(actual_close_date);
CREATE INDEX IF NOT EXISTS idx_crm_leads_loss_reason_category ON crm_leads(loss_reason_category);
CREATE INDEX IF NOT EXISTS idx_crm_leads_stage_created ON crm_leads(stage_id, created_at);

CREATE INDEX IF NOT EXISTS idx_crm_activities_lead_id ON public.crm_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_assigned_to ON public.crm_activities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_activities_scheduled_at ON public.crm_activities(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_crm_activities_status ON public.crm_activities(status);

CREATE INDEX IF NOT EXISTS idx_crm_email_templates_category ON crm_email_templates(category);
CREATE INDEX IF NOT EXISTS idx_crm_email_templates_is_active ON crm_email_templates(is_active);

-- ============================================
-- Triggers updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_crm_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_crm_stages_updated_at BEFORE UPDATE ON public.crm_stages FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at_column();
CREATE TRIGGER update_crm_leads_updated_at BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at_column();
CREATE TRIGGER update_crm_activities_updated_at BEFORE UPDATE ON public.crm_activities FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at_column();

CREATE OR REPLACE FUNCTION update_crm_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_crm_email_templates_updated_at
  BEFORE UPDATE ON crm_email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_email_templates_updated_at();

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_stages_select" ON public.crm_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_leads_select" ON public.crm_leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_leads_insert" ON public.crm_leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "crm_leads_update" ON public.crm_leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "crm_leads_delete" ON public.crm_leads FOR DELETE TO authenticated USING (true);

CREATE POLICY "crm_activities_select" ON public.crm_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_activities_insert" ON public.crm_activities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "crm_activities_update" ON public.crm_activities FOR UPDATE TO authenticated USING (true);
CREATE POLICY "crm_activities_delete" ON public.crm_activities FOR DELETE TO authenticated USING (true);

CREATE POLICY "crm_email_templates_select" ON crm_email_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_email_templates_insert" ON crm_email_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "crm_email_templates_update" ON crm_email_templates FOR UPDATE TO authenticated USING (true);
