console.log('🔍 VERIFICANDO VARIABLES DE ENTORNO EN VERCEL\n');

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('📋 Variables de entorno requeridas:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${envVar}: NO CONFIGURADA`);
  }
});

console.log('\n🌍 Entorno actual:', process.env.NODE_ENV);
console.log('🔗 URL de Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL);

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('\n✅ Variables de entorno básicas configuradas');
} else {
  console.log('\n❌ Faltan variables de entorno básicas');
  process.exit(1);
}


