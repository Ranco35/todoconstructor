# Script para actualizar variables de entorno en Vercel con valores limpios

Write-Host "🔄 Actualizando variables de entorno en Vercel..." -ForegroundColor Green

# Variables limpias (sin saltos de línea)
$supabaseUrl = "https://bvzfuibqlprrfbudnauc.supabase.co"
$supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTI2MDEsImV4cCI6MjA2NjEyODYwMX0.XPfzqVORUTShEkQXCD07_Lv0YqqG2oZXsiG1Dh9BMLY"
$serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1MjYwMSwiZXhwIjoyMDY2MTI4NjAxfQ.4TGUtzCpdxCEwlpC3WKlHJ4I6O7ZGTCbFQBARYgv834"
$jwtSecret = "Zj9zE5yPpDY9u3FN4aRGCguZHpamWGn7Ih9zIrP4p6A4j7ghbejKLMJ8gBL4n3QJ/LxcumF1Yq7eO810QNx4fQ=="

# Primero, eliminar las variables existentes
Write-Host "🗑️  Eliminando variables existentes..." -ForegroundColor Yellow
vercel env rm NEXT_PUBLIC_SUPABASE_URL production --yes
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes
vercel env rm SUPABASE_SERVICE_ROLE_KEY production --yes
vercel env rm JWT_SECRET production --yes

# Agregar las variables limpias
Write-Host "✅ Agregando variables limpias..." -ForegroundColor Green
echo $supabaseUrl | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo $supabaseAnonKey | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo $serviceRoleKey | vercel env add SUPABASE_SERVICE_ROLE_KEY production
echo $jwtSecret | vercel env add JWT_SECRET production

Write-Host "🚀 Desplegando aplicación..." -ForegroundColor Green
vercel --prod 