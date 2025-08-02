const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Configuración del script:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurado' : '❌ Faltante');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurado' : '❌ Faltante');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ Faltante');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductTableFields() {
  try {
    console.log('\n🔍 Verificando estructura de la tabla Product...\n');

    // 1. Obtener información de la tabla Product usando SQL directo
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'Product' })
      .catch(async () => {
        // Si la función RPC no existe, usar consulta SQL directa
        console.log('⚠️ Función RPC no disponible, usando consulta SQL directa...');
        return await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default, character_maximum_length')
          .eq('table_name', 'Product')
          .eq('table_schema', 'public')
          .order('ordinal_position');
      });

    if (tableError) {
      console.error('❌ Error obteniendo información de la tabla:', tableError);
      return;
    }

    if (!tableInfo || tableInfo.length === 0) {
      console.error('❌ No se encontró la tabla Product');
      return;
    }

    console.log('📋 CAMPOS ACTUALES DE LA TABLA PRODUCT:');
    console.log('=' .repeat(80));
    
    tableInfo.forEach((column, index) => {
      const isNullable = column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const hasDefault = column.column_default ? `DEFAULT ${column.column_default}` : '';
      const dataType = column.data_type;
      const maxLength = column.character_maximum_length ? `(${column.character_maximum_length})` : '';
      
      console.log(`${index + 1}. ${column.column_name}`);
      console.log(`   Tipo: ${dataType}${maxLength}`);
      console.log(`   Nullable: ${isNullable}`);
      if (hasDefault) console.log(`   Default: ${hasDefault}`);
      console.log('');
    });

    console.log(`📊 Total de campos: ${tableInfo.length}`);

    // 2. Verificar si existe el campo 'type'
    const hasTypeField = tableInfo.some(col => col.column_name === 'type');
    console.log(`\n🔍 Campo 'type': ${hasTypeField ? '✅ Existe' : '❌ No existe'}`);

    // 3. Verificar campos relacionados con equipos
    const equipmentFields = ['isEquipment', 'model', 'serialNumber', 'purchaseDate', 'warrantyExpiration', 'operationalStatus'];
    console.log('\n🔧 CAMPOS DE EQUIPOS:');
    equipmentFields.forEach(field => {
      const exists = tableInfo.some(col => col.column_name === field);
      console.log(`${field}: ${exists ? '✅ Existe' : '❌ No existe'}`);
    });

    // 4. Mostrar algunos productos de ejemplo
    console.log('\n📦 PRODUCTOS DE EJEMPLO:');
    const { data: sampleProducts, error: sampleError } = await supabase
      .from('Product')
      .select('*')
      .limit(3);

    if (sampleError) {
      console.error('❌ Error obteniendo productos de ejemplo:', sampleError);
    } else if (sampleProducts && sampleProducts.length > 0) {
      sampleProducts.forEach((product, index) => {
        console.log(`\nProducto ${index + 1}:`);
        console.log(`  ID: ${product.id}`);
        console.log(`  Nombre: ${product.name}`);
        console.log(`  SKU: ${product.sku || 'N/A'}`);
        console.log(`  Categoría ID: ${product.categoryid || 'N/A'}`);
        console.log(`  Proveedor ID: ${product.supplierid || 'N/A'}`);
        console.log(`  Precio Costo: ${product.costprice || 'N/A'}`);
        console.log(`  Precio Venta: ${product.saleprice || 'N/A'}`);
      });
    } else {
      console.log('No hay productos en la base de datos');
    }

  } catch (error) {
    console.error('💥 Error general:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Ejecutar el script
checkProductTableFields()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error ejecutando script:', error);
    process.exit(1);
  }); 