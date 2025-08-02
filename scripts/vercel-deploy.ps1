# Script para configurar variables de entorno en Vercel y desplegar

Write-Host "🔧 Configurando variables de entorno en Vercel..." -ForegroundColor Green

# Variables de entorno desde .env.local
$supabaseUrl = "https://bvzfuibqlprrfbudnauc.supabase.co"
$supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTI2MDEsImV4cCI6MjA2NjEyODYwMX0.XPfzqVORUTShEkQXCD07_Lv0YqqG2oZXsiG1Dh9BMLY"
$serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1MjYwMSwiZXhwIjoyMDY2MTI4NjAxfQ.4TGUtzCpdxCEwlpC3WKlHJ4I6O7ZGTCbFQBARYgv834"
$jwtSecret = "Zj9zE5yPpDY9u3FN4aRGCguZHpamWGn7Ih9zIrP4p6A4j7ghbejKLMJ8gBL4n3QJ"

# Configurar variables para producción
Write-Host "Configurando variables para producción..." -ForegroundColor Yellow
echo $supabaseUrl | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo $supabaseAnonKey | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo $serviceRoleKey | vercel env add SUPABASE_SERVICE_ROLE_KEY production
echo $jwtSecret | vercel env add JWT_SECRET production

# Configurar variables para preview
Write-Host "Configurando variables para preview..." -ForegroundColor Yellow
echo $supabaseUrl | vercel env add NEXT_PUBLIC_SUPABASE_URL preview
echo $supabaseAnonKey | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
echo $serviceRoleKey | vercel env add SUPABASE_SERVICE_ROLE_KEY preview
echo $jwtSecret | vercel env add JWT_SECRET preview

# Configurar variables para desarrollo
Write-Host "Configurando variables para desarrollo..." -ForegroundColor Yellow
echo $supabaseUrl | vercel env add NEXT_PUBLIC_SUPABASE_URL development
echo $supabaseAnonKey | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development
echo $serviceRoleKey | vercel env add SUPABASE_SERVICE_ROLE_KEY development
echo $jwtSecret | vercel env add JWT_SECRET development

Write-Host "✅ Variables de entorno configuradas" -ForegroundColor Green
Write-Host "🚀 Desplegando aplicación..." -ForegroundColor Green

# Desplegar a producción
vercel --prod 