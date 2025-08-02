-- ================================================
-- MÓDULO DE RESERVAS - ADMIN TERMAS
-- ================================================

-- 1. TABLA DE EMPRESAS
CREATE TABLE companies (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  rut VARCHAR(20) UNIQUE NOT NULL,
  address TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  payment_terms VARCHAR(50) DEFAULT '30 días',
  credit_limit DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. TABLA DE CONTACTOS/EMPLEADOS
CREATE TABLE company_contacts (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  position VARCHAR(100),
  can_make_reservations BOOLEAN DEFAULT true,
  can_authorize_expenses BOOLEAN DEFAULT false,
  spending_limit DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. TABLA DE HABITACIONES
CREATE TABLE rooms (
  id BIGSERIAL PRIMARY KEY,
  number VARCHAR(10) UNIQUE NOT NULL,
  type VARCHAR(100) NOT NULL,
  capacity INTEGER NOT NULL,
  floor INTEGER,
  amenities TEXT,
  price_per_night DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. TABLA DE PRODUCTOS/PROGRAMAS SPA
CREATE TABLE spa_products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'SERVICIO', 'COMBO', 'HOSPEDAJE'
  price DECIMAL(10,2) NOT NULL,
  duration VARCHAR(50),
  sku VARCHAR(50) UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. TABLA DE RESERVAS (PRINCIPAL)
CREATE TABLE reservations (
  id BIGSERIAL PRIMARY KEY,
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(50) NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  room_id BIGINT REFERENCES rooms(id) NOT NULL,
  
  -- Información de facturación
  client_type VARCHAR(20) DEFAULT 'individual',
  contact_id BIGINT REFERENCES company_contacts(id),
  company_id BIGINT REFERENCES companies(id),
  billing_name VARCHAR(255) NOT NULL,
  billing_rut VARCHAR(20) NOT NULL,
  billing_address TEXT NOT NULL,
  authorized_by VARCHAR(255) NOT NULL,
  
  -- Estado y pagos
  status VARCHAR(20) DEFAULT 'pending',
  total_amount DECIMAL(12,2) DEFAULT 0,
  deposit_amount DECIMAL(12,2) DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  pending_amount DECIMAL(12,2) DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'no_payment',
  payment_method VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. TABLA DE PRODUCTOS POR RESERVA
CREATE TABLE reservation_products (
  id BIGSERIAL PRIMARY KEY,
  reservation_id BIGINT REFERENCES reservations(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES spa_products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. TABLA DE COMENTARIOS
CREATE TABLE reservation_comments (
  id BIGSERIAL PRIMARY KEY,
  reservation_id BIGINT REFERENCES reservations(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author VARCHAR(255) NOT NULL,
  comment_type VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. TABLA DE PAGOS
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  reservation_id BIGINT REFERENCES reservations(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  reference VARCHAR(255),
  notes TEXT,
  processed_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- TRIGGERS PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- DATOS DE EJEMPLO
-- ================================================

-- Empresas
INSERT INTO companies (name, rut, address, contact_email, contact_phone, payment_terms, credit_limit) VALUES
('Tech Solutions SpA', '76.123.456-7', 'Av. Providencia 1234, Santiago', 'facturacion@techsolutions.cl', '+56 2 2345 6789', '30 días', 5000000),
('Constructora Los Andes Ltda.', '96.789.123-4', 'Las Condes 567, Santiago', 'admin@losandes.cl', '+56 2 3456 7890', '45 días', 8000000),
('Exportadora Frutas del Sur SA', '88.456.789-1', 'Rancagua 890, VI Región', 'contabilidad@frutasdelsur.cl', '+56 72 234 5678', '15 días', 3000000);

-- Contactos
INSERT INTO company_contacts (company_id, name, email, phone, position, can_authorize_expenses, spending_limit) VALUES
(1, 'Juan Pérez', 'juan.perez@techsolutions.cl', '+56 9 1234 5678', 'Gerente de Ventas', true, 500000),
(1, 'Carlos Silva', 'carlos.silva@techsolutions.cl', '+56 9 7777 8888', 'Ejecutivo Comercial', false, 200000),
(2, 'María González', 'maria.gonzalez@losandes.cl', '+56 9 8765 4321', 'Directora de RRHH', true, 800000);

-- Habitaciones
INSERT INTO rooms (number, type, capacity, floor, price_per_night) VALUES
('101', 'Suite Presidencial', 4, 1, 180000),
('102', 'Suite Junior', 2, 1, 120000),
('201', 'Habitación Doble', 2, 2, 95000),
('202', 'Habitación Individual', 1, 2, 75000),
('301', 'Suite Familiar', 6, 3, 220000),
('302', 'Habitación Triple', 3, 3, 140000);

-- Productos/Programas del Spa
INSERT INTO spa_products (name, description, category, type, price, duration, sku) VALUES
('Programa Relax Total', 'Masaje relajante + Aguas termales + Aromaterapia', 'Spa Packages', 'SERVICIO', 85000, '3 horas', 'SERV-RELA-001'),
('Paquete Termal Premium', 'Circuito termal completo + Masaje + Exfoliación + Hidroterapia', 'Spa Packages', 'COMBO', 120000, '4 horas', 'COMBO-TERM-001'),
('Alojamiento + Desayuno', 'Habitación + Desayuno buffet + Acceso a piscinas', 'Hospedaje', 'SERVICIO', 150000, '1 noche', 'SERV-ALOJ-001'),
('Cena Romántica', 'Cena 3 tiempos + Copa de vino + Ambientación especial', 'Gastronomía', 'SERVICIO', 45000, '2 horas', 'SERV-CENA-001'),
('Masaje Parejas', 'Masaje relajante para dos personas + Champagne', 'Tratamientos', 'SERVICIO', 160000, '90 min', 'SERV-MASA-001'),
('Paquete Luna de Miel', 'Alojamiento Suite + Spa + Cenas + Decoración especial', 'Paquetes Especiales', 'COMBO', 350000, '2 días', 'COMBO-LUNA-001'); 