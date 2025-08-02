const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyServiceCounterMigration() {
  console.log('🚀 Aplicando migración para agregar campo servicesSold usando método directo...');

  try {
    // Verificar si la columna ya existe
    console.log('🔍 Verificando si la columna servicesSold ya existe...');
    const { data: existingProducts, error: checkError } = await supabase
      .from('Product')
      .select('id, servicesSold')
      .limit(1);

    if (checkError && checkError.code === '42703') {
      console.log('📝 La columna servicesSold no existe. Necesitamos agregarla manualmente desde el panel de Supabase.');
      console.log(`
⚠️  ACCIÓN MANUAL REQUERIDA:
1. Ve al panel de Supabase: https://supabase.com/dashboard/projects
2. Abre tu proyecto y ve a "SQL Editor"
3. Ejecuta este SQL:

ALTER TABLE "Product" 
ADD COLUMN "servicesSold" INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS "idx_product_services_sold" ON "Product"("servicesSold");

COMMENT ON COLUMN "Product"."servicesSold" IS 'Contador de servicios vendidos (solo aplica para productos tipo SERVICIO)';

UPDATE "Product" 
SET "servicesSold" = 0 
WHERE "type" = 'SERVICIO' AND "servicesSold" IS NULL;

4. Después ejecuta este script nuevamente para verificar.
      `);
      return;
    }

    if (!checkError) {
      console.log('✅ La columna servicesSold ya existe!');
      
      // Verificar productos de servicio
      const { data: serviceProducts, error: verifyError } = await supabase
        .from('Product')
        .select('id, name, type, servicesSold')
        .eq('type', 'SERVICIO')
        .limit(10);

      if (verifyError) {
        console.error('❌ Error en verificación:', verifyError);
        return;
      }

      console.log(`📊 Productos tipo SERVICIO encontrados: ${serviceProducts?.length || 0}`);
      
      if (serviceProducts && serviceProducts.length > 0) {
        console.log('📋 Productos SERVICIO:');
        serviceProducts.forEach(p => {
          console.log(`  - ${p.name} (ID: ${p.id}) - Servicios vendidos: ${p.servicesSold || 0}`);
        });
      }

      // Asegurar que todos los servicios tengan el contador inicializado
      console.log('🔄 Asegurando que todos los servicios tengan contador inicializado...');
      const { data: updatedProducts, error: updateError } = await supabase
        .from('Product')
        .update({ servicesSold: 0 })
        .eq('type', 'SERVICIO')
        .is('servicesSold', null)
        .select('id, name');

      if (updateError) {
        console.error('❌ Error al inicializar contadores:', updateError);
      } else {
        console.log(`✅ Inicializados ${updatedProducts?.length || 0} productos de servicio sin contador.`);
      }

      console.log('🎉 Sistema listo! El campo servicesSold está disponible para productos de tipo SERVICIO.');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar verificación/migración
applyServiceCounterMigration(); 