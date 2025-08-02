-- ================================================
-- INTEGRACIÓN DE CLIENTES CON MÓDULO DE RESERVAS
-- ================================================

-- Agregar columna client_id a la tabla reservations para referenciar a la tabla Client
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS client_id BIGINT;

-- Crear la foreign key constraint
ALTER TABLE reservations 
ADD CONSTRAINT fk_reservations_client 
FOREIGN KEY (client_id) REFERENCES "Client"(id);

-- Crear índice para mejorar rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_reservations_client_id ON reservations(client_id);

-- Comentarios de documentación
COMMENT ON COLUMN reservations.client_id IS 'Referencia al cliente registrado en el sistema de clientes del hotel'; 