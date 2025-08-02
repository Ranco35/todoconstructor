-- Agregar relación jerárquica a EconomicSector
-- Esta migración agrega la capacidad de tener sectores padre/hijo

-- Crear tabla EconomicSector y jerarquía
CREATE TABLE IF NOT EXISTS "EconomicSector" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "parentId" BIGINT REFERENCES "EconomicSector"("id"),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Crear política RLS solo si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Enable all for service role' AND tablename = 'EconomicSector'
  ) THEN
    EXECUTE 'CREATE POLICY "Enable all for service role" ON "EconomicSector" FOR ALL USING (true)';
  END IF;
END $$;

-- Agregar columna sectorPadreId si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'EconomicSector' 
        AND column_name = 'sectorPadreId'
    ) THEN
        ALTER TABLE "EconomicSector" ADD COLUMN "sectorPadreId" BIGINT;
    END IF;
END $$;

-- Agregar la foreign key si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'EconomicSector_sectorPadreId_fkey'
    ) THEN
        ALTER TABLE "EconomicSector" 
        ADD CONSTRAINT "EconomicSector_sectorPadreId_fkey" 
        FOREIGN KEY ("sectorPadreId") REFERENCES "EconomicSector"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- Crear índice para mejorar el rendimiento de las consultas jerárquicas
CREATE INDEX IF NOT EXISTS "idx_economic_sector_padre" ON "EconomicSector"("sectorPadreId");

-- Actualizar algunos sectores existentes para crear una jerarquía básica
UPDATE "EconomicSector" SET "sectorPadreId" = (
    SELECT id FROM "EconomicSector" WHERE nombre = 'Servicios'
) WHERE nombre IN ('Salud', 'Educación', 'Turismo', 'Transporte');

UPDATE "EconomicSector" SET "sectorPadreId" = (
    SELECT id FROM "EconomicSector" WHERE nombre = 'Tecnología'
) WHERE nombre = 'Tecnología' AND "sectorPadreId" IS NULL;

-- Agregar algunos subsectores de ejemplo
INSERT INTO "EconomicSector" ("nombre", "descripcion", "sectorPadreId") VALUES
('Software', 'Desarrollo de software y aplicaciones', (SELECT id FROM "EconomicSector" WHERE nombre = 'Tecnología')),
('Hardware', 'Venta y distribución de hardware', (SELECT id FROM "EconomicSector" WHERE nombre = 'Tecnología')),
('Consultoría IT', 'Consultoría en tecnologías de la información', (SELECT id FROM "EconomicSector" WHERE nombre = 'Tecnología')),
('Comercio Minorista', 'Venta al por menor', (SELECT id FROM "EconomicSector" WHERE nombre = 'Comercio')),
('Comercio Mayorista', 'Venta al por mayor', (SELECT id FROM "EconomicSector" WHERE nombre = 'Comercio')),
('Construcción Residencial', 'Construcción de viviendas', (SELECT id FROM "EconomicSector" WHERE nombre = 'Construcción')),
('Construcción Comercial', 'Construcción de edificios comerciales', (SELECT id FROM "EconomicSector" WHERE nombre = 'Construcción'))
ON CONFLICT ("nombre") DO NOTHING; 