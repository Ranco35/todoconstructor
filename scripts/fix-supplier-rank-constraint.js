require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSupplierRankConstraint() {
  console.log('🔧 Corrigiendo restricción de supplierRank...');
  
  try {
    // 1. Verificar valores actuales en la base de datos
    console.log('\n📊 Verificando valores actuales de supplierRank...');
    const { data: currentValues, error: currentError } = await supabase
      .from('Supplier')
      .select('id, name, supplierRank')
      .order('id');

    if (currentError) {
      console.error('❌ Error obteniendo valores actuales:', currentError);
      return;
    }

    console.log('Valores actuales de supplierRank:');
    const uniqueRanks = [...new Set(currentValues.map(s => s.supplierRank).filter(Boolean))];
    uniqueRanks.forEach(rank => {
      const count = currentValues.filter(s => s.supplierRank === rank).length;
      console.log(`   ${rank}: ${count} proveedores`);
    });

    // 2. Eliminar la restricción actual
    console.log('\n🗑️ Eliminando restricción actual...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "Supplier" DROP CONSTRAINT IF EXISTS "check_supplier_rank_values";'
    });

    if (dropError) {
      console.error('❌ Error eliminando restricción:', dropError);
      return;
    }

    console.log('✅ Restricción eliminada');

    // 3. Crear nueva restricción con valores correctos
    console.log('\n🔧 Creando nueva restricción...');
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE "Supplier" 
        ADD CONSTRAINT "check_supplier_rank_values" 
        CHECK ("supplierRank" IS NULL OR "supplierRank" IN (
          'BASICO', 'REGULAR', 'BUENO', 'EXCELENTE', 'PREMIUM', 'PART_TIME'
        ));
      `
    });

    if (addError) {
      console.error('❌ Error creando nueva restricción:', addError);
      return;
    }

    console.log('✅ Nueva restricción creada');

    // 4. Mapear valores antiguos a nuevos si es necesario
    console.log('\n🔄 Mapeando valores antiguos a nuevos...');
    
    const rankMapping = {
      'BRONZE': 'BASICO',
      'SILVER': 'REGULAR', 
      'GOLD': 'BUENO',
      'PLATINUM': 'EXCELENTE'
    };

    for (const [oldRank, newRank] of Object.entries(rankMapping)) {
      const { data: updated, error: updateError } = await supabase
        .from('Supplier')
        .update({ supplierRank: newRank })
        .eq('supplierRank', oldRank)
        .select('id, name, supplierRank');

      if (updateError) {
        console.error(`❌ Error actualizando ${oldRank} a ${newRank}:`, updateError);
      } else if (updated && updated.length > 0) {
        console.log(`✅ ${updated.length} proveedores actualizados de ${oldRank} a ${newRank}`);
      }
    }

    // 5. Verificar resultado final
    console.log('\n📊 Verificando resultado final...');
    const { data: finalValues, error: finalError } = await supabase
      .from('Supplier')
      .select('id, name, supplierRank')
      .order('id');

    if (finalError) {
      console.error('❌ Error obteniendo valores finales:', finalError);
      return;
    }

    console.log('Valores finales de supplierRank:');
    const finalUniqueRanks = [...new Set(finalValues.map(s => s.supplierRank).filter(Boolean))];
    finalUniqueRanks.forEach(rank => {
      const count = finalValues.filter(s => s.supplierRank === rank).length;
      console.log(`   ${rank}: ${count} proveedores`);
    });

    // 6. Verificar que no hay valores inválidos
    const invalidRanks = finalValues
      .filter(s => s.supplierRank && !['BASICO', 'REGULAR', 'BUENO', 'EXCELENTE', 'PREMIUM', 'PART_TIME'].includes(s.supplierRank))
      .map(s => ({ id: s.id, name: s.name, rank: s.supplierRank }));

    if (invalidRanks.length > 0) {
      console.log('\n⚠️ Valores inválidos encontrados:');
      invalidRanks.forEach(s => {
        console.log(`   ID ${s.id}: ${s.name} - ${s.rank}`);
      });
    } else {
      console.log('\n✅ Todos los valores son válidos');
    }

    console.log('\n🎯 Restricción de supplierRank corregida exitosamente');
    console.log('Valores permitidos: BASICO, REGULAR, BUENO, EXCELENTE, PREMIUM, PART_TIME');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

fixSupplierRankConstraint(); 