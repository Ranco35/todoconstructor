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

async function updatePartTimeCategory() {
  console.log('🔍 Verificando y actualizando categorías de proveedores part-time...');
  
  try {
    // Obtener todos los proveedores
    const { data: allSuppliers, error: allError } = await supabase
      .from('Supplier')
      .select('*')
      .order('id', { ascending: true });

    if (allError) {
      console.error('❌ Error obteniendo proveedores:', allError);
      return;
    }

    console.log(`📊 Total de proveedores en la base de datos: ${allSuppliers.length}`);
    
    // Filtrar proveedores part-time (por supplierRank = 'PART_TIME')
    const partTimeSuppliers = allSuppliers.filter(s => s.supplierRank === 'PART_TIME' || s.rank === 'PART_TIME');
    console.log(`🎯 Proveedores Part-Time encontrados: ${partTimeSuppliers.length}`);
    
    // Mostrar proveedores part-time actuales
    partTimeSuppliers.forEach((supplier, index) => {
      console.log(`\n${index + 1}. ${supplier.name}`);
      console.log(`   ID: ${supplier.id}`);
      console.log(`   RUT: ${supplier.taxId || 'N/A'}`);
      console.log(`   Email: ${supplier.email || 'N/A'}`);
      console.log(`   Teléfono: ${supplier.phone || 'N/A'}`);
      console.log(`   Tipo: ${supplier.companyType || 'N/A'}`);
      console.log(`   Rango: ${supplier.supplierRank || supplier.rank || 'N/A'}`);
      console.log(`   Categoría actual: ${supplier.category || 'Sin categoría'}`);
      console.log(`   Activo: ${supplier.isActive ? 'Sí' : 'No'}`);
      console.log(`   Ciudad: ${supplier.city || 'N/A'}`);
    });

    // Actualizar categoría de proveedores part-time
    console.log('\n🔄 Actualizando categorías...');
    const results = [];
    
    for (const supplier of partTimeSuppliers) {
      console.log(`📝 Actualizando proveedor: ${supplier.name}`);
      
      const { data, error } = await supabase
        .from('Supplier')
        .update({ category: 'Part-Time' })
        .eq('id', supplier.id)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error actualizando ${supplier.name}:`, error);
        results.push({ name: supplier.name, success: false, error: error.message });
      } else {
        console.log(`✅ Proveedor actualizado: ${supplier.name} - Categoría: ${data.category}`);
        results.push({ name: supplier.name, success: true, category: data.category });
      }
    }
    
    // Resumen
    console.log('\n📊 RESUMEN DE ACTUALIZACIÓN:');
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Exitosos: ${successful.length}`);
    successful.forEach(s => console.log(`   - ${s.name} (Categoría: ${s.category})`));
    
    if (failed.length > 0) {
      console.log(`❌ Fallidos: ${failed.length}`);
      failed.forEach(f => console.log(`   - ${f.name}: ${f.error}`));
    }
    
    console.log(`\n🎯 Total: ${results.length} proveedores procesados`);
    
    if (successful.length > 0) {
      console.log('\n🎉 ¡Categorías actualizadas exitosamente!');
      console.log('Ahora el selector de proveedores part-time funcionará con la categoría "Part-Time".');
    }

    // Verificar el resultado final
    console.log('\n🔍 Verificación final...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('Supplier')
      .select('id, name, category, supplierRank')
      .eq('category', 'Part-Time');

    if (finalError) {
      console.error('❌ Error en verificación final:', finalError);
    } else {
      console.log(`✅ Proveedores con categoría "Part-Time": ${finalCheck.length}`);
      finalCheck.forEach(s => {
        console.log(`   - ${s.name} (ID: ${s.id}, Rango: ${s.supplierRank})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
updatePartTimeCategory()
  .then(() => {
    console.log('🏁 Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  }); 