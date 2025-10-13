import { Construction } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Construction className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Página en Construcción
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Estamos trabajando en mejorar esta sección. 
            Pronto tendremos más información sobre nosotros disponible.
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-2xl p-8 max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ¿Necesitas contactarnos?
          </h2>
          <p className="text-gray-600 mb-4">
            Mientras tanto, puedes contactarnos a través de:
          </p>
          <div className="space-y-2 text-gray-600">
            <p><strong>Teléfono:</strong> +56 9 6909 5111</p>
            <p><strong>Email:</strong> info@admintermas.cl</p>
            <p><strong>Ubicación:</strong> Bodegas Termas LLifen - LLifen s/n, Futrono, Chile</p>
          </div>
        </div>
      </div>
    </div>
  )
}
