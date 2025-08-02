-- SOLUCIÓN MÍNIMA: Solo el UPDATE necesario

UPDATE reservations 
SET status = 'en_curso', updated_at = NOW()
WHERE id = (
    SELECT reservation_id 
    FROM modular_reservations 
    WHERE id = 132
);