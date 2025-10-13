require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPOSCategoriesMapping() {
  console.log('🔄 Creando mapeo de categorías Product → POS...');
  
  // 1. Obtener todas las categorías de productos
  const { data: categories, error: categoriesError } = await supabase
    .from('Category')
    .select('id, name, description')
    .order('name');
    
  if (categoriesError) {
    console.error('❌ Error obteniendo categorías:', categoriesError);
    return;
  }
  
  // 2. Obtener categorías POS existentes
  const { data: posCategories, error: posCategoryError } = await supabase
    .from('POSProductCategory')
    .select('id, name, displayName, icon, color')
    .eq('cashRegisterTypeId', 1)
    .order('displayName');
    
  if (posCategoryError) {
    console.error('❌ Error obteniendo categorías POS:', posCategoryError);
    return;
  }
  
  // 3. Contar productos por categoría
  const { data: products, error: productsError } = await supabase
    .from('Product')
    .select('id, categoryid')
    .eq('isPOSEnabled', true);
    
  if (productsError) {
    console.error('❌ Error obteniendo productos:', productsError);
    return;
  }
  
  const categoryCount = new Map();
  products?.forEach(product => {
    const categoryId = product.categoryid;
    if (categoryId) {
      categoryCount.set(categoryId, (categoryCount.get(categoryId) || 0) + 1);
    }
  });
  
  // 4. Definir mapeo de nombres y estilos
  const categoryMapping = {
    'Electronica': { 
      displayName: 'Electrónica', 
      icon: '⚡', 
      color: '#3B82F6',
      sortOrder: 10
    },
    'Herramientas y Maquinarias': { 
      displayName: 'Herramientas y Equipos', 
      icon: '🔧', 
      color: '#EF4444',
      sortOrder: 20
    },
    'Materiales de Construcción': { 
      displayName: 'Materiales de Construcción', 
      icon: '🧱', 
      color: '#F59E0B',
      sortOrder: 30
    },
    'Pinturas y Accesorios': { 
      displayName: 'Pinturas y Acabados', 
      icon: '🎨', 
      color: '#8B5CF6',
      sortOrder: 40
    },
    'Gasfiteria': { 
      displayName: 'Gasfitería', 
      icon: '🚿', 
      color: '#06B6D4',
      sortOrder: 50
    },
    'Tornillos y Fijaciones': { 
      displayName: 'Tornillos y Fijaciones', 
      icon: '🔩', 
      color: '#6B7280',
      sortOrder: 60
    },
    'Maderas': { 
      displayName: 'Maderas', 
      icon: '🌳', 
      color: '#92400E',
      sortOrder: 70
    },
    'Fierros': { 
      displayName: 'Fierros y Metales', 
      icon: '⚙️', 
      color: '#374151',
      sortOrder: 80
    },
    'Equipos y Suministros de Soldaduras': { 
      displayName: 'Soldadura', 
      icon: '🔥', 
      color: '#DC2626',
      sortOrder: 90
    },
    'Aislante': { 
      displayName: 'Aislamiento', 
      icon: '🛡️', 
      color: '#059669',
      sortOrder: 100
    },
    'Alambres, Mallas y Cercos': { 
      displayName: 'Alambres y Cercos', 
      icon: '🔗', 
      color: '#7C2D12',
      sortOrder: 110
    },
    'Tabiquería': { 
      displayName: 'Tabiquería', 
      icon: '🏗️', 
      color: '#B45309',
      sortOrder: 120
    },
    'Tableros construcción': { 
      displayName: 'Tableros', 
      icon: '📋', 
      color: '#A16207',
      sortOrder: 130
    },
    'Techumbres': { 
      displayName: 'Techumbres', 
      icon: '🏠', 
      color: '#1F2937',
      sortOrder: 140
    },
    'Terminación Obra Gruesa': { 
      displayName: 'Terminaciones', 
      icon: '✨', 
      color: '#EC4899',
      sortOrder: 150
    },
    'Revestimiento': { 
      displayName: 'Revestimientos', 
      icon: '🎭', 
      color: '#F97316',
      sortOrder: 160
    },
    'Soluciones para el hogar y Seguridad': { 
      displayName: 'Hogar y Seguridad', 
      icon: '🏡', 
      color: '#10B981',
      sortOrder: 170
    },
    'Accesorios': { 
      displayName: 'Accesorios', 
      icon: '🔧', 
      color: '#6366F1',
      sortOrder: 180
    },
    'Contenedores Basureros y más': { 
      displayName: 'Contenedores', 
      icon: '🗑️', 
      color: '#8B5CF6',
      sortOrder: 190
    },
    'Kayak': { 
      displayName: 'Deportes', 
      icon: '🚣', 
      color: '#0EA5E9',
      sortOrder: 200
    }
  };
  
  // 5. Identificar categorías que necesitan ser creadas
  const existingPOSNames = new Set(posCategories?.map(c => c.name.toLowerCase()) || []);
  const categoriesToCreate = categories?.filter(cat => {
    const mapping = categoryMapping[cat.name];
    const hasProducts = categoryCount.get(cat.id) > 0;
    const notExists = !existingPOSNames.has(cat.name.toLowerCase());
    
    return mapping && hasProducts && notExists;
  }) || [];
  
  console.log('\n📊 ANÁLISIS DE CATEGORÍAS:');
  console.log(`Total categorías de productos: ${categories?.length || 0}`);
  console.log(`Categorías POS existentes: ${posCategories?.length || 0}`);
  console.log(`Categorías a crear: ${categoriesToCreate.length}`);
  
  // 6. Crear categorías faltantes
  if (categoriesToCreate.length > 0) {
    console.log('\n🔄 CREANDO CATEGORÍAS FALTANTES:');
    
    for (const category of categoriesToCreate) {
      const mapping = categoryMapping[category.name];
      const productCount = categoryCount.get(category.id) || 0;
      
      console.log(`\n🏷️  Creando: ${category.name} (${productCount} productos)`);
      console.log(`   Display: ${mapping.displayName}`);
      console.log(`   Icono: ${mapping.icon} | Color: ${mapping.color}`);
      
      const { data: newCategory, error: createError } = await supabase
        .from('POSProductCategory')
        .insert({
          name: category.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
          displayName: mapping.displayName,
          icon: mapping.icon,
          color: mapping.color,
          sortOrder: mapping.sortOrder,
          cashRegisterTypeId: 1, // Recepción
          isActive: true
        })
        .select('id, name, displayName')
        .single();
        
      if (createError) {
        console.error(`   ❌ Error creando categoría:`, createError);
      } else {
        console.log(`   ✅ Categoría creada: ID ${newCategory.id} - ${newCategory.displayName}`);
      }
    }
  }
  
  // 7. Crear mapeo de IDs
  console.log('\n🔄 OBTENIENDO MAPEO DE IDs...');
  
  const { data: updatedPosCategories, error: updatedError } = await supabase
    .from('POSProductCategory')
    .select('id, name, displayName')
    .eq('cashRegisterTypeId', 1)
    .order('displayName');
    
  if (updatedError) {
    console.error('❌ Error obteniendo categorías POS actualizadas:', updatedError);
    return;
  }
  
  const categoryIdMap = new Map();
  categories?.forEach(category => {
    const mapping = categoryMapping[category.name];
    if (mapping) {
      const posCategory = updatedPosCategories?.find(pos => 
        pos.name.toLowerCase() === category.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      );
      
      if (posCategory) {
        categoryIdMap.set(category.id, posCategory.id);
        console.log(`✅ ${category.name} (Product ID: ${category.id}) → ${posCategory.displayName} (POS ID: ${posCategory.id})`);
      }
    }
  });
  
  return {
    categoryIdMap,
    categoriesToCreate: categoriesToCreate.length,
    totalCategories: categories?.length || 0
  };
}

createPOSCategoriesMapping().catch(console.error);

