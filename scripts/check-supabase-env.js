require('dotenv').config({ path: '.env.local' });

console.log('=== Verificación de Variables de Entorno Supabase ===');
console.log('');

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let allPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NO ENCONTRADA`);
    allPresent = false;
  }
});

console.log('');
if (allPresent) {
  console.log('✅ Todas las variables de entorno están configuradas');
} else {
  console.log('❌ Faltan variables de entorno requeridas');
}

console.log('');
console.log('=== Verificación de Formato ===');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  if (supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co')) {
    console.log('✅ URL de Supabase tiene formato correcto');
  } else {
    console.log('❌ URL de Supabase no tiene formato correcto');
  }
}

const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (anonKey) {
  if (anonKey.startsWith('eyJ')) {
    console.log('✅ Anon Key tiene formato JWT correcto');
  } else {
    console.log('❌ Anon Key no tiene formato JWT correcto');
  }
} 