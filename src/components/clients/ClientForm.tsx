'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClientType, Gender, CreateClientFormData, CreateClientContactFormData } from '@/types/client';
import { Client, Country, EconomicSector, ClientTag, RelationshipType } from '@/types/client';
import { getCountries, getEconomicSectors, getRelationshipTypes } from '@/actions/clients/catalogs';
import { getClientTags } from '@/actions/clients/tags';
import { createClient } from '@/actions/clients/create';
import { updateClient } from '@/actions/clients/update';
import { 
  ArrowLeft, Save, X, Plus, Upload, User, Building2, Mail, Phone, MapPin, Tag, Globe, Calendar, Briefcase, Users, ChevronDown, Check 
} from 'lucide-react';
import { ClientImageUploader } from '@/components/clients/ClientImageUploader';

interface ClientFormProps {
  client?: Client;
  mode: 'create' | 'edit';
}

// Componente de Input Moderno
const ModernInput = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  icon: Icon, 
  error, 
  required 
}: {
  label: string;
  type?: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  error?: string;
  required?: boolean;
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />}
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors ${
          error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
        }`}
      />
    </div>
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
);

// Componente de Select Moderno
const ModernSelect = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder, 
  icon: Icon, 
  error,
  required 
}: {
  label: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  options: Array<{ value: string | number; label: string; flag?: string; icon?: string }> | string[];
  placeholder?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  error?: string;
  required?: boolean;
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />}
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm transition-colors ${
          error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
        }`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option, index) => {
          if (typeof option === 'string') {
            return (
              <option key={index} value={option}>
                {option}
              </option>
            );
          }
          return (
            <option key={option.value} value={option.value}>
              {option.flag ? `${option.flag} ${option.label}` : option.icon ? `${option.icon} ${option.label}` : option.label}
            </option>
          );
        })}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
    </div>
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
);

