'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface Tag {
  id: number;
  nombre: string;
  descripcion?: string;
  fechaCreacion: string;
}

export default function DebugTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTags() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('ClientTag')
          .select('*')
          .order('id');

        if (error) {
          setError(error.message);
        } else {
          setTags(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    fetchTags();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">🏷️ Debug - Etiquetas en BD</h1>
        <div>Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">🏷️ Debug - Etiquetas en BD</h1>
        <div className="text-red-600">❌ Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🏷️ Debug - Etiquetas en BD</h1>
      
      <div className="mb-4">
        <p><strong>Total etiquetas:</strong> {tags.length}</p>
        <p><strong>¿Existe ID 36?</strong> {tags.find(t => t.id === 36) ? '✅ SÍ' : '❌ NO'}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Nombre</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Descripción</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Creado</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id} className={tag.id === 36 ? 'bg-yellow-100' : ''}>
                <td className="border border-gray-300 px-4 py-2">
                  <span className={tag.id === 36 ? 'font-bold text-green-600' : ''}>
                    {tag.id}
                  </span>
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <span className={tag.id === 36 ? 'font-bold text-green-600' : ''}>
                    {tag.nombre}
                  </span>
                </td>
                <td className="border border-gray-300 px-4 py-2">{tag.descripcion || '-'}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {new Date(tag.fechaCreacion).toLocaleDateString('es-ES')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tags.length === 0 && (
        <div className="mt-4 p-4 border border-yellow-300 bg-yellow-50 rounded">
          ⚠️ <strong>No hay etiquetas en la base de datos.</strong>
          <br />
          Necesitas crear etiquetas primero antes de poder asignarlas a clientes.
        </div>
      )}

      <div className="mt-6 p-4 border border-blue-300 bg-blue-50 rounded">
        <h3 className="font-bold mb-2">💡 Información:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>El Excel intenta asignar la etiqueta con ID <strong>36</strong></li>
          <li>Si no existe, necesitas crearla o cambiar el ID en el Excel</li>
          <li>Si la tabla está vacía, necesitas importar/crear etiquetas primero</li>
        </ul>
      </div>
    </div>
  );
} 