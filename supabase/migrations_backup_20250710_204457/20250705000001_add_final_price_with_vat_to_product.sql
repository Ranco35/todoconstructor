-- 1. Agregar columna para precio final con IVA
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS final_price_with_vat numeric(12,2);

-- 2. Trigger para actualizar final_price_with_vat automáticamente
CREATE OR REPLACE FUNCTION update_final_price_with_vat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.final_price_with_vat := ROUND(COALESCE(NEW.saleprice,0) * (1 + COALESCE(NEW.vat,0)/100), 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_final_price_with_vat ON "Product";
CREATE TRIGGER trg_update_final_price_with_vat
BEFORE INSERT OR UPDATE ON "Product"
FOR EACH ROW EXECUTE FUNCTION update_final_price_with_vat();

-- 3. Actualizar todos los productos existentes
UPDATE "Product" SET final_price_with_vat = ROUND(COALESCE(saleprice,0) * (1 + COALESCE(vat,0)/100), 2); 