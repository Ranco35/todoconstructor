const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductRelatedTables() {
  console.log('🔍 Verificando tablas relacionadas con productos...');
  
  const tablesToCheck = [
    'Product_State',
    'Product_Stock',
    'Product_Type',
    'Product_Component',
    'Product_Usage',
    'Warehouse_Product'
  ];

  for (const tableName of tablesToCheck) {
    try {
      console.log(`\n📋 Verificando tabla: ${tableName}`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Tabla ${tableName} no existe o no es accesible:`, error.message);
      } else {
        console.log(`✅ Tabla ${tableName} existe`);
        if (data && data.length > 0) {
          console.log(`📄 Columnas:`, Object.keys(data[0]));
          console.log(`📊 Ejemplo:`, data[0]);
        } else {
          console.log(`📄 Tabla vacía`);
        }
      }
    } catch (error) {
      console.log(`❌ Error accediendo a ${tableName}:`, error.message);
    }
  }

  // Verificar específicamente Warehouse_Product para el producto 11
  console.log('\n🔍 Verificando Warehouse_Product para producto ID 11...');
  try {
    const { data: warehouseProducts, error } = await supabase
      .from('Warehouse_Product')
      .select('*')
      .eq('productId', 11);

    if (error) {
      console.log('❌ Error consultando Warehouse_Product:', error.message);
    } else {
      console.log(`✅ Warehouse_Product consulta exitosa`);
      console.log(`📊 Productos en bodegas para ID 11:`, warehouseProducts);
    }
  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

checkProductRelatedTables(); 