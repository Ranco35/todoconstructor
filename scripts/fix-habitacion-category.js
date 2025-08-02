const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://flwewxqgbmsyqrjvhfuw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsd2V3eHFnYm1zeXFyanZoZnV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTAwNjczNCwiZXhwIjoyMDUwNTgyNzM0fQ.hcV2-F11nJy5ksqHBr_N8PLsQOGg6fBNQLxlOe4Hxcs';

async function fixHabitacionCategory() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔧 Corrigiendo categoría de Habitación Doble...');
  
  try {
    // 1. Verificar estado actual
    const { data: beforeData, error: beforeError } = await supabase
      .from('products_modular')
      .select('*')
      .ilike('name', '%habitacion%');
    
    if (beforeError) {
      console.error('❌ Error al verificar productos:', beforeError);
      return;
    }
    
    console.log('📊 Productos con "habitacion" encontrados:', beforeData?.length || 0);
    beforeData?.forEach(p => {
      console.log(`  - ID: ${p.id}, Nombre: ${p.name}, Categoría: ${p.category}`);
    });
    
    // 2. Actualizar categoría
    const { data: updateData, error: updateError } = await supabase
      .from('products_modular')
      .update({ category: 'alojamiento' })
      .ilike('name', '%habitacion%')
      .eq('category', 'servicios')
      .select();
    
    if (updateError) {
      console.error('❌ Error al actualizar categoría:', updateError);
      return;
    }
    
    console.log('✅ Productos actualizados:', updateData?.length || 0);
    updateData?.forEach(p => {
      console.log(`  - ✅ ${p.name} → categoría: ${p.category}`);
    });
    
    // 3. Verificar resultado final
    const { data: afterData, error: afterError } = await supabase
      .from('products_modular')
      .select('*')
      .ilike('name', '%habitacion%');
    
    if (afterError) {
      console.error('❌ Error al verificar resultado:', afterError);
      return;
    }
    
    console.log('📊 Estado final:');
    afterData?.forEach(p => {
      console.log(`  - ${p.name} → categoría: ${p.category}`);
    });
    
    console.log('🎉 Corrección completada exitosamente!');
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

fixHabitacionCategory(); 