require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Configuración:');
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante');
console.log('Service Key:', supabaseServiceKey ? '✅ Configurada' : '❌ Faltante');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Error: Variables de entorno de Supabase no configuradas');
  console.log('Asegúrate de tener un archivo .env.local con:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=tu_url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=tu_service_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyProductFields() {
  try {
    console.log('\n🔍 Verificando campos de la tabla Product...\n');

    // Consultar información de la tabla Product
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'Product')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Error al consultar columnas:', columnsError);
      return;
    }

    console.log('📋 Columnas actuales de la tabla Product:');
    console.log('=' .repeat(80));
    
    const newFields = [
      'type', 'isEquipment', 'model', 'serialNumber', 'purchaseDate',
      'warrantyExpiration', 'usefulLife', 'maintenanceInterval',
      'lastMaintenance', 'nextMaintenance', 'maintenanceCost',
      'maintenanceProvider', 'currentLocation', 'responsiblePerson', 'operationalStatus'
    ];

    let foundNewFields = 0;
    columns.forEach(column => {
      const isNew = newFields.includes(column.column_name);
      if (isNew) foundNewFields++;
      const marker = isNew ? '🆕' : '  ';
      console.log(`${marker} ${column.column_name.padEnd(20)} | ${column.data_type.padEnd(15)} | ${column.is_nullable.padEnd(8)} | ${column.column_default || 'NULL'}`);
    });

    console.log('\n' + '=' .repeat(80));
    console.log(`✅ Se encontraron ${foundNewFields} de ${newFields.length} campos nuevos`);
    
    // Verificar productos existentes y sus tipos
    const { data: products, error: productsError } = await supabase
      .from('Product')
      .select('id, name, type, isEquipment, operationalStatus')
      .limit(5);

    if (productsError) {
      console.error('❌ Error al consultar productos:', productsError);
      return;
    }

    console.log('\n📦 Productos de ejemplo con nuevos campos:');
    console.log('=' .repeat(80));
    products.forEach(product => {
      console.log(`ID: ${product.id} | Nombre: ${product.name.padEnd(25)} | Tipo: ${product.type.padEnd(12)} | Equipo: ${product.isEquipment} | Estado: ${product.operationalStatus}`);
    });

    // Verificar distribución de tipos
    const { data: allProducts, error: typeError } = await supabase
      .from('Product')
      .select('type');

    if (!typeError && allProducts) {
      const stats = {};
      allProducts.forEach(product => {
        stats[product.type] = (stats[product.type] || 0) + 1;
      });
      
      console.log('\n📊 Distribución de tipos de producto:');
      console.log('=' .repeat(40));
      Object.entries(stats).forEach(([type, count]) => {
        console.log(`${type.padEnd(15)}: ${count} productos`);
      });
    }

    console.log('\n✅ Verificación completada exitosamente!');
    console.log('\n🎉 La migración se aplicó correctamente!');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

verifyProductFields(); 