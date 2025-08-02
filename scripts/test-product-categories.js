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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testProductCategories() {
  try {
    console.log('\n🔍 Verificando productos con categorías...\n');

    // Consultar productos con sus categorías
    const { data: products, error } = await supabase
      .from('Product')
      .select(`
        id,
        name,
        sku,
        categoryid,
        Category (
          id,
          name
        )
      `)
      .limit(10)
      .order('id', { ascending: false });

    if (error) {
      console.error('❌ Error consultando productos:', error);
      return;
    }

    console.log('📦 Productos con categorías:');
    console.log('=' .repeat(80));
    
    products.forEach(product => {
      const categoryName = product.Category?.name || 'Sin categoría';
      const categoryId = product.categoryid || 'N/A';
      console.log(`ID: ${product.id.toString().padEnd(3)} | Nombre: ${product.name.padEnd(30)} | Categoría ID: ${categoryId.toString().padEnd(3)} | Categoría: ${categoryName}`);
    });

    // Verificar si hay productos sin categoría
    const productsWithoutCategory = products.filter(p => !p.Category);
    if (productsWithoutCategory.length > 0) {
      console.log('\n⚠️ Productos sin categoría:');
      productsWithoutCategory.forEach(product => {
        console.log(`- ID: ${product.id} | ${product.name}`);
      });
    }

    // Verificar categorías disponibles
    console.log('\n📋 Categorías disponibles:');
    const { data: categories, error: categoriesError } = await supabase
      .from('Category')
      .select('id, name')
      .order('name');

    if (categoriesError) {
      console.error('❌ Error consultando categorías:', categoriesError);
    } else {
      console.log('=' .repeat(40));
      categories.forEach(category => {
        console.log(`ID: ${category.id.toString().padEnd(3)} | ${category.name}`);
      });
    }

    // Probar la consulta completa como en getProducts
    console.log('\n🧪 Probando consulta completa (como getProducts):');
    const { data: fullProducts, error: fullError } = await supabase
      .from('Product')
      .select(`
        *,
        Category (*),
        Supplier (*)
      `)
      .limit(3)
      .order('id', { ascending: false });

    if (fullError) {
      console.error('❌ Error en consulta completa:', fullError);
    } else {
      console.log('✅ Consulta completa exitosa:');
      fullProducts.forEach(product => {
        console.log(`- ${product.name}: Categoría = ${product.Category?.name || 'Sin categoría'}`);
      });
    }

    console.log('\n✅ Verificación completada!');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

testProductCategories(); 