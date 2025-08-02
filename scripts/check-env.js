// Script para verificar variables de entorno disponibles
console.log('🔍 Verificando variables de entorno...\n');

const envVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: No configurada`);
  }
});

console.log('\n📋 Variables de entorno del sistema:');
Object.keys(process.env).forEach(key => {
  if (key.includes('SUPABASE') || key.includes('NEXT')) {
    console.log(`   ${key}: ${process.env[key] ? 'Configurada' : 'No configurada'}`);
  }
}); 