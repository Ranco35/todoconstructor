-- Crear tabla de descuentos
CREATE TABLE IF NOT EXISTS sales_discounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('percentage', 'fixed', 'buy_x_get_y')),
  value DECIMAL(10,2) NOT NULL,
  min_amount DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_to TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  applies_to VARCHAR(50) NOT NULL CHECK (applies_to IN ('all', 'products', 'categories', 'clients')),
  product_ids INTEGER[],
  category_ids INTEGER[],
  client_ids INTEGER[],
  usage_limit INTEGER,
  current_usage INTEGER DEFAULT 0,
  code VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de aplicaciones de descuentos
CREATE TABLE IF NOT EXISTS sales_discount_applications (
  id SERIAL PRIMARY KEY,
  discount_id INTEGER NOT NULL REFERENCES sales_discounts(id) ON DELETE CASCADE,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_sales_discounts_code ON sales_discounts(code);
CREATE INDEX IF NOT EXISTS idx_sales_discounts_active ON sales_discounts(is_active);
CREATE INDEX IF NOT EXISTS idx_sales_discounts_valid_dates ON sales_discounts(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_sales_discount_applications_discount_id ON sales_discount_applications(discount_id);
CREATE INDEX IF NOT EXISTS idx_sales_discount_applications_invoice_id ON sales_discount_applications(invoice_id);

-- Crear función para incrementar contador de uso
CREATE OR REPLACE FUNCTION increment(value INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN value + 1;
END;
$$ LANGUAGE plpgsql;

-- Crear RLS policies
ALTER TABLE sales_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_discount_applications ENABLE ROW LEVEL SECURITY;

-- Policies para sales_discounts
CREATE POLICY "Users can view discounts" ON sales_discounts
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert discounts" ON sales_discounts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMINISTRADOR'
    )
  );

CREATE POLICY "Admins can update discounts" ON sales_discounts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMINISTRADOR'
    )
  );

CREATE POLICY "Admins can delete discounts" ON sales_discounts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMINISTRADOR'
    )
  );

-- Policies para sales_discount_applications
CREATE POLICY "Users can view discount applications" ON sales_discount_applications
  FOR SELECT USING (true);

CREATE POLICY "Users can insert discount applications" ON sales_discount_applications
  FOR INSERT WITH CHECK (true);

-- Insertar algunos descuentos de ejemplo
INSERT INTO sales_discounts (
  name, 
  description, 
  type, 
  value, 
  min_amount, 
  max_discount,
  valid_from, 
  valid_to, 
  is_active, 
  applies_to, 
  code
) VALUES 
(
  'Descuento de Bienvenida',
  '10% de descuento para nuevos clientes',
  'percentage',
  10.00,
  50000.00,
  100000.00,
  '2024-01-01 00:00:00+00',
  '2024-12-31 23:59:59+00',
  true,
  'all',
  'BIENVENIDA10'
),
(
  'Descuento por Volumen',
  '5% de descuento en compras superiores a $200.000',
  'percentage',
  5.00,
  200000.00,
  NULL,
  '2024-01-01 00:00:00+00',
  '2024-12-31 23:59:59+00',
  true,
  'all',
  'VOLUMEN5'
),
(
  'Descuento Fijo',
  '$50.000 de descuento en servicios premium',
  'fixed',
  50000.00,
  100000.00,
  50000.00,
  '2024-01-01 00:00:00+00',
  '2024-12-31 23:59:59+00',
  true,
  'products',
  'FIXED50'
);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sales_discounts_updated_at
  BEFORE UPDATE ON sales_discounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 