const ClientForm: React.FC<ClientFormProps> = ({ client, mode }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tipoCliente, setTipoCliente] = useState<ClientType>(ClientType.PERSONA);
  const [mostrarContactos, setMostrarContactos] = useState(true);
  const [defaultCountrySet, setDefaultCountrySet] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState<CreateClientFormData>({
    tipoCliente: ClientType.PERSONA,
    nombrePrincipal: '',
    apellido: '',
    rut: '',
    email: '',
    telefono: '',
    telefonoMovil: '',
    calle: '',
    calle2: '',
    ciudad: '',
    codigoPostal: '',
    region: '',
    paisId: undefined,
    sitioWeb: '',
    idioma: 'es',
    zonaHoraria: '',
    comentarios: '',
    razonSocial: '',
    giro: '',
    numeroEmpleados: undefined,
    facturacionAnual: undefined,
    sectorEconomicoId: undefined,
    fechaNacimiento: '',
    genero: undefined,
    profesion: '',
    recibirNewsletter: true,
    aceptaMarketing: false,
    contactos: [{
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      telefonoMovil: '',
      cargo: '',
      departamento: '',
      tipoRelacionId: undefined,
      relacion: '',
      esContactoPrincipal: true,
      notas: ''
    }],
    etiquetas: []
  });

  // Estados para los catálogos
  const [countries, setCountries] = useState<Country[]>([]);
  const [sectors, setSectors] = useState<EconomicSector[]>([]);
  const [tags, setTags] = useState<ClientTag[]>([]);
  const [relationshipTypes, setRelationshipTypes] = useState<RelationshipType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUrl, setImageUrl] = useState<string | null>(
    client?.imagen || null
  );
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Opciones para selectores
  const paises = countries.map(country => ({
    value: country.id,
    label: country.nombre,
    flag: country.codigo === 'CL' ? '🇨🇱' : 
          country.codigo === 'AR' ? '🇦🇷' : 
          country.codigo === 'PE' ? '🇵🇪' : 
          country.codigo === 'CO' ? '🇨🇴' :
          country.codigo === 'MX' ? '🇲🇽' : '🌍'
  }));

  const regiones = [
    'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
    'Valparaíso', 'Metropolitana de Santiago', 'O\'Higgins', 'Maule', 'Ñuble',
    'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
  ];

  const sectoresEconomicos = sectors.map(sector => ({
    value: sector.id,
    label: sector.nombre,
    icon: '💼'
  }));

  const cargosEmpresa = [
    'Gerente General',
    'Gerente Comercial',
    'Gerente Financiero',
    'Jefe de Compras',
    'Jefe de Ventas',
    'Contador',
    'Asistente',
    'Secretaria',
    'Otro'
  ];

  const relacionesPersona = [
    'Esposa',
    'Marido',
    'Hijo/a',
    'Padre',
    'Madre',
    'Hermano/a',
    'Socio',
    'Otro'
  ];

  // Cargar datos iniciales si es modo edición
  useEffect(() => {
    if (client && mode === 'edit') {
      setTipoCliente(client.tipoCliente);
      setDefaultCountrySet(true);
      setFormData({
        tipoCliente: client.tipoCliente,
        nombrePrincipal: client.nombrePrincipal,
        apellido: client.tipoCliente === ClientType.EMPRESA ? '' : (client.apellido || ''),
        rut: client.rut || '',
        email: client.email || '',
        telefono: client.telefono || '',
        telefonoMovil: client.telefonoMovil || '',
        calle: client.calle || '',
        calle2: client.calle2 || '',
        ciudad: client.ciudad || '',
        codigoPostal: client.codigoPostal || '',
        region: client.region || '',
        paisId: client.paisId,
        sitioWeb: client.sitioWeb || '',
        idioma: client.idioma,
        zonaHoraria: client.zonaHoraria || '',
        comentarios: client.comentarios || '',
        razonSocial: client.razonSocial || '',
        giro: client.giro || '',
        numeroEmpleados: client.numeroEmpleados,
        facturacionAnual: client.facturacionAnual,
        sectorEconomicoId: client.sectorEconomicoId,
        fechaNacimiento: client.fechaNacimiento ? new Date(client.fechaNacimiento).toISOString().split('T')[0] : '',
        genero: client.genero,
        profesion: client.profesion || '',
        recibirNewsletter: client.recibirNewsletter,
        aceptaMarketing: client.aceptaMarketing,
        contactos: client.contactos?.map(c => ({
          nombre: c.nombre,
          apellido: c.apellido || '',
          email: c.email || '',
          telefono: c.telefono || '',
          telefonoMovil: c.telefonoMovil || '',
          cargo: c.cargo || '',
          departamento: c.departamento || '',
          tipoRelacionId: c.tipoRelacionId,
          relacion: c.relacion || '',
          esContactoPrincipal: c.esContactoPrincipal,
          notas: c.notas || ''
        })) || [{
          nombre: '',
          apellido: '',
          email: '',
          telefono: '',
          telefonoMovil: '',
          cargo: '',
          departamento: '',
          tipoRelacionId: undefined,
          relacion: '',
          esContactoPrincipal: true,
          notas: ''
        }],
        etiquetas: client.etiquetas?.map(e => e.etiqueta?.id || 0).filter(id => id > 0) || []
      });
    }
  }, [client, mode]);

  // Cargar catálogos
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [countriesResult, sectorsResult, tagsResult, relationsResult] = await Promise.all([
          getCountries(),
          getEconomicSectors(),
          getClientTags(),
          getRelationshipTypes()
        ]);

        if (countriesResult.success) setCountries(countriesResult.data);
        if (sectorsResult.success) setSectors(sectorsResult.data);
        if (tagsResult.success) setTags(tagsResult.data);
        if (relationsResult.success) setRelationshipTypes(relationsResult.data);
      } catch (error) {
        console.error('Error loading catalogs:', error);
      }
    };

    loadCatalogs();
  }, []);

  // Establecer Chile como país por defecto una vez que se cargan los países
  useEffect(() => {
    if (mode === 'create' && countries.length > 0 && !defaultCountrySet) {
      const chile = countries.find(country => 
        country.codigo === 'CL' || country.nombre === 'Chile'
      );
      if (chile) {
        setFormData(prev => ({
          ...prev,
          paisId: chile.id
        }));
        setDefaultCountrySet(true);
      }
    }
  }, [countries, mode, defaultCountrySet]);

  const handleInputChange = (field: keyof CreateClientFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpiar error si existe
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleContactoChange = (index: number, field: keyof CreateClientContactFormData, value: any) => {
    const nuevosContactos = [...formData.contactos];
    nuevosContactos[index] = {
      ...nuevosContactos[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      contactos: nuevosContactos
    }));
  };

  const agregarContacto = () => {
    setFormData(prev => ({
      ...prev,
      contactos: [...prev.contactos, {
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        telefonoMovil: '',
        cargo: '',
        departamento: '',
        tipoRelacionId: undefined,
        relacion: '',
        esContactoPrincipal: false,
        notas: ''
      }]
    }));
  };

  const eliminarContacto = (index: number) => {
    if (formData.contactos.length > 1) {
      setFormData(prev => ({
        ...prev,
        contactos: prev.contactos.filter((_, i) => i !== index)
      }));
    }
  };

  const toggleTag = (tagId: number) => {
    setFormData(prev => ({
      ...prev,
      etiquetas: prev.etiquetas.includes(tagId)
        ? prev.etiquetas.filter(id => id !== tagId)
        : [...prev.etiquetas, tagId]
    }));
  };

  const getAvailableTags = () => {
    return tags.filter(tag => 
      tag.activo && 
      (tag.tipoAplicacion === 'todos' || tag.tipoAplicacion === tipoCliente)
    );
  };

  const cambiarTipoCliente = (tipo: ClientType) => {
    setTipoCliente(tipo);
    setFormData(prev => ({
      ...prev,
      tipoCliente: tipo
    }));
  };

  const handleImageChange = (newImageUrl: string | null, newImagePath: string | null) => {
    setImageUrl(newImageUrl);
    setImagePath(newImagePath);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (tipoCliente === ClientType.PERSONA) {
      if (!formData.nombrePrincipal.trim()) newErrors.nombrePrincipal = 'El nombre es requerido';
      if (!formData.apellido?.trim()) newErrors.apellido = 'El apellido es requerido';
    } else {
      if (!formData.razonSocial?.trim()) newErrors.razonSocial = 'La razón social es requerida';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    
    try {
      // Incluir la imagen en los datos del formulario
      const formDataWithImage = {
        ...formData,
        imagen: imageUrl || ''
      };

      let result;
      if (mode === 'create') {
        result = await createClient(formDataWithImage);
      } else {
        if (!client) throw new Error('Cliente no encontrado');
        result = await updateClient({ id: client.id, ...formDataWithImage });
      }

      if (result.success) {
        router.push('/dashboard/customers');
      } else {
        console.error('Error:', result.error);
        // Aquí podrías mostrar un toast o notificación de error
      }
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, name: 'Información Básica', icon: User },
    { id: 2, name: 'Dirección', icon: MapPin },
    { id: 3, name: 'Contactos', icon: Users },
    { id: 4, name: 'Configuración', icon: Tag }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/dashboard/customers')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {mode === 'create' ? 'Crear Nuevo Cliente' : 'Editar Cliente'}
                </h1>
                <p className="text-sm text-gray-600">
                  {mode === 'create' ? 'Complete la información para registrar un nuevo cliente' : 'Modifica la información del cliente'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => router.push('/dashboard/customers')}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={16} />
                {loading ? 'Guardando...' : (mode === 'create' ? 'Guardar Cliente' : 'Actualizar Cliente')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6">
        {/* Tipo de Cliente */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tipo de Cliente</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => cambiarTipoCliente(ClientType.PERSONA)}
              className={`p-4 border-2 rounded-lg transition-all ${
                tipoCliente === ClientType.PERSONA
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  tipoCliente === ClientType.PERSONA ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <User size={20} className={tipoCliente === ClientType.PERSONA ? 'text-green-600' : 'text-gray-600'} />
                </div>
                <div className="text-left">
                  <div className="font-medium">Persona Natural</div>
                  <div className="text-sm text-gray-500">Cliente individual</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => cambiarTipoCliente(ClientType.EMPRESA)}
              className={`p-4 border-2 rounded-lg transition-all ${
                tipoCliente === ClientType.EMPRESA
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  tipoCliente === ClientType.EMPRESA ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Building2 size={20} className={tipoCliente === ClientType.EMPRESA ? 'text-blue-600' : 'text-gray-600'} />
                </div>
                <div className="text-left">
                  <div className="font-medium">Empresa</div>
                  <div className="text-sm text-gray-500">Cliente corporativo</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Información Básica */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Información Básica</h3>
          
          {/* Foto del Cliente */}
          <ClientImageUploader
            currentImageUrl={imageUrl || undefined}
            clientId={client?.id}
            onImageChange={handleImageChange}
            disabled={isSubmitting}
            size="md"
          />

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {tipoCliente === ClientType.PERSONA ? (
               <>
                 <ModernInput
                  label="Nombre"
                  value={formData.nombrePrincipal}
                  onChange={(value) => handleInputChange('nombrePrincipal', value)}
                  placeholder="Ej: Roberto"
                  icon={User}
                  required
                  error={errors.nombrePrincipal}
                />
                <ModernInput
                  label="Apellidos"
                  value={formData.apellido}
                  onChange={(value) => handleInputChange('apellido', value)}
                  placeholder="Ej: Silva Morales"
                  required
                  error={errors.apellido}
                />
                <ModernInput
                  label="Profesión"
                  value={formData.profesion}
                  onChange={(value) => handleInputChange('profesion', value)}
                  placeholder="Ej: Ingeniero Civil"
                  icon={Briefcase}
                />
                <ModernInput
                  label="Fecha de Nacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(value) => handleInputChange('fechaNacimiento', value)}
                  icon={Calendar}
                />
                <ModernSelect
                  label="Género"
                  value={formData.genero}
                  onChange={(value) => handleInputChange('genero', value)}
                  options={[
                    { value: Gender.MASCULINO, label: 'Masculino' },
                    { value: Gender.FEMENINO, label: 'Femenino' },
                    { value: Gender.OTRO, label: 'Otro' }
                  ]}
                  placeholder="Seleccionar género..."
                />
              </>
            ) : (
              <>
                <div className="md:col-span-2">
                  <ModernInput
                    label="Razón Social"
                    value={formData.razonSocial}
                    onChange={(value) => handleInputChange('razonSocial', value)}
                    placeholder="Ej: Constructora ABC Ltda."
                    icon={Building2}
                    required
                    error={errors.razonSocial}
                  />
                </div>
                <ModernSelect
                  label="Sector Económico"
                  value={formData.sectorEconomicoId}
                  onChange={(value) => handleInputChange('sectorEconomicoId', parseInt(value))}
                  options={sectoresEconomicos}
                  placeholder="Seleccionar sector..."
                />
                <ModernInput
                  label="Sitio Web"
                  type="url"
                  value={formData.sitioWeb}
                  onChange={(value) => handleInputChange('sitioWeb', value)}
                  placeholder="https://www.empresa.cl"
                  icon={Globe}
                />
                <ModernInput
                  label="Número de Empleados"
                  type="number"
                  value={formData.numeroEmpleados}
                  onChange={(value) => handleInputChange('numeroEmpleados', value ? parseInt(value) : undefined)}
                  placeholder="150"
                  icon={Users}
                />
                <ModernInput
                  label="Facturación Anual (UF)"
                  type="number"
                  value={formData.facturacionAnual}
                  onChange={(value) => handleInputChange('facturacionAnual', value ? parseFloat(value) : undefined)}
                  placeholder="25000"
                />
              </>
            )}

            {/* Campos comunes */}
            <ModernInput
              label="RUT"
              value={formData.rut}
              onChange={(value) => handleInputChange('rut', value)}
              placeholder="12.345.678-9"
            />
            <ModernInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(value) => handleInputChange('email', value)}
              placeholder="contacto@email.com"
              icon={Mail}
              error={errors.email}
            />
            <ModernInput
              label="Teléfono"
              type="tel"
              value={formData.telefono}
              onChange={(value) => handleInputChange('telefono', value)}
              placeholder="+56 2 2345 6789"
              icon={Phone}
            />
            <ModernInput
              label="Teléfono Móvil"
              type="tel"
              value={formData.telefonoMovil}
              onChange={(value) => handleInputChange('telefonoMovil', value)}
              placeholder="+56 9 8765 4321"
              icon={Phone}
            />
          </div>
        </div>

        {/* Dirección */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Dirección</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <ModernInput
                label="Dirección Principal"
                value={formData.calle}
                onChange={(value) => handleInputChange('calle', value)}
                placeholder="Av. Providencia 1234"
                icon={MapPin}
              />
            </div>
            <ModernInput
              label="Dirección Secundaria"
              value={formData.calle2}
              onChange={(value) => handleInputChange('calle2', value)}
              placeholder="Depto 401, Torre B"
            />
            <ModernInput
              label="Ciudad"
              value={formData.ciudad}
              onChange={(value) => handleInputChange('ciudad', value)}
              placeholder="Santiago"
            />
            <ModernSelect
              label="Región"
              value={formData.region}
              onChange={(value) => handleInputChange('region', value)}
              options={regiones}
              placeholder="Seleccionar región..."
            />
            <ModernInput
              label="Código Postal"
              value={formData.codigoPostal}
              onChange={(value) => handleInputChange('codigoPostal', value)}
              placeholder="7500000"
            />
            <ModernSelect
              label="País"
              value={formData.paisId}
              onChange={(value) => handleInputChange('paisId', parseInt(value))}
              options={paises}
              placeholder="Seleccionar país..."
            />
          </div>
        </div>

        {/* Etiquetas */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Etiquetas y Categorización</h3>
          <p className="text-sm text-gray-600 mb-4">
            Selecciona las etiquetas que mejor describan a este cliente
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {getAvailableTags().map((etiqueta) => (
              <button
                key={etiqueta.id}
                type="button"
                onClick={() => toggleTag(etiqueta.id)}
                className={`p-3 border-2 rounded-lg transition-all flex items-center space-x-3 ${
                  formData.etiquetas.includes(etiqueta.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">🏷️</span>
                <div className="text-left">
                  <div className="font-medium text-sm">{etiqueta.nombre}</div>
                  <div className="w-4 h-1 rounded" style={{ backgroundColor: etiqueta.color }}></div>
                </div>
                {formData.etiquetas.includes(etiqueta.id) && (
                  <Check size={16} className="text-blue-600 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Contactos */}
        {mostrarContactos && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {tipoCliente === ClientType.EMPRESA ? 'Contactos de la Empresa' : 'Contactos y Relaciones'}
              </h3>
              <button
                type="button"
                onClick={agregarContacto}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Agregar Contacto
              </button>
            </div>

            <div className="space-y-6">
              {formData.contactos.map((contacto, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-700">
                      {index === 0 ? (tipoCliente === ClientType.EMPRESA ? 'Contacto Principal' : 'Contacto Familiar') : `Contacto ${index + 1}`}
                    </h4>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => eliminarContacto(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ModernInput
                      label="Nombre"
                      value={contacto.nombre}
                      onChange={(value) => handleContactoChange(index, 'nombre', value)}
                      placeholder="Nombre del contacto"
                      icon={User}
                    />
                    <ModernInput
                      label="Apellido"
                      value={contacto.apellido}
                      onChange={(value) => handleContactoChange(index, 'apellido', value)}
                      placeholder="Apellido del contacto"
                    />
                    <ModernInput
                      label="Email"
                      type="email"
                      value={contacto.email}
                      onChange={(value) => handleContactoChange(index, 'email', value)}
                      placeholder="contacto@email.com"
                      icon={Mail}
                    />
                    <ModernInput
                      label="Teléfono"
                      type="tel"
                      value={contacto.telefono}
                      onChange={(value) => handleContactoChange(index, 'telefono', value)}
                      placeholder="+56 9 8765 4321"
                      icon={Phone}
                    />
                    
                    {tipoCliente === ClientType.EMPRESA ? (
                      <>
                        <ModernSelect
                          label="Cargo"
                          value={contacto.cargo}
                          onChange={(value) => handleContactoChange(index, 'cargo', value)}
                          options={cargosEmpresa}
                          placeholder="Seleccionar cargo..."
                        />
                        <ModernInput
                          label="Departamento"
                          value={contacto.departamento}
                          onChange={(value) => handleContactoChange(index, 'departamento', value)}
                          placeholder="Ventas, Finanzas, etc."
                        />
                      </>
                    ) : (
                      <ModernSelect
                        label="Relación"
                        value={contacto.relacion}
                        onChange={(value) => handleContactoChange(index, 'relacion', value)}
                        options={relacionesPersona}
                        placeholder="Seleccionar relación..."
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Configuración */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Configuración y Preferencias</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Newsletter y Comunicaciones</div>
                <div className="text-sm text-gray-600">Recibir emails informativos y actualizaciones</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.recibirNewsletter}
                  onChange={(e) => handleInputChange('recibirNewsletter', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Marketing y Promociones</div>
                <div className="text-sm text-gray-600">Recibir ofertas especiales y promociones</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.aceptaMarketing}
                  onChange={(e) => handleInputChange('aceptaMarketing', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentarios Adicionales
              </label>
              <textarea
                value={formData.comentarios}
                onChange={(e) => handleInputChange('comentarios', e.target.value)}
                placeholder="Información adicional sobre este cliente..."
                rows={4}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ClientForm; 