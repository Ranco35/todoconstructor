-- ================================================
-- SOLUCIÓN FINAL CORREGIDA PARA RESERVAS MODULARES
-- ================================================

-- 1. Eliminar tabla si existe (para recrearla correctamente)
DROP TABLE IF EXISTS modular_reservations;

-- 2. Crear tabla modular_reservations con referencias correctas
CREATE TABLE modular_reservations (
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

-- 6. Crear habitaciones adicionales con códigos cortos (CORREGIDO: máximo 10 caracteres)
INSERT INTO rooms (number, type, capacity, floor, price_per_night) VALUES
('STD', 'Habitación Estándar', 2, 2, 50000),
('JR', 'Suite Junior', 2, 1, 60000),
('MAT', 'Suite Matrimonial', 2, 3, 70000),
('PREM', 'Suite Premium', 4, 3, 85000)
ON CONFLICT (number) DO UPDATE SET
  type = EXCLUDED.type,
  capacity = EXCLUDED.capacity,
  price_per_night = EXCLUDED.price_per_night;

-- 7. Verificar que todo esté correcto
SELECT 'VERIFICACIÓN DE TABLAS:' as info, '' as detalle;

SELECT 'Tabla modular_reservations:' as tabla, count(*)::text as registros FROM modular_reservations
UNION ALL
SELECT 'Tabla rooms:' as tabla, count(*)::text as registros FROM rooms
UNION ALL
SELECT 'Tabla Client:' as tabla, count(*)::text as registros FROM "Client"
UNION ALL
SELECT 'Tabla reservations:' as tabla, count(*)::text as registros FROM reservations
UNION ALL
SELECT 'Tabla products_modular:' as tabla, count(*)::text as registros FROM products_modular
UNION ALL
SELECT 'Tabla packages_modular:' as tabla, count(*)::text as registros FROM packages_modular;

SELECT 'HABITACIONES DISPONIBLES:' as info, '' as detalle;
SELECT number as info, CONCAT(type, ' - $', price_per_night::text) as detalle FROM rooms ORDER BY number;

SELECT 'PRODUCTOS MODULARES DE HABITACIONES:' as info, '' as detalle;
SELECT code as info, CONCAT(name, ' - $', price::text) as detalle FROM products_modular WHERE category = 'alojamiento';

SELECT 'PAQUETES MODULARES:' as info, '' as detalle;
SELECT code as info, name as detalle FROM packages_modular WHERE is_active = true;

-- 8. Mapeo de códigos modulares a habitaciones reales
SELECT 'MAPEO DE CÓDIGOS:' as info, '' as detalle;
SELECT 'suite_junior → JR' as info, 'Código modular → Habitación real' as detalle
UNION ALL
SELECT 'habitacion_estandar → STD' as info, 'Código modular → Habitación real' as detalle
UNION ALL
SELECT 'suite_matrimonial → MAT' as info, 'Código modular → Habitación real' as detalle;

SELECT '✅ SETUP COMPLETO - RESERVAS MODULARES LISTAS' as info, 'Códigos cortos creados correctamente' as detalle; 