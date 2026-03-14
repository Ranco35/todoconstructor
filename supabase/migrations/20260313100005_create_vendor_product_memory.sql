-- Migración: Tablas de memoria proveedor-producto y aliases
-- Fecha: 2026-03-13
-- Descripción: Sistema de aprendizaje para matching de productos en facturas de compra.
--   Almacena relaciones aprendidas entre descripciones de facturas y productos reales.
--   Consolida 3 migraciones de admintermas: create, add_sku_unit, create_aliases.

-- ============================================
-- Extensión pg_trgm (para búsqueda por similitud)
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- Tabla: purchase_vendor_product_memory
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_vendor_product_memory (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT REFERENCES "Supplier"(id) ON DELETE CASCADE,
  observed_description TEXT NOT NULL,
  normalized_description TEXT NOT NULL,
  product_id BIGINT REFERENCES "Product"(id) ON DELETE CASCADE,
  unit VARCHAR(20),
  sku TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  times_seen INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by BIGINT REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT purchase_vendor_product_memory_vendor_product_unique
    UNIQUE(vendor_id, normalized_description, product_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vendor_product_memory_vendor
  ON purchase_vendor_product_memory(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_product_memory_product
  ON purchase_vendor_product_memory(product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_product_memory_normalized
  ON purchase_vendor_product_memory USING gin(normalized_description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vendor_product_memory_vendor_sku
  ON purchase_vendor_product_memory(vendor_id, sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendor_product_memory_vendor_unit
  ON purchase_vendor_product_memory(vendor_id, unit) WHERE unit IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendor_product_memory_vendor_product
  ON purchase_vendor_product_memory(vendor_id, product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_product_memory_vendor_sku_unit
  ON purchase_vendor_product_memory(vendor_id, sku, unit) WHERE sku IS NOT NULL AND unit IS NOT NULL;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_vendor_product_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vendor_product_memory_updated_at
  BEFORE UPDATE ON purchase_vendor_product_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_product_memory_updated_at();

-- RLS
ALTER TABLE purchase_vendor_product_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_product_memory_select" ON purchase_vendor_product_memory
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "vendor_product_memory_insert" ON purchase_vendor_product_memory
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "vendor_product_memory_update" ON purchase_vendor_product_memory
  FOR UPDATE USING (auth.role() = 'authenticated');

COMMENT ON TABLE purchase_vendor_product_memory IS
  'Memoria de relaciones aprendidas entre descripciones de facturas y productos.';

-- ============================================
-- Tabla: purchase_vendor_product_aliases
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_vendor_product_aliases (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT NOT NULL REFERENCES "Supplier"(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  alias_norm TEXT NOT NULL,
  alias_raw TEXT,
  unit TEXT NULL,
  sku TEXT NULL,
  confidence NUMERIC NULL,
  times_used INTEGER NOT NULL DEFAULT 1,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by BIGINT REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT purchase_vendor_product_aliases_unique
    UNIQUE(vendor_id, alias_norm, COALESCE(unit, ''), COALESCE(sku, ''))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vendor_product_aliases_vendor_alias
  ON purchase_vendor_product_aliases(vendor_id, alias_norm) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vendor_product_aliases_vendor_sku
  ON purchase_vendor_product_aliases(vendor_id, sku) WHERE sku IS NOT NULL AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_vendor_product_aliases_vendor_unit
  ON purchase_vendor_product_aliases(vendor_id, unit) WHERE unit IS NOT NULL AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_vendor_product_aliases_vendor_product
  ON purchase_vendor_product_aliases(vendor_id, product_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vendor_product_aliases_alias_norm_gin
  ON purchase_vendor_product_aliases USING gin(alias_norm gin_trgm_ops) WHERE is_active = true;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_vendor_product_aliases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vendor_product_aliases_updated_at
  BEFORE UPDATE ON purchase_vendor_product_aliases
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_product_aliases_updated_at();

-- RLS
ALTER TABLE purchase_vendor_product_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_product_aliases_select" ON purchase_vendor_product_aliases
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "vendor_product_aliases_insert" ON purchase_vendor_product_aliases
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "vendor_product_aliases_update" ON purchase_vendor_product_aliases
  FOR UPDATE USING (auth.role() = 'authenticated');

COMMENT ON TABLE purchase_vendor_product_aliases IS
  'Aliases de descripciones por proveedor para matching rápido antes de embeddings.';
