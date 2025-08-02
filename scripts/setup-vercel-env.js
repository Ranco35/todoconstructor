const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Leer variables del archivo .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Extraer variables específicas
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1];
const supabaseAnonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1];
const serviceRoleKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1];
const jwtSecret = envContent.match(/SUPABASE_JWT_SECRET=(.+)/)?.[1];

console.log('🔧 Configurando variables de entorno en Vercel...');

// Crear archivo temporal con las variables
const tempEnvFile = path.join(__dirname, 'temp-env.txt');
fs.writeFileSync(tempEnvFile, `${supabaseUrl}\n${supabaseAnonKey}\n${serviceRoleKey}\n${jwtSecret}`);

// Configurar variables de entorno usando archivos temporales
const commands = [
  `vercel env add NEXT_PUBLIC_SUPABASE_URL production < temp-env.txt`,
  `vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production < temp-env.txt`,
  `vercel env add SUPABASE_SERVICE_ROLE_KEY production < temp-env.txt`,
  `vercel env add JWT_SECRET production < temp-env.txt`
];

commands.forEach((command, index) => {
  try {
    console.log(`Configurando variable ${index + 1}/${commands.length}...`);
    // Usar echo para pasar el valor
    const value = [supabaseUrl, supabaseAnonKey, serviceRoleKey, jwtSecret][index];
    execSync(`echo "${value}" | vercel env add ${command.split(' ')[3]} ${command.split(' ')[4]}`, { stdio: 'pipe' });
  } catch (error) {
    console.log(`⚠️  Variable ya configurada o error: ${error.message}`);
  }
});

// Limpiar archivo temporal
fs.unlinkSync(tempEnvFile);

console.log('✅ Variables de entorno configuradas');
console.log('🚀 Desplegando aplicación...');
execSync('vercel --prod', { stdio: 'inherit' }); 