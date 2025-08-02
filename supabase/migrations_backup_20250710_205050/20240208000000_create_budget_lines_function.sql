-- Función para obtener líneas del presupuesto con información del producto
-- Usa JOIN manual para evitar problemas con foreign keys

CREATE OR REPLACE FUNCTION get_budget_lines_with_product(budget_id bigint)
RETURNS TABLE (
    id bigint,
    quote_id bigint,
    product_id bigint,
    product_name text,
    description varchar(255),
    quantity numeric(10,2),
    unit_price numeric(18,2),
    discount_percent numeric(5,2),
    taxes jsonb,
    subtotal numeric(18,2)
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        sql.id,
        sql.quote_id,
        sql.product_id,
        p.name as product_name,
        sql.description,
        sql.quantity,
        sql.unit_price,
        sql.discount_percent,
        sql.taxes,
        sql.subtotal
    FROM sales_quote_lines sql
    LEFT JOIN "Product" p ON sql.product_id = p.id
    WHERE sql.quote_id = budget_id
    ORDER BY sql.id;
$$;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION get_budget_lines_with_product(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION get_budget_lines_with_product(bigint) TO anon; 