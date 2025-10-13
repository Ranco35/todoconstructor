require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableRelationships() {
  console.log('🔍 Verificando estructura de tablas...');
  
  // 1. Verificar estructura de tabla Product
  const { data: productSample, error: productError } = await supabase
    .from('Product')
    .select('*')
    .limit(1);
    
  if (productError) {
    console.error('❌ Error accediendo a Product:', productError);
    return;
  }
  
  if (productSample && productSample.length > 0) {
    console.log('📋 Columnas en tabla Product:');
    Object.keys(productSample[0]).forEach(column => {
      console.log(`  - ${column}: ${typeof productSample[0][column]}`);
    });
  }
  
  // 2. Verificar estructura de tabla Category
  const { data: categorySample, error: categoryError } = await supabase
    .from('Category')
    .select('*')
    .limit(1);
    
  if (categoryError) {
    console.error('❌ Error accediendo a Category:', categoryError);
    return;
  }
  
  if (categorySample && categorySample.length > 0) {
    console.log('\n📋 Columnas en tabla Category:');
    Object.keys(categorySample[0]).forEach(column => {
      console.log(`  - ${column}: ${typeof categorySample[0][column]}`);
    });
  }
  
  // 3. Obtener productos con información de categoría manualmente
  const { data: products, error: productsError } = await supabase
    .from('Product')
    .select('id, name, categoryid, sku')
    .eq('isPOSEnabled', true)
    .limit(50);
    
  if (productsError) {
    console.error('❌ Error obteniendo productos:', productsError);
    return;
  }
  
  console.log(`\n📊 Productos obtenidos: ${products?.length || 0}`);
  
  // 4. Obtener categorías por ID
  const { data: categories, error: categoriesError } = await supabase
    .from('Category')
    .select('id, name, description')
    .order('name');
    
  if (categoriesError) {
    console.error('❌ Error obteniendo categorías:', categoriesError);
    return;
  }
  
  // 5. Crear mapeo de categorías
  const categoryMap = new Map();
  categories?.forEach(cat => {
    categoryMap.set(cat.id, cat);
  });
  
  console.log('\n📋 MAPEO DE CATEGORÍAS:');
  categoryMap.forEach((category, id) => {
    console.log(`  - ID ${id}: ${category.name}`);
  });
  
  // 6. Analizar productos por categoría
  const categoryCount = new Map();
  products?.forEach(product => {
    const categoryId = product.categoryid;
    const category = categoryMap.get(categoryId);
    const categoryName = category ? category.name : 'Sin categoría';
    
    if (!categoryCount.has(categoryId)) {
      categoryCount.set(categoryId, {
        id: categoryId,
        name: categoryName,
        description: category?.description || '',
        count: 0,
        products: []
      });
    }
    
    categoryCount.get(categoryId).count++;
    categoryCount.get(categoryId).products.push({
      id: product.id,
      name: product.name,
      sku: product.sku
    });
  });
  
  console.log('\n📊 PRODUCTOS POR CATEGORÍA (muestra de 50):');
  const sortedCategories = Array.from(categoryCount.values()).sort((a, b) => b.count - a.count);
  
  sortedCategories.forEach(category => {
    console.log(`\n🏷️  ${category.name} (ID: ${category.id})`);
    console.log(`   📊 Productos: ${category.count}`);
    console.log(`   📝 Descripción: ${category.description || 'Sin descripción'}`);
    
    if (category.products.length > 0) {
      console.log(`   🔍 Ejemplos:`);
      category.products.slice(0, 3).forEach(product => {
        console.log(`      - ${product.name} (SKU: ${product.sku || 'N/A'})`);
      });
    }
  });
  
  // 7. Obtener categorías POS existentes
  const { data: posCategories, error: posCategoryError } = await supabase
    .from('POSProductCategory')
    .select('id, name, displayName, description, icon, color')
    .eq('cashRegisterTypeId', 1)
    .order('displayName');
    
  if (posCategoryError) {
    console.error('❌ Error obteniendo categorías POS:', posCategoryError);
    return;
  }
  
  console.log('\n📋 CATEGORÍAS POS EXISTENTES:');
  posCategories?.forEach(cat => {
    console.log(`  - ID: ${cat.id} | ${cat.displayName} (${cat.name}) | ${cat.icon} ${cat.color}`);
  });
  
  return {
    categories: sortedCategories,
    posCategories: posCategories || [],
    categoryMap
  };
}

checkTableRelationships().catch(console.error);

