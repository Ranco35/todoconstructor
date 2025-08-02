
// Archivo de verificación para Vercel
export function verifyEnvVars() {
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  };

  console.log('🔍 Verificación de variables de entorno:');
  
  for (const [key, value] of Object.entries(requiredVars)) {
    if (value) {
      console.log(`  ✅ ${key}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`  ❌ ${key}: NO DEFINIDA`);
    }
  }
  
  return Object.values(requiredVars).every(v => v);
}
