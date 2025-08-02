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

async function verifySupplierDetails() {
  console.log('🔍 Verificando detalles de proveedores (etiquetas y categorías)...');
  
  try {
    // Obtener todos los proveedores con sus etiquetas
    const { data: suppliers, error: suppliersError } = await supabase
      .from('Supplier')
      .select(`
        id,
        name,
        supplierRank,
        category,
        active,
        etiquetas:SupplierTagAssignment(
          id,
          etiquetaId,
          etiqueta:SupplierTag(
            id,
            nombre,
            color,
            icono,
            activo
          )
        )
      `)
      .order('id', { ascending: true });

    if (suppliersError) {
      console.error('❌ Error obteniendo proveedores:', suppliersError);
      return;
    }

    console.log(`\n📊 Total de proveedores encontrados: ${suppliers.length}`);
    console.log('\n' + '='.repeat(80));

    suppliers.forEach((supplier, index) => {
      console.log(`\n${index + 1}. ${supplier.name} (ID: ${supplier.id})`);
      console.log(`   📍 Tipo: ${supplier.supplierRank || 'Sin tipo'}`);
      console.log(`   🏷️  Categoría: ${supplier.category || 'Sin categoría'}`);
      console.log(`   ✅ Estado: ${supplier.active ? 'Activo' : 'Inactivo'}`);
      
      if (supplier.etiquetas && supplier.etiquetas.length > 0) {
        console.log(`   🏷️  Etiquetas (${supplier.etiquetas.length}):`);
        supplier.etiquetas.forEach((assignment, tagIndex) => {
          const tag = assignment.etiqueta;
          if (tag) {
            console.log(`      ${tagIndex + 1}. ${tag.nombre} (${tag.icono})`);
          }
        });
      } else {
        console.log('   🏷️  Etiquetas: Sin etiquetas asignadas');
      }
      
      console.log('   ' + '-'.repeat(60));
    });

    // Estadísticas
    const stats = {
      total: suppliers.length,
      withCategory: suppliers.filter(s => s.category).length,
      withTags: suppliers.filter(s => s.etiquetas && s.etiquetas.length > 0).length,
      active: suppliers.filter(s => s.active).length,
      partTime: suppliers.filter(s => s.category === 'Part-Time').length
    };

    console.log('\n📈 ESTADÍSTICAS:');
    console.log(`   Total proveedores: ${stats.total}`);
    console.log(`   Con categoría: ${stats.withCategory} (${Math.round(stats.withCategory/stats.total*100)}%)`);
    console.log(`   Con etiquetas: ${stats.withTags} (${Math.round(stats.withTags/stats.total*100)}%)`);
    console.log(`   Activos: ${stats.active} (${Math.round(stats.active/stats.total*100)}%)`);
    console.log(`   Part-Time: ${stats.partTime}`);

    // Verificar proveedores part-time específicamente
    const partTimeSuppliers = suppliers.filter(s => s.category === 'Part-Time');
    if (partTimeSuppliers.length > 0) {
      console.log('\n👥 PROVEEDORES PART-TIME:');
      partTimeSuppliers.forEach((supplier, index) => {
        console.log(`   ${index + 1}. ${supplier.name} - ${supplier.supplierRank || 'Sin tipo'}`);
      });
    }

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
}

verifySupplierDetails(); 