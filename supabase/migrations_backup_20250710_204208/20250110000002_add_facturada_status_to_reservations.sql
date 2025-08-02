-- ================================================
-- AGREGAR ESTADO "FACTURADA" A RESERVAS
-- ================================================

-- 1. Agregar comentario a la columna status para documentar el nuevo estado
COMMENT ON COLUMN reservations.status IS 'Estados: prereserva, confirmada, en_curso, finalizada, facturada, cancelled';

-- 2. Actualizar reservas que ya tienen facturas para marcarlas como facturadas
UPDATE reservations 
SET status = 'facturada', updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT reservation_id 
  FROM invoices 
  WHERE reservation_id IS NOT NULL
) AND status = 'finalizada';

-- 3. Crear índice para mejorar consultas por estado
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- 4. Crear vista para reservas listas para facturar
CREATE OR REPLACE VIEW reservations_to_invoice AS
SELECT 
  r.id,
  r.guest_name,
  r.guest_email,
  r.check_in,
  r.check_out,
  r.total_amount,
  r.status,
  r.created_at,
  c.id as client_id,
  c.nombrePrincipal,
  c.apellido,
  c.email as client_email,
  COALESCE(COUNT(rp.id), 0) as payments_count,
  COALESCE(SUM(rp.amount), 0) as total_paid,
  COALESCE(COUNT(rprod.id), 0) as products_count
FROM reservations r
LEFT JOIN "Client" c ON r.client_id = c.id
LEFT JOIN reservation_payments rp ON r.id = rp.reservation_id
LEFT JOIN reservation_products rprod ON r.id = rprod.reservation_id
WHERE r.status = 'finalizada'
  AND r.id NOT IN (
    SELECT DISTINCT reservation_id 
    FROM invoices 
    WHERE reservation_id IS NOT NULL
  )
GROUP BY r.id, c.id, c.nombrePrincipal, c.apellido, c.email
ORDER BY r.created_at DESC;

-- 5. Crear función para marcar reserva como facturada
CREATE OR REPLACE FUNCTION mark_reservation_as_invoiced(reservation_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE reservations 
  SET status = 'facturada', updated_at = NOW()
  WHERE id = reservation_id AND status = 'finalizada';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear trigger para actualizar automáticamente el estado cuando se crea una factura
CREATE OR REPLACE FUNCTION update_reservation_status_on_invoice()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reservation_id IS NOT NULL THEN
    UPDATE reservations 
    SET status = 'facturada', updated_at = NOW()
    WHERE id = NEW.reservation_id AND status = 'finalizada';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_update_reservation_status_on_invoice ON invoices;
CREATE TRIGGER trigger_update_reservation_status_on_invoice
  AFTER INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_reservation_status_on_invoice();

-- 7. Agregar comentarios para documentación
COMMENT ON VIEW reservations_to_invoice IS 'Vista que muestra reservas finalizadas listas para generar facturas';
COMMENT ON FUNCTION mark_reservation_as_invoiced IS 'Función para marcar una reserva como facturada';
COMMENT ON FUNCTION update_reservation_status_on_invoice IS 'Trigger function para actualizar estado de reserva al crear factura'; 