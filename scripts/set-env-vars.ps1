# Script para establecer variables de entorno correctas de Supabase
$env:NEXT_PUBLIC_SUPABASE_URL = "https://ibpbclxszblystwffxzn.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicGJjbHhzemJseXN0d2ZmeHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkyMzc2MDksImV4cCI6MjAzNDgxMzYwOX0.TojKWEhZugHKtGrh6ySa3fNiKFBZDnSsllQNhBHcIQE"
$env:SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicGJjbHhzemJseXN0d2ZmeHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTIzNzYwOSwiZXhwIjoyMDM0ODEzNjA5fQ.x4QJPLKZwEwKzF-N_8Bss8T_rXXYZ9Cc6QayaLq-_rQ"
 
Write-Host "✅ Variables de entorno establecidas correctamente:"
Write-Host "NEXT_PUBLIC_SUPABASE_URL: $env:NEXT_PUBLIC_SUPABASE_URL"
Write-Host "NEXT_PUBLIC_SUPABASE_ANON_KEY: $($env:NEXT_PUBLIC_SUPABASE_ANON_KEY.Substring(0,20))..."
Write-Host "SUPABASE_SERVICE_ROLE_KEY: $($env:SUPABASE_SERVICE_ROLE_KEY.Substring(0,20))..." 