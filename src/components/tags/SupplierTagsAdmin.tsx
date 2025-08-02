'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Tag, Truck, Factory, Building2, Package, Shield, Award, Zap, Globe, Handshake, 
         TrendingUp, Edit, Trash2, CheckCircle2, AlertCircle, Eye, EyeOff, Settings, 
         Package2, ShoppingCart, Users2, Wrench, Palette, Briefcase, 
         // Iconos específicos para hotel
         Bed, UserCheck, Coffee, Moon, TreePine, ChefHat, HardHat, 
         Utensils, Sparkles, Clock, House, Car } from 'lucide-react';
import { getSupplierTags, createSupplierTag, updateSupplierTag, deleteSupplierTag } from '@/actions/suppliers/tags';

// Tipos de datos
interface SupplierTag {
  id: number;
  nombre: string;
  color: string;
  descripcion?: string;
  tipoAplicacion: 'todos' | 'SOCIEDAD_ANONIMA' | 'EMPRESA_INDIVIDUAL';
  icono: string;
  orden: number;
  esSistema: boolean;
  activo: boolean;
  createdAt?: string;
}

// Iconos específicos para proveedores
const iconMap = {
  // Logística y Transporte
  truck: Truck,
  car: Car,
  
  // Industria y Manufactura
  factory: Factory,
  package2: Package2,
  
  // Corporativo y Empresarial
  building2: Building2,
  briefcase: Briefcase,
  users2: Users2,
  
  // Productos y Servicios
  package: Package,
  'shopping-cart': ShoppingCart,
  wrench: Wrench,
  
  // Calidad y Certificaciones
  shield: Shield,
  award: Award,
  
  // Tecnología y Innovación
  zap: Zap,
  globe: Globe,
  
  // Comercial y Negocios
  handshake: Handshake,
  'trending-up': TrendingUp,
  
  // Personalización
  palette: Palette,
  settings: Settings,
  
  // ===== NUEVOS ICONOS ESPECÍFICOS PARA HOTEL =====
  // Personal de Habitaciones
  bed: Bed,                    // Mucama/Housekeeping
  sparkles: Sparkles,          // Limpieza general
  
  // Personal de Servicio
  'user-check': UserCheck,     // Recepcionista
  coffee: Coffee,              // Garzón/Mesero
  utensils: Utensils,          // Servicio de mesa
  
  // Personal Nocturno y Seguridad
  moon: Moon,                  // Nochero/Guardia nocturno
  
  // Personal de Mantenimiento
  'tree-pine': TreePine,       // Jardinero
  'hard-hat': HardHat,         // Maestro/Mantenimiento
  house: House,                // Mantenimiento general
  
  // Personal de Cocina
  'chef-hat': ChefHat,         // Cocinero/Chef
  
  // Servicios de Tiempo
  clock: Clock,                // Servicios por horario
  
  // Genéricos
  tag: Tag
};

