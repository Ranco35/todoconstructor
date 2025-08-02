const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductTable() {
  console.log('🔍 Verificando estructura de tabla Product...');
  
  try {
    // Verificar si la tabla Product existe
    const { data: products, error: productError } = await supabase
      .from('Product')
      .select('*')
      .limit(1);

    if (productError) {
      console.error('❌ Error accediendo a tabla Product:', productError);
      return;
    }

    console.log('✅ Tabla Product existe');
    
    // Obtener estructura de la tabla
    const { data: columns, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: 'Product' });

    if (columnError) {
      console.log('⚠️ No se pudo obtener estructura automáticamente, probando consulta manual...');
      
      // Consulta manual para obtener estructura
      const { data: sampleProduct, error: sampleError } = await supabase
        .from('Product')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.error('❌ Error en consulta manual:', sampleError);
        return;
      }

      if (sampleProduct && sampleProduct.length > 0) {
        console.log('📋 Columnas encontradas:', Object.keys(sampleProduct[0]));
        console.log('📄 Ejemplo de registro:', sampleProduct[0]);
      }
    } else {
      console.log('📋 Estructura de columnas:', columns);
    }

    // Verificar relaciones
    console.log('\n🔗 Verificando relaciones...');
    
    // Verificar Category
    const { data: categories, error: categoryError } = await supabase
      .from('Category')
      .select('id, name')
      .limit(5);

    if (categoryError) {
      console.log('⚠️ No se pudo acceder a tabla Category:', categoryError.message);
    } else {
      console.log('✅ Tabla Category accesible, ejemplos:', categories);
    }

    // Verificar Supplier
    const { data: suppliers, error: supplierError } = await supabase
      .from('Supplier')
      .select('id, name')
      .limit(5);

    if (supplierError) {
      console.log('⚠️ No se pudo acceder a tabla Supplier:', supplierError.message);
    } else {
      console.log('✅ Tabla Supplier accesible, ejemplos:', suppliers);
    }

    // Probar consulta con joins
    console.log('\n🧪 Probando consulta con joins...');
    const { data: productsWithJoins, error: joinError } = await supabase
      .from('Product')
      .select(`
        *,
        Category (
          id,
          name
        ),
        Supplier (
          id,
          name
        )
      `)
      .limit(3);

    if (joinError) {
      console.error('❌ Error en consulta con joins:', joinError);
    } else {
      console.log('✅ Consulta con joins exitosa');
      console.log('📄 Productos con relaciones:', productsWithJoins);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkProductTable(); 