const { execSync } = require('child_process');

console.log('🔧 Actualizando claves de Supabase en Vercel...');

// Claves correctas de Supabase (reemplaza con las tuyas)
const supabaseKeys = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://bvzfuibqlprrfbudnauc.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTI2MDEsImV4cCI6MjA2NjEyODYwMX0.XPfzqVORUTShEkQXCD07_Lv0YqqG2oZXsiG1Dh9BMLY',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1MjYwMSwiZXhwIjoyMDY2MTI4NjAxfQ.4TGUtzCpdxCEwlpC3WKlHJ4I6O7ZGTCbFQBARYgv834'
};

// Eliminar variables existentes
console.log('🗑️  Eliminando variables existentes...');
Object.keys(supabaseKeys).forEach(key => {
  try {
    execSync(`vercel env rm ${key} production -y`, { stdio: 'pipe' });
    console.log(`✅ Eliminada variable: ${key}`);
  } catch (error) {
    console.log(`⚠️  Variable ${key} no existía o ya fue eliminada`);
  }
});

// Agregar variables con valores correctos
console.log('➕ Agregando variables con claves correctas...');
Object.entries(supabaseKeys).forEach(([key, value]) => {
  try {
    // Crear archivo temporal con el valor
    const tempFile = `temp_${key}.txt`;
    require('fs').writeFileSync(tempFile, value, 'utf8');
    
    // Usar el archivo para configurar la variable
    execSync(`vercel env add ${key} production < ${tempFile}`, { stdio: 'pipe' });
    
    // Limpiar archivo temporal
    require('fs').unlinkSync(tempFile);
    
    console.log(`✅ Agregada variable: ${key}`);
  } catch (error) {
    console.log(`❌ Error agregando variable ${key}: ${error.message}`);
  }
});

console.log('✅ Claves de Supabase actualizadas');
console.log('🚀 Desplegando aplicación...');
execSync('vercel --prod', { stdio: 'inherit' }); 