export default function SupplierTagsAdmin() {
  const [tags, setTags] = useState<SupplierTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<SupplierTag | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    color: '#F59E0B',
    descripcion: '',
    tipoAplicacion: 'todos' as const,
    icono: 'truck',
    activo: true
  });

  // Cargar etiquetas
  const fetchTags = async () => {
    setLoading(true);
    try {
      const result = await getSupplierTags();
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
      color: '#F59E0B',
      descripcion: '',
      tipoAplicacion: 'todos',
      icono: 'truck',
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
        result = await updateSupplierTag(editingTag.id, {
          nombre: formData.nombre,
          color: formData.color,
          descripcion: formData.descripcion,
          tipoAplicacion: formData.tipoAplicacion,
          icono: formData.icono,
          activo: formData.activo
        });
      } else {
        // Crear nueva etiqueta
        result = await createSupplierTag({
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

  const handleEdit = (tag: SupplierTag) => {
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
      const result = await deleteSupplierTag(id);
      
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

  const toggleActive = async (tag: SupplierTag) => {
    setSaving(true);
    setMessage(null);

    try {
      const result = await updateSupplierTag(tag.id, { activo: !tag.activo });
      
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

  const TagCard = ({ tag }: { tag: SupplierTag }) => {
    const IconComponent = iconMap[tag.icono as keyof typeof iconMap] || Truck;
    
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
                  {tag.tipoAplicacion === 'SOCIEDAD_ANONIMA' ? 'S.A.' : 
                   tag.tipoAplicacion === 'EMPRESA_INDIVIDUAL' ? 'E.I.' : 'Todos'}
                </span>
                {tag.esSistema && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                    Sistema
                  </span>
                )}
              </div>
            </div>
          </div>
          
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
        
        {tag.descripcion && (
          <p className="text-sm text-gray-600 mb-3">{tag.descripcion}</p>
        )}
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => handleEdit(tag)}
            disabled={saving}
            className={`px-3 py-1 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors text-sm flex items-center space-x-1 ${
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
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
          <h2 className="text-2xl font-bold text-gray-900">Etiquetas de Proveedores</h2>
          <p className="text-gray-600 mt-1">
            Administra las etiquetas para categorizar tus proveedores
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={saving}
          className={`bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 ${
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
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="todos">Todos</option>
                  <option value="SOCIEDAD_ANONIMA">Sociedad Anónima</option>
                  <option value="EMPRESA_INDIVIDUAL">Empresa Individual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icono
                </label>
                <select
                  value={formData.icono}
                  onChange={(e) => setFormData(prev => ({ ...prev, icono: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <optgroup label="🏨 Personal de Hotel">
                    <option value="bed">🛏️ Mucama/Housekeeping</option>
                    <option value="sparkles">✨ Limpieza</option>
                    <option value="user-check">👤 Recepcionista</option>
                    <option value="coffee">☕ Garzón/Mesero</option>
                    <option value="utensils">🍽️ Servicio de Mesa</option>
                    <option value="chef-hat">👨‍🍳 Cocinero/Chef</option>
                    <option value="moon">🌙 Nochero/Guardia</option>
                    <option value="tree-pine">🌲 Jardinero</option>
                    <option value="hard-hat">👷 Maestro/Mantenimiento</option>
                    <option value="house">🏠 Mantenimiento General</option>
                    <option value="clock">🕐 Servicios por Horario</option>
                  </optgroup>
                  <optgroup label="🚛 Logística y Transporte">
                    <option value="truck">🚛 Transporte</option>
                    <option value="car">🚗 Vehículos</option>
                    <option value="package2">📦 Logística</option>
                  </optgroup>
                  <optgroup label="🏭 Industria y Manufactura">
                    <option value="factory">🏭 Industria</option>
                    <option value="package">📦 Productos</option>
                  </optgroup>
                  <optgroup label="🏢 Corporativo y Empresarial">
                    <option value="building2">🏢 Corporativo</option>
                    <option value="briefcase">💼 Servicios</option>
                    <option value="users2">👥 Recursos Humanos</option>
                  </optgroup>
                  <optgroup label="🛒 Comercial y Ventas">
                    <option value="shopping-cart">🛒 Comercial</option>
                    <option value="handshake">🤝 Alianzas</option>
                    <option value="trending-up">📈 Crecimiento</option>
                  </optgroup>
                  <optgroup label="🔧 Servicios Técnicos">
                    <option value="wrench">🔧 Mantenimiento</option>
                    <option value="zap">⚡ Tecnología</option>
                    <option value="settings">⚙️ Configuración</option>
                  </optgroup>
                  <optgroup label="🏆 Calidad y Certificaciones">
                    <option value="shield">🛡️ Seguridad</option>
                    <option value="award">🏆 Calidad</option>
                  </optgroup>
                  <optgroup label="🌐 Otros">
                    <option value="globe">🌐 Internacional</option>
                    <option value="palette">🎨 Diseño</option>
                    <option value="tag">🏷️ General</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.checked }))}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Etiqueta activa</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || !formData.nombre.trim()}
                className={`px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center space-x-2 ${
                  saving || !formData.nombre.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <span>{editingTag ? 'Actualizar' : 'Crear'} Etiqueta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Etiquetas */}
      {tags.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => (
            <TagCard key={tag.id} tag={tag} />
          ))}
        </div>
      )}

      {/* Estado vacío */}
      {tags.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Truck size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay etiquetas</h3>
          <p className="text-gray-500 mb-4">
            Comienza creando tu primera etiqueta para categorizar proveedores.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors inline-flex items-center space-x-2"
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
              <div className="text-2xl font-bold text-orange-600">{tags.length}</div>
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
              <div className="text-2xl font-bold text-amber-600">
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