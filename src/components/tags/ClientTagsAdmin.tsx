'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Tag, User, Crown, MapPin, Building, Target, Gift, Factory, BarChart3, Trees, Star, Edit, Trash2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getClientTags, createClientTag, updateClientTag, deleteClientTag } from '@/actions/clients/tags';

// Tipos de datos
interface ClientTag {
  id: number;
  nombre: string;
  color: string;
  descripcion?: string;
  tipoAplicacion: 'todos' | 'empresa' | 'persona';
  icono: string;
  orden: number;
  esSistema: boolean;
  activo: boolean;
  createdAt?: string;
}

// Iconos disponibles para las etiquetas
const iconMap = {
  star: Star,
  crown: Crown,
  'map-pin': MapPin,
  building: Building,
  target: Target,
  gift: Gift,
  factory: Factory,
  'bar-chart-3': BarChart3,
  trees: Trees,
  tag: Tag,
  user: User
};

export default function ClientTagsAdmin() {
  const [tags, setTags] = useState<ClientTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<ClientTag | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    color: '#3B82F6',
    descripcion: '',
    tipoAplicacion: 'todos' as const,
    icono: 'tag',
    activo: true
  });

  // Cargar etiquetas
  const fetchTags = async () => {
    setLoading(true);
    try {
      const result = await getClientTags();
      if (result.success) {
        setTags(result.data || []);
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al cargar etiquetas' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error inesperado al cargar etiquetas' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const resetForm = () => {
    setFormData({
      nombre: '',
      color: '#3B82F6',
      descripcion: '',
      tipoAplicacion: 'todos',
      icono: 'tag',
      activo: true
    });
    setEditingTag(null);
    setShowForm(false);
    setMessage(null);
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      setMessage({ type: 'error', text: 'El nombre de la etiqueta es requerido' });
      return;
    }
    
    setSaving(true);
    setMessage(null);

    try {
      let result;
      
      if (editingTag) {
        // Actualizar etiqueta existente
        result = await updateClientTag(editingTag.id, {
          nombre: formData.nombre,
          color: formData.color,
          descripcion: formData.descripcion,
          tipoAplicacion: formData.tipoAplicacion,
          icono: formData.icono,
          activo: formData.activo
        });
      } else {
        // Crear nueva etiqueta
        result = await createClientTag({
          nombre: formData.nombre,
          color: formData.color,
          descripcion: formData.descripcion,
          tipoAplicacion: formData.tipoAplicacion,
          icono: formData.icono,
          activo: formData.activo,
          orden: tags.length + 1,
          esSistema: false
        });
      }

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: editingTag ? 'Etiqueta actualizada exitosamente' : 'Etiqueta creada exitosamente' 
        });
        resetForm();
        await fetchTags();
      } else {
        setMessage({ type: 'error', text: result.error || 'Error en la operación' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error inesperado durante la operación' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tag: ClientTag) => {
    setEditingTag(tag);
    setFormData({
      nombre: tag.nombre,
      color: tag.color,
      descripcion: tag.descripcion || '',
      tipoAplicacion: tag.tipoAplicacion,
      icono: tag.icono,
      activo: tag.activo
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta etiqueta?')) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const result = await deleteClientTag(id);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Etiqueta eliminada exitosamente' });
        await fetchTags();
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al eliminar etiqueta' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error inesperado al eliminar etiqueta' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (tag: ClientTag) => {
    setSaving(true);
    setMessage(null);

    try {
      const result = await updateClientTag(tag.id, { activo: !tag.activo });
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Etiqueta ${!tag.activo ? 'activada' : 'desactivada'} exitosamente` 
        });
        await fetchTags();
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al cambiar estado' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error inesperado al cambiar estado' });
    } finally {
      setSaving(false);
    }
  };

  const TagCard = ({ tag }: { tag: ClientTag }) => {
    const IconComponent = iconMap[tag.icono as keyof typeof iconMap] || Tag;
    
    return (
      <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
        tag.activo 
          ? 'border-gray-200 bg-white shadow-sm hover:shadow-md' 
          : 'border-gray-100 bg-gray-50 opacity-60'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: tag.color }}
            >
              <IconComponent size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{tag.nombre}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 capitalize">
                  {tag.tipoAplicacion}
                </span>
                {tag.esSistema && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    Sistema
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleActive(tag)}
              disabled={saving}
              className={`px-3 py-1 text-xs rounded-full transition-colors flex items-center space-x-1 ${
                tag.activo 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {tag.activo ? <Eye size={12} /> : <EyeOff size={12} />}
              <span>{tag.activo ? 'Activo' : 'Inactivo'}</span>
            </button>
          </div>
        </div>
        
        {tag.descripcion && (
          <p className="text-sm text-gray-600 mb-3">{tag.descripcion}</p>
        )}
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => handleEdit(tag)}
            disabled={saving}
            className={`px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm flex items-center space-x-1 ${
              saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Edit size={12} />
            <span>Editar</span>
          </button>
          {!tag.esSistema && (
            <button
              onClick={() => handleDelete(tag.id)}
              disabled={saving}
              className={`px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm flex items-center space-x-1 ${
                saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Trash2 size={12} />
              <span>Eliminar</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando etiquetas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mensajes */}
      {message && (
        <div className={`p-4 rounded-lg border flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Etiquetas de Clientes</h2>
          <p className="text-gray-600 mt-1">
            Administra las etiquetas para categorizar tus clientes
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={saving}
          className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 ${
            saving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Plus size={20} />
          <span>Nueva Etiqueta</span>
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <h3 className="text-xl font-semibold mb-4">
            {editingTag ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre de la etiqueta"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Descripción opcional de la etiqueta"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Aplicación
                </label>
                <select
                  value={formData.tipoAplicacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipoAplicacion: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="todos">Todos</option>
                  <option value="empresa">Solo Empresas</option>
                  <option value="persona">Solo Personas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icono
                </label>
                <select
                  value={formData.icono}
                  onChange={(e) => setFormData(prev => ({ ...prev, icono: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="tag">🏷️ Etiqueta</option>
                  <option value="star">⭐ Estrella</option>
                  <option value="crown">👑 Corona</option>
                  <option value="map-pin">📍 Ubicación</option>
                  <option value="building">🏢 Edificio</option>
                  <option value="target">🎯 Objetivo</option>
                  <option value="gift">🎁 Regalo</option>
                  <option value="factory">🏭 Fábrica</option>
                  <option value="bar-chart-3">📊 Gráfico</option>
                  <option value="trees">🌲 Árbol</option>
                  <option value="user">👤 Usuario</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className={`px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors ${
                  saving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || !formData.nombre.trim()}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 ${
                  (saving || !formData.nombre.trim()) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <span>{editingTag ? 'Actualizar' : 'Crear'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de etiquetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tags.map(tag => (
          <TagCard key={tag.id} tag={tag} />
        ))}
      </div>

      {/* Estado vacío */}
      {tags.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Tag size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay etiquetas</h3>
          <p className="text-gray-500 mb-4">
            Comienza creando tu primera etiqueta para categorizar clientes.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Crear Primera Etiqueta</span>
          </button>
        </div>
      )}

      {/* Estadísticas */}
      {tags.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{tags.length}</div>
              <div className="text-sm text-gray-600">Total Etiquetas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {tags.filter(t => t.activo).length}
              </div>
              <div className="text-sm text-gray-600">Activas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {tags.filter(t => t.esSistema).length}
              </div>
              <div className="text-sm text-gray-600">Sistema</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {tags.filter(t => !t.esSistema).length}
              </div>
              <div className="text-sm text-gray-600">Personalizadas</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 