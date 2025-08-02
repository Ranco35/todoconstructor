const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gkyqffjrxwvdwakidxjj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdreXFmZmpyeHd2ZHdha2lkeGpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkwOTY5MDksImV4cCI6MjAzNDY3MjkwOX0.VRGLqQgKQVK6EB4M_-R2pJTF0s2F3F8O-EQ_6SdW8OU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getCategories() {
  console.log('🔍 Obteniendo categorías disponibles...\n');

  try {
    const { data: categories, error } = await supabase
      .from('Category')
      .select('id, name, description')
      .order('name');

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('📋 CATEGORÍAS DISPONIBLES:');
    console.log('='.repeat(50));
    
    categories.forEach(cat => {
      console.log(`ID: ${cat.id.toString().padEnd(3)} | ${cat.name}`);
      if (cat.description) {
        console.log(`     Descripción: ${cat.description}`);
      }
      console.log('');
    });

    // Mapeo sugerido para productos modulares
    console.log('\n🎯 MAPEO SUGERIDO PARA PRODUCTOS MODULARES:');
    console.log('='.repeat(50));
    
    categories.forEach(cat => {
      let modularCategory = 'servicios'; // default
      const name = cat.name.toLowerCase();
      
      if (name.includes('alojamiento') || name.includes('habitacion') || name.includes('programa')) {
        modularCategory = 'alojamiento';
      } else if (name.includes('alimentacion') || name.includes('comida') || name.includes('bebida') || name.includes('restaurante')) {
        modularCategory = 'comida';
      } else if (name.includes('spa') || name.includes('masaje') || name.includes('tratamiento') || name.includes('termal')) {
        modularCategory = 'spa';
      } else if (name.includes('entretenimiento') || name.includes('actividad')) {
        modularCategory = 'entretenimiento';
      }
      
      console.log(`${cat.name} (ID: ${cat.id}) → ${modularCategory}`);
    });

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

getCategories(); 