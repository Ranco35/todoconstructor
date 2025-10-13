require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeProductCategories() {
  console.log('🔍 Analizando categorías de productos...');
  
  // 1. Obtener todas las categorías de productos con sus IDs
  const { data: productCategories, error: categoryError } = await supabase
    .from('Category')
    .select('id, name, description')
    .order('name');
    
  if (categoryError) {
    console.error('❌ Error obteniendo categorías de productos:', categoryError);
    return;
  }
  
  console.log('\n📋 CATEGORÍAS DE PRODUCTOS DISPONIBLES:');
  productCategories?.forEach(cat => {
    console.log(`  - ID: ${cat.id} | ${cat.name} | ${cat.description || 'Sin descripción'}`);
  });
  
  // 2. Obtener productos con sus categorías
  const { data: products, error: productsError } = await supabase
    .from('Product')
    .select(`
      id, 
      name, 
      categoryid,
      Category (
        id,
        name,
        description
      )
    `)
    .eq('isPOSEnabled', true)
    .order('categoryid');
    
  if (productsError) {
    console.error('❌ Error obteniendo productos:', productsError);
    return;
  }
  
  // 3. Contar productos por categoría
  const categoryCount = new Map();
  products?.forEach(product => {
    const categoryId = product.categoryid;
    const categoryName = product.Category?.name || 'Sin categoría';
    
    if (!categoryCount.has(categoryId)) {
      categoryCount.set(categoryId, {
        id: categoryId,
        name: categoryName,
        description: product.Category?.description || '',
        count: 0,
        products: []
      });
    }
    
    categoryCount.get(categoryId).count++;
    categoryCount.get(categoryId).products.push({
      id: product.id,
      name: product.name
    });
  });
  
  console.log('\n📊 PRODUCTOS POR CATEGORÍA:');
  const sortedCategories = Array.from(categoryCount.values()).sort((a, b) => b.count - a.count);
  
  sortedCategories.forEach(category => {
    console.log(`\n🏷️  ${category.name} (ID: ${category.id})`);
    console.log(`   📊 Total productos: ${category.count}`);
    console.log(`   📝 Descripción: ${category.description || 'Sin descripción'}`);
    
    // Mostrar algunos productos de ejemplo
    if (category.products.length > 0) {
      console.log(`   🔍 Productos de ejemplo:`);
      category.products.slice(0, 3).forEach(product => {
        console.log(`      - ${product.name} (ID: ${product.id})`);
      });
      if (category.products.length > 3) {
        console.log(`      ... y ${category.products.length - 3} más`);
      }
    }
  });
  
  // 4. Obtener categorías POS existentes
  const { data: posCategories, error: posCategoryError } = await supabase
    .from('POSProductCategory')
    .select('id, name, displayName, description, icon, color')
    .eq('cashRegisterTypeId', 1) // Recepción
    .order('displayName');
    
  if (posCategoryError) {
    console.error('❌ Error obteniendo categorías POS:', posCategoryError);
    return;
  }
  
  console.log('\n📋 CATEGORÍAS POS EXISTENTES:');
  posCategories?.forEach(cat => {
    console.log(`  - ID: ${cat.id} | ${cat.displayName} (${cat.name}) | ${cat.icon} ${cat.color}`);
  });
  
  // 5. Identificar categorías faltantes
  const productCategoryNames = new Set(sortedCategories.map(c => c.name.toLowerCase()));
  const posCategoryNames = new Set(posCategories?.map(c => c.name.toLowerCase()) || []);
  
  const missingCategories = sortedCategories.filter(category => 
    !posCategoryNames.has(category.name.toLowerCase()) && 
    category.count > 0
  );
  
  console.log('\n❌ CATEGORÍAS FALTANTES EN POS:');
  if (missingCategories.length === 0) {
    console.log('✅ Todas las categorías de productos ya existen en POS');
  } else {
    missingCategories.forEach(category => {
      console.log(`  - ${category.name} (${category.count} productos)`);
    });
  }
  
  // 6. Sugerir mapeo de categorías
  console.log('\n💡 SUGERENCIAS DE MAPEO:');
  sortedCategories.forEach(category => {
    const posCategory = posCategories?.find(pos => 
      pos.name.toLowerCase() === category.name.toLowerCase()
    );
    
    if (posCategory) {
      console.log(`✅ ${category.name} → ${posCategory.displayName} (ID: ${posCategory.id})`);
    } else {
      // Buscar categoría similar
      const similar = posCategories?.find(pos => 
        pos.displayName.toLowerCase().includes(category.name.toLowerCase().substring(0, 5)) ||
        category.name.toLowerCase().includes(pos.displayName.toLowerCase().substring(0, 5))
      );
      
      if (similar) {
        console.log(`🔄 ${category.name} → ${similar.displayName} (ID: ${similar.id}) - SIMILAR`);
      } else {
        console.log(`❌ ${category.name} → NECESITA CREAR NUEVA CATEGORÍA`);
      }
    }
  });
  
  return {
    productCategories: sortedCategories,
    posCategories: posCategories || [],
    missingCategories,
    categoryCount
  };
}

analyzeProductCategories().catch(console.error);

