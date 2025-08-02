-- MEJORA COMPLETA DEL SISTEMA DE HABITACIONES
-- Agregar campos para gestión profesional de habitaciones

-- Capacidad mejorada
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 0;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS child_capacity INTEGER DEFAULT 0;

-- Configuración de camas (JSON)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS bed_config JSONB DEFAULT '[]';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS extra_bed_available BOOLEAN DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS extra_bed_price DECIMAL(8,2) DEFAULT 0;

-- Ubicación y vista
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS building VARCHAR(50);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS view_type VARCHAR(50);

-- Servicios básicos
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS wifi BOOLEAN DEFAULT true;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS minibar BOOLEAN DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS balcony BOOLEAN DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS jacuzzi BOOLEAN DEFAULT false;

-- Precios por temporadas
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS price_low_season DECIMAL(10,2);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS price_mid_season DECIMAL(10,2);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS price_high_season DECIMAL(10,2);

-- Estado de la habitación
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_status VARCHAR(20) DEFAULT 'available';

-- Actualizar datos existentes
UPDATE rooms SET 
  max_capacity = capacity + 1,
  bed_config = '[{"type": "matrimonial", "quantity": 1}]'::jsonb,
  building = 'Modulo 1',
  view_type = 'jardín',
  price_low_season = price_per_night * 0.8,
  price_mid_season = price_per_night * 1.0,
  price_high_season = price_per_night * 1.3,
  extra_bed_available = true,
  extra_bed_price = 25000
WHERE max_capacity IS NULL; 