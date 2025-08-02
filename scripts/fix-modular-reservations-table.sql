-- ================================================
-- CORREGIR TABLA DE RESERVAS MODULARES
-- ================================================

-- Eliminar tabla si existe (para recrearla correctamente)
DROP TABLE IF EXISTS modular_reservations;

-- Tabla para almacenar datos específicos del sistema modular de reservas
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

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_modular_reservations_reservation_id ON modular_reservations(reservation_id);
CREATE INDEX IF NOT EXISTS idx_modular_reservations_client_id ON modular_reservations(client_id);
CREATE INDEX IF NOT EXISTS idx_modular_reservations_package_modular_id ON modular_reservations(package_modular_id);
CREATE INDEX IF NOT EXISTS idx_modular_reservations_status ON modular_reservations(status);
CREATE INDEX IF NOT EXISTS idx_modular_reservations_created_at ON modular_reservations(created_at);

-- Trigger para updated_at (crear función si no existe)
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

-- RLS Policies
ALTER TABLE modular_reservations ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Administradores pueden ver todas las reservas modulares" ON modular_reservations;
DROP POLICY IF EXISTS "Jefes de sección pueden ver reservas modulares" ON modular_reservations;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias reservas modulares" ON modular_reservations;

-- Política para administradores (pueden ver todas las reservas)
CREATE POLICY "Administradores pueden ver todas las reservas modulares" ON modular_reservations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.roleid = 'ADMINISTRADOR'
    )
  );

-- Política para jefes de sección (pueden ver reservas de su área)
CREATE POLICY "Jefes de sección pueden ver reservas modulares" ON modular_reservations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.roleid = 'JEFE_SECCION'
    )
  );

-- Política para usuarios finales (solo pueden ver sus propias reservas)
CREATE POLICY "Usuarios pueden ver sus propias reservas modulares" ON modular_reservations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.roleid = 'USUARIO_FINAL'
    )
  );

-- Comentarios de la tabla
COMMENT ON TABLE modular_reservations IS 'Tabla para almacenar datos específicos del sistema modular de reservas';
COMMENT ON COLUMN modular_reservations.adults IS 'Número de adultos en la reserva';
COMMENT ON COLUMN modular_reservations.children IS 'Número de niños en la reserva';
COMMENT ON COLUMN modular_reservations.children_ages IS 'Array con las edades de los niños';
COMMENT ON COLUMN modular_reservations.package_modular_id IS 'ID del paquete modular seleccionado';
COMMENT ON COLUMN modular_reservations.room_code IS 'Código de la habitación seleccionada';
COMMENT ON COLUMN modular_reservations.package_code IS 'Código del paquete seleccionado';
COMMENT ON COLUMN modular_reservations.additional_products IS 'Array con códigos de productos adicionales';
COMMENT ON COLUMN modular_reservations.pricing_breakdown IS 'Desglose detallado de precios en formato JSON';
COMMENT ON COLUMN modular_reservations.client_id IS 'ID del cliente asociado a la reserva';

-- Verificar que la tabla se creó correctamente
SELECT 'Tabla modular_reservations creada exitosamente con referencia correcta a Client' as status;

-- Verificar estructura
SELECT 'Verificación de estructura:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'modular_reservations' AND table_schema = 'public'
ORDER BY ordinal_position; 