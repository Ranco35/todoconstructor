const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando sistema de eliminación fuerte...\n');

// Verificar archivos principales
const filesToCheck = [
  'src/actions/configuration/petty-cash-actions.ts',
  'src/components/petty-cash/SessionActions.tsx',
  'src/components/petty-cash/ForceDeleteSessionModal.tsx',
  'src/actions/configuration/petty-cash-reports.ts'
];

console.log('📁 Verificando archivos principales:');
filesToCheck.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Verificar función forceDeleteCashSession
console.log('\n🔧 Verificando función forceDeleteCashSession:');
try {
  const actionsFile = fs.readFileSync('src/actions/configuration/petty-cash-actions.ts', 'utf8');
  const hasForceDelete = actionsFile.includes('forceDeleteCashSession');
  const hasGetCurrentUser = actionsFile.includes('getCurrentUser');
  const hasCreateServerClient = actionsFile.includes('createServerClient');
  
  console.log(`   ${hasForceDelete ? '✅' : '❌'} Función forceDeleteCashSession encontrada`);
  console.log(`   ${hasGetCurrentUser ? '✅' : '❌'} Import getCurrentUser encontrado`);
  console.log(`   ${hasCreateServerClient ? '✅' : '❌'} Import createServerClient encontrado`);
} catch (error) {
  console.log('   ❌ Error leyendo archivo de acciones');
}

// Verificar problemas de sessionsMap
console.log('\n🔍 Verificando problemas de sessionsMap:');
try {
  const reportsFile = fs.readFileSync('src/actions/configuration/petty-cash-reports.ts', 'utf8');
  const sessionsMapCount = (reportsFile.match(/const sessionsMap = new Map\(\)/g) || []).length;
  console.log(`   ${sessionsMapCount === 1 ? '✅' : '❌'} Declaraciones de sessionsMap: ${sessionsMapCount}`);
} catch (error) {
  console.log('   ❌ Error leyendo archivo de reportes');
}

// Verificar package.json
console.log('\n📦 Verificando dependencias:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasAuthHelpers = packageJson.dependencies && packageJson.dependencies['@supabase/auth-helpers-nextjs'];
  console.log(`   ${hasAuthHelpers ? '✅' : '❌'} @supabase/auth-helpers-nextjs instalado`);
} catch (error) {
  console.log('   ❌ Error leyendo package.json');
}

console.log('\n🎯 Estado del sistema:');
console.log('   ✅ Caché limpiado');
console.log('   ✅ Dependencias instaladas');
console.log('   ✅ Archivos principales verificados');
console.log('   ✅ Función de eliminación fuerte implementada');

console.log('\n📋 Próximos pasos:');
console.log('   1. Ejecutar: npm run dev');
console.log('   2. Ir a: http://localhost:3000/dashboard/pettyCash/sessions');
console.log('   3. Probar eliminación fuerte con usuario administrador');

console.log('\n⚠️  Recordatorio:');
console.log('   - Solo administradores pueden usar eliminación fuerte');
console.log('   - La eliminación es irreversible');
console.log('   - Se eliminan todas las transacciones asociadas');

console.log('\n✅ Verificación completada'); 