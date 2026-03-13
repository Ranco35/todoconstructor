import SupabaseTest from '@/components/shared/SupabaseTest'

export default function SupabaseTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Prueba de Conexión Supabase</h1>
        <SupabaseTest />
      </div>
    </div>
  )
} 