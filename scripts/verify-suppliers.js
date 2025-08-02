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

async function verifySuppliers() {
  console.log('🔍 Verificando proveedores creados...');
  
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
    
    // Mostrar todos los proveedores
    allSuppliers.forEach((supplier, index) => {
      console.log(`\n${index + 1}. ${supplier.name}`);
      console.log(`   ID: ${supplier.id}`);
      console.log(`   RUT: ${supplier.taxId || 'N/A'}`);
      console.log(`   Email: ${supplier.email || 'N/A'}`);
      console.log(`   Teléfono: ${supplier.phone || 'N/A'}`);
      console.log(`   Tipo: ${supplier.companyType || 'N/A'}`);
      console.log(`   Rango: ${supplier.rank || 'N/A'}`);
      console.log(`   Activo: ${supplier.isActive ? 'Sí' : 'No'}`);
      console.log(`   Ciudad: ${supplier.city || 'N/A'}`);
      if (supplier.notes) {
        console.log(`   Notas: ${supplier.notes}`);
      }
    });

    // Filtrar proveedores part-time
    const partTimeSuppliers = allSuppliers.filter(s => s.rank === 'PART_TIME');
    console.log(`\n🎯 Proveedores Part-Time: ${partTimeSuppliers.length}`);
    
    partTimeSuppliers.forEach((supplier, index) => {
      console.log(`   ${index + 1}. ${supplier.name} (${supplier.taxId})`);
    });

    // Verificar que hay al menos 5 proveedores part-time
    if (partTimeSuppliers.length >= 5) {
      console.log('\n✅ ¡Sistema de proveedores configurado correctamente!');
      console.log('🎉 El módulo de pagos a proveedores está listo para usar.');
    } else {
      console.log('\n⚠️  Advertencia: Menos de 5 proveedores part-time encontrados.');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

verifySuppliers()
  .then(() => {
    console.log('\n🏁 Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  }); 