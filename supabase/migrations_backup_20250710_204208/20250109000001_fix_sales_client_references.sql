-- Migración para corregir las referencias entre sales_quotes y Client
-- Esta migración asegura que la relación foreign key esté correctamente establecida

-- Verificar que la tabla Client existe y tiene las columnas correctas
-- Si no existe, la crearemos con la estructura correcta
DO $$ 
BEGIN
  -- Crear tabla Client si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Client') THEN
    CREATE TABLE "Client" (
      id SERIAL PRIMARY KEY,
      nombrePrincipal VARCHAR(255) NOT NULL,
      apellido VARCHAR(255),
      email VARCHAR(255),
      rut VARCHAR(20),
      telefono VARCHAR(20),
      telefonoMovil VARCHAR(20),
      razonSocial VARCHAR(255),
      tipoCliente VARCHAR(50) DEFAULT 'individual',
      estado VARCHAR(20) DEFAULT 'activo',
      calle VARCHAR(255),
      ciudad VARCHAR(100),
      region VARCHAR(100),
      codigoPostal VARCHAR(20),
      pais VARCHAR(100) DEFAULT 'Chile',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  -- Verificar que la tabla sales_quotes existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_quotes') THEN
    CREATE TABLE sales_quotes (
      id SERIAL PRIMARY KEY,
      number VARCHAR(50) UNIQUE NOT NULL,
      client_id INTEGER REFERENCES "Client"(id) ON DELETE CASCADE,
      reservation_id INTEGER,
      status VARCHAR(20) DEFAULT 'draft',
      total DECIMAL(12,2) DEFAULT 0,
      currency VARCHAR(3) DEFAULT 'CLP',
      expiration_date DATE,
      notes TEXT,
      payment_terms INTEGER,
      company_id INTEGER,
      seller_id INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  -- Verificar que la tabla sales_quote_lines existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_quote_lines') THEN
    CREATE TABLE sales_quote_lines (
      id SERIAL PRIMARY KEY,
      quote_id INTEGER REFERENCES sales_quotes(id) ON DELETE CASCADE,
      product_id INTEGER,
      description TEXT NOT NULL,
      quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
      unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      discount_percent DECIMAL(5,2) DEFAULT 0,
      taxes JSONB DEFAULT '[]',
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  -- Asegurar que la foreign key existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE table_name = 'sales_quotes' 
    AND constraint_name = 'sales_quotes_client_id_fkey'
  ) THEN
    -- Eliminar constraint anterior si existe con otro nombre
    ALTER TABLE sales_quotes DROP CONSTRAINT IF EXISTS sales_quotes_client_id_fkey;
    
    -- Crear la foreign key correcta
    ALTER TABLE sales_quotes 
    ADD CONSTRAINT sales_quotes_client_id_fkey 
    FOREIGN KEY (client_id) REFERENCES "Client"(id) ON DELETE CASCADE;
  END IF;

END $$;

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_sales_quotes_client_id ON sales_quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_status ON sales_quotes(status);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_created_at ON sales_quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_quote_lines_quote_id ON sales_quote_lines(quote_id);

-- Políticas RLS para sales_quotes
ALTER TABLE sales_quotes ENABLE ROW LEVEL SECURITY;

-- Política para permitir acceso a usuarios autenticados
DROP POLICY IF EXISTS "Users can view sales_quotes" ON sales_quotes;
CREATE POLICY "Users can view sales_quotes" 
ON sales_quotes FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Users can insert sales_quotes" ON sales_quotes;
CREATE POLICY "Users can insert sales_quotes" 
ON sales_quotes FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update sales_quotes" ON sales_quotes;
CREATE POLICY "Users can update sales_quotes" 
ON sales_quotes FOR UPDATE 
TO authenticated 
USING (true);

-- Políticas RLS para sales_quote_lines
ALTER TABLE sales_quote_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view sales_quote_lines" ON sales_quote_lines;
CREATE POLICY "Users can view sales_quote_lines" 
ON sales_quote_lines FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Users can insert sales_quote_lines" ON sales_quote_lines;
CREATE POLICY "Users can insert sales_quote_lines" 
ON sales_quote_lines FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update sales_quote_lines" ON sales_quote_lines;
CREATE POLICY "Users can update sales_quote_lines" 
ON sales_quote_lines FOR UPDATE 
TO authenticated 
USING (true);

-- Políticas RLS para Client (si no existen)
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view Client" ON "Client";
CREATE POLICY "Users can view Client" 
ON "Client" FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Users can insert Client" ON "Client";
CREATE POLICY "Users can insert Client" 
ON "Client" FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update Client" ON "Client";
CREATE POLICY "Users can update Client" 
ON "Client" FOR UPDATE 
TO authenticated 
USING (true);

-- Comentario de la migración
COMMENT ON TABLE sales_quotes IS 'Tabla de presupuestos de ventas con relación correcta a Client';
COMMENT ON TABLE sales_quote_lines IS 'Líneas de presupuestos de ventas';
COMMENT ON COLUMN sales_quotes.client_id IS 'ID del cliente (FK a tabla Client)';
COMMENT ON COLUMN sales_quotes.discount_percent IS 'Porcentaje de descuento (0-100)'; 