const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyProductFields() {
  try {
    console.log('🔍 Verificando campos de la tabla Product...\n');

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

    columns.forEach(column => {
      const isNew = newFields.includes(column.column_name);
      const marker = isNew ? '🆕' : '  ';
      console.log(`${marker} ${column.column_name.padEnd(20)} | ${column.data_type.padEnd(15)} | ${column.is_nullable.padEnd(8)} | ${column.column_default || 'NULL'}`);
    });

    console.log('\n' + '=' .repeat(80));
    
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
    const { data: typeStats, error: typeError } = await supabase
      .from('Product')
      .select('type')
      .then(result => {
        if (result.error) return result;
        
        const stats = {};
        result.data.forEach(product => {
          stats[product.type] = (stats[product.type] || 0) + 1;
        });
        return { data: stats, error: null };
      });

    if (!typeError) {
      console.log('\n📊 Distribución de tipos de producto:');
      console.log('=' .repeat(40));
      Object.entries(typeStats).forEach(([type, count]) => {
        console.log(`${type.padEnd(15)}: ${count} productos`);
      });
    }

    console.log('\n✅ Verificación completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

verifyProductFields(); 