import { ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import SeasonForm from '../components/SeasonForm';

export default function CreateSeasonPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/configuration/seasons"
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Temporada</h1>
            <p className="text-gray-600">
              Configura precios dinámicos para fechas específicas
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <SeasonForm mode="create" />
      </div>
    </div>
  );
} 