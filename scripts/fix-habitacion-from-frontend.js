// ═══════════════════════════════════════════════════════════════
// SCRIPT PARA EJECUTAR EN CONSOLA DEL NAVEGADOR
// ═══════════════════════════════════════════════════════════════
// 
// INSTRUCCIONES:
// 1. Abrir el panel de productos modulares
// 2. Abrir DevTools (F12)
// 3. Ir a la consola
// 4. Copiar y pegar este código
// 5. Presionar Enter
// 
// ═══════════════════════════════════════════════════════════════

async function fixHabitacionCategoryFromFrontend() {
  console.log('🔧 Corrigiendo categoría de Habitación desde frontend...');
  
  try {
    // Importar cliente de Supabase
    const { createClient } = await import('/src/lib/supabase.js');
    const supabase = createClient();
    
    // 1. Verificar productos actuales
    console.log('📊 Verificando productos con "habitacion"...');
    const { data: products, error: getError } = await supabase
      .from('products_modular')
      .select('*')
      .ilike('name', '%habitacion%');
    
    if (getError) {
      console.error('❌ Error al obtener productos:', getError);
      return;
    }
    
    console.log('Productos encontrados:', products?.length || 0);
    products?.forEach(p => {
      console.log(`  - ID: ${p.id}, Nombre: ${p.name}, Categoría: ${p.category}`);
    });
    
    // 2. Actualizar categoría
    console.log('🔄 Actualizando categoría de servicios → alojamiento...');
    const { data: updateResult, error: updateError } = await supabase
      .from('products_modular')
      .update({ category: 'alojamiento' })
      .ilike('name', '%habitacion%')
      .eq('category', 'servicios')
      .select();
    
    if (updateError) {
      console.error('❌ Error al actualizar:', updateError);
      return;
    }
    
    console.log('✅ Productos actualizados:', updateResult?.length || 0);
    updateResult?.forEach(p => {
      console.log(`  - ✅ ${p.name} → categoría: ${p.category}`);
    });
    
    // 3. Verificar resultado final
    console.log('📊 Verificando resultado final...');
    const { data: finalProducts, error: finalError } = await supabase
      .from('products_modular')
      .select('*')
      .ilike('name', '%habitacion%');
    
    if (finalError) {
      console.error('❌ Error al verificar resultado:', finalError);
      return;
    }
    
    console.log('Estado final:');
    finalProducts?.forEach(p => {
      console.log(`  - ${p.name} → categoría: ${p.category}`);
    });
    
    console.log('🎉 Corrección completada exitosamente!');
    console.log('🔄 Recarga la página para ver los cambios');
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
    console.log('📋 INSTRUCCIONES ALTERNATIVAS:');
    console.log('1. Ve al panel de Supabase > SQL Editor');
    console.log('2. Ejecuta: UPDATE products_modular SET category = \\'alojamiento\\' WHERE name ILIKE \\'%habitacion%\\' AND category = \\'servicios\\';');
  }
}

// Ejecutar la función
fixHabitacionCategoryFromFrontend(); 