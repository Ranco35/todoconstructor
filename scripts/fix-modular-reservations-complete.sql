-- ================================================
-- SOLUCIÓN COMPLETA PARA RESERVAS MODULARES
-- ================================================

-- 1. Eliminar tabla si existe (para recrearla correctamente)
DROP TABLE IF EXISTS modular_reservations;

-- 2. Crear tabla modular_reservations con referencias correctas
CREATE TABLE IF NOT EXISTS modular_reservations (
  id BIGSERIAL PRIMARY KEY,
  reservation_id BIGINT REFERENCES reservations(id) ON DELETE CASCADE,
  
  -- Datos específicos del sistema modular
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  children_ages JSONB DEFAULT '[]',
  package_modular_id BIGINT REFERENCES packages_modular(id),
  room_code VARCHAR(100) NOT NULL,
  package_code VARCHAR(100) NOT NULL,
  additional_products JSONB DEFAULT '[]',
  
  -- Información de precios
  pricing_breakdown JSONB,
  room_total DECIMAL(12,2) DEFAULT 0,
  package_total DECIMAL(12,2) DEFAULT 0,
  additional_total DECIMAL(12,2) DEFAULT 0,
  grand_total DECIMAL(12,2) DEFAULT 0,
  nights INTEGER NOT NULL,
  daily_average DECIMAL(12,2) DEFAULT 0,
  
  -- Información del cliente (CORREGIDO: usar "Client" con mayúscula)
  client_id BIGINT REFERENCES "Client"(id),
  
  -- Comentarios y estado
  comments TEXT,
  status VARCHAR(50) DEFAULT 'active',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_modular_reservations_reservation_id ON modular_reservations(reservation_id);
CREATE INDEX IF NOT EXISTS idx_modular_reservations_client_id ON modular_reservations(client_id);
CREATE INDEX IF NOT EXISTS idx_modular_reservations_package_modular_id ON modular_reservations(package_modular_id);
CREATE INDEX IF NOT EXISTS idx_modular_reservations_status ON modular_reservations(status);
CREATE INDEX IF NOT EXISTS idx_modular_reservations_created_at ON modular_reservations(created_at);

-- 4. Crear función y trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_modular_reservations_updated_at ON modular_reservations;
CREATE TRIGGER update_modular_reservations_updated_at 
  BEFORE UPDATE ON modular_reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Habilitar RLS
ALTER TABLE modular_reservations ENABLE ROW LEVEL SECURITY;

-- 6. Crear habitaciones básicas si no existen
INSERT INTO rooms (id, name, capacity, price_per_night, room_type, description, status, created_at, updated_at)
VALUES 
  (1, 'suite_junior', 2, 60000, 'suite', 'Suite Junior con vista al jardín', 'available', NOW(), NOW()),
  (2, 'habitacion_estandar', 2, 50000, 'standard', 'Habitación estándar con todas las comodidades', 'available', NOW(), NOW()),
  (3, 'suite_matrimonial', 2, 70000, 'suite', 'Suite matrimonial con jacuzzi', 'available', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  capacity = EXCLUDED.capacity,
  price_per_night = EXCLUDED.price_per_night,
  room_type = EXCLUDED.room_type,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 7. Verificar que todo esté correcto
SELECT 'VERIFICACIÓN DE TABLAS:' as info;

SELECT 'Tabla modular_reservations:' as tabla, count(*) as registros FROM modular_reservations
UNION ALL
SELECT 'Tabla rooms:' as tabla, count(*) as registros FROM rooms
UNION ALL
SELECT 'Tabla Client:' as tabla, count(*) as registros FROM "Client"
UNION ALL
SELECT 'Tabla reservations:' as tabla, count(*) as registros FROM reservations
UNION ALL
SELECT 'Tabla products_modular:' as tabla, count(*) as registros FROM products_modular
UNION ALL
SELECT 'Tabla packages_modular:' as tabla, count(*) as registros FROM packages_modular;

SELECT 'HABITACIONES DISPONIBLES:' as info;
SELECT id, name, capacity, price_per_night, status FROM rooms;

SELECT 'PRODUCTOS MODULARES DE HABITACIONES:' as info;
SELECT id, code, name, price, category FROM products_modular WHERE category = 'alojamiento';

SELECT 'PAQUETES MODULARES:' as info;
SELECT id, code, name FROM packages_modular WHERE is_active = true;

SELECT '✅ SETUP COMPLETO - RESERVAS MODULARES LISTAS' as status; 