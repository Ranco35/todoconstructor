'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, Users, Calendar, DollarSign, CheckCircle, Plus, X, User, UserPlus, Search, Clock, Hotel, Car, CreditCard,
  Utensils, Waves
} from 'lucide-react';
// 🔥 CORREGIDO: Usar client-actions wrapper para Server Actions
import { 
  getProductsModular, 
  getPackagesWithProducts, 
  calculatePackagePriceModular, 
  createModularReservation,
  getAgeMultipliers,
  searchClients,
  getClientByRut,
  createClient,
  getSeasonForDate,
  editReservation,
  type ProductModular,
  type PackageModular,
  type PriceResult
} from '@/lib/client-actions';
import { SEASON_TYPES } from '@/types/season';
import type { SeasonInfo } from '@/types/season';
import { Client, ClientType, ClientStatus } from '@/types/client';
import type { CreateClientFormData } from '@/types/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import MultiRoomSelectorModal from './MultiRoomSelectorModal';

// Interface para habitación
interface Room {
  number: string;
  type: string;
  price: number;
  features: string[];
  status: 'available' | 'limited';
  capacity?: number;
  code?: string; // Para mapeo con room_code del sistema modular
}

// Tipos para el modo edición
interface ReservationEditData {
  id: number;
  guest_name: string;
  email: string;
  phone: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  children_ages: number[];
  package_code: string;
  room_code: string; // Mantenemos para compatibilidad con modo edición
  selected_rooms?: Room[]; // Nueva propiedad para múltiples habitaciones
  additional_products: string[];
  comments: string;
  client_id: number | null;
  client?: Client;
}

interface ModularReservationFormProps {
  // Modo edición
  isEditMode?: boolean;
  initialData?: ReservationEditData;
  reservationId?: number; // ID de la reserva para edición
}

// Componente para mostrar pagos
function PagosReservaTable({ reservationId }: { reservationId: number }) {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPagos() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reservations/${reservationId}/payments`);
        const data = await res.json();
        setPagos(data.pagos || []);
      } catch (e) {
        setPagos([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPagos();
  }, [reservationId]);

  if (loading) return <div className="text-gray-500 text-sm">Cargando pagos...</div>;
  if (!pagos.length) return <div className="text-gray-500 text-sm">Sin pagos registrados</div>;

  return (
    <table className="w-full text-xs border mt-2">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-1">Monto</th>
          <th className="p-1">Método</th>
          <th className="p-1">Referencia</th>
          <th className="p-1">Procesado por</th>
          <th className="p-1">Notas</th>
          <th className="p-1">Fecha</th>
        </tr>
      </thead>
      <tbody>
        {pagos.map((p) => (
          <tr key={p.id} className="border-b">
            <td className="p-1 font-bold text-green-700">${p.amount?.toLocaleString('es-CL')}</td>
            <td className="p-1">{p.method}</td>
            <td className="p-1">{p.reference}</td>
            <td className="p-1">{p.processed_by}</td>
            <td className="p-1">{p.notes}</td>
            <td className="p-1">{new Date(p.created_at).toLocaleString('es-CL')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ModularReservationForm({ 
  isEditMode = false, 
  initialData, 
  reservationId
}: ModularReservationFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    guest_name: initialData?.guest_name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    check_in: initialData?.check_in || '',
    check_out: initialData?.check_out || '',
    adults: initialData?.adults || 2,
    children: initialData?.children || 0,
    children_ages: initialData?.children_ages || [] as number[],
    package_code: initialData?.package_code || initialData?.modular_reservation?.package_code || '',
    room_code: initialData?.room_code || initialData?.modular_reservation?.room_code || '', // Para compatibilidad
    additional_products: initialData?.additional_products || [] as string[],
    comments: initialData?.comments || '',
    client_id: initialData?.client_id || null as number | null,
    // ✅ NUEVO: Productos adicionales por categoría CON CANTIDAD
    spa_products: [] as { code: string; quantity: number }[],
    food_products: [] as { code: string; quantity: number }[],
    // Campos de descuento
    discount_type: initialData?.discount_type || 'none',
    discount_value: initialData?.discount_value || 0,
    discount_reason: initialData?.discount_reason || '',
    // Campos de recargo (surcharge)
    surcharge_type: initialData?.surcharge_type || 'none',
    surcharge_value: initialData?.surcharge_value || 0,
    surcharge_reason: initialData?.surcharge_reason || '',
    // Campos de facturación
    billing_address: initialData?.billing_address || '',
    authorized_by: initialData?.authorized_by || ''
  });

  // Nuevo estado para habitaciones múltiples
  const [selectedRooms, setSelectedRooms] = useState<Room[]>(
    initialData?.selected_rooms || []
  );

  // Estados y props que usan paquetes y productos modulares:
  const [products, setProducts] = useState<ProductModular[]>([]);
  // ✅ NUEVO: Estados para productos por categoría
  const [spaProducts, setSpaProducts] = useState<ProductModular[]>([]);
  const [foodProducts, setFoodProducts] = useState<ProductModular[]>([]);
  const [packages, setPackages] = useState<(PackageModular & { products: string[] })[]>([]);
  const [pricing, setPricing] = useState<PriceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showAdditionalProducts, setShowAdditionalProducts] = useState(false);
  // ✅ NUEVO: Estados para mostrar secciones de productos categorías
  const [showSpaSection, setShowSpaSection] = useState(false);
  const [showFoodSection, setShowFoodSection] = useState(false);
  const [ageMultipliers, setAgeMultipliers] = useState<any[]>([]);
  const [packagePrices, setPackagePrices] = useState<Record<string, any>>({});

  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(initialData?.client || null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [clientRut, setClientRut] = useState('');

  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo | null>(null);
  const [loadingSeason, setLoadingSeason] = useState(false);

  // Aseguro el tipo de newClientData
  const [newClientData, setNewClientData] = useState<Partial<CreateClientFormData>>({ tipoCliente: ClientType.PERSONA });

  // Estados para el modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdReservation, setCreatedReservation] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // 🎯 NUEVO: Estado para precios congelados en modo edición
  const [frozenPricing, setFrozenPricing] = useState<PriceResult | null>(null);

  // Cargar productos modulares y paquetes al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          productsResult, 
          packagesResult, 
          ageMultipliersResult,
          // ✅ NUEVO: Cargar productos por categoría
          spaProductsResult,
          foodProductsResult
        ] = await Promise.all([
          getProductsModular(),
          getPackagesWithProducts(),
          getAgeMultipliers(),
          getProductsModular('spa'),
          getProductsModular('comida')
        ]);

        if (productsResult.success) setProducts(productsResult.data || []);
        if (packagesResult.success) setPackages(packagesResult.data || []);
        if (ageMultipliersResult.success) setAgeMultipliers(ageMultipliersResult.data || []);
        
        // ✅ NUEVO: Cargar productos categorizados
        if (spaProductsResult.success) {
          setSpaProducts(spaProductsResult.data || []);
          console.log('🧖‍♀️ DEBUG Spa products cargados:', spaProductsResult.data?.length || 0, spaProductsResult.data);
        }
        if (foodProductsResult.success) {
          setFoodProducts(foodProductsResult.data || []);
          console.log('🍽️ DEBUG Food products cargados:', foodProductsResult.data?.length || 0, foodProductsResult.data);
        }

        // 🎯 NUEVO: En modo edición, cargar precios congelados de BD
        if (isEditMode && initialData?.modular_reservation) {
          const modularRes = initialData.modular_reservation;
          const frozenData = {
            grand_total: parseFloat(modularRes.grand_total?.toString() || '0'),
            breakdown: [], // No necesitamos el breakdown en edición
            discount_amount: parseFloat(modularRes.discount_amount?.toString() || '0'),
            surcharge_amount: parseFloat(modularRes.surcharge_amount?.toString() || '0')
          };
          setFrozenPricing(frozenData);
          console.log('🔒 Precios congelados cargados para edición:', {
            grand_total: frozenData.grand_total,
            discount_amount: frozenData.discount_amount,
            surcharge_amount: frozenData.surcharge_amount,
            raw_grand_total: modularRes.grand_total,
            isEditMode
          });
        } else {
          console.log('⚠️ No se cargaron precios congelados:', {
            isEditMode,
            hasModularReservation: !!initialData?.modular_reservation
          });
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadData();
  }, [isEditMode, initialData]);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar temporada inicial si hay datos de edición
  useEffect(() => {
    if (isEditMode && initialData?.check_in) {
      getSeasonInfoForDate(initialData.check_in);
    }
  }, [isEditMode, initialData]);

  const loadInitialData = async () => {
    try {
      const [
        allProductsResult,
        spaProductsResult, 
        foodProductsResult,
        packagesResult, 
        ageResult
      ] = await Promise.all([
        getProductsModular(), // Todos los productos
        getProductsModular('spa'), // Productos de spa
        getProductsModular('comida'), // Productos de comida
        getPackagesWithProducts(),
        getAgeMultipliers()
      ]);

      if (allProductsResult.data) setProducts(allProductsResult.data);
      if (spaProductsResult.data) setSpaProducts(spaProductsResult.data);
      if (foodProductsResult.data) setFoodProducts(foodProductsResult.data);
      if (Array.isArray(packagesResult) && !("data" in packagesResult)) setPackages(packagesResult);
      if (ageResult.data) setAgeMultipliers(ageResult.data);

      console.log('🔍 Productos cargados:');
      console.log('- Total:', allProductsResult.data?.length || 0);
      console.log('- Spa:', spaProductsResult.data?.length || 0);
      console.log('- Comida:', foodProductsResult.data?.length || 0);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (clientSearchTerm.length >= 2) {
        setIsSearching(true);
        try {
          console.log('[CLIENT-SEARCH] Buscando clientes con término:', clientSearchTerm);
          const result = await searchClients(clientSearchTerm);
          console.log('[CLIENT-SEARCH] Resultado crudo de searchClients:', result);
          if (Array.isArray(result.data) && result.data.length > 0) {
            console.log('[CLIENT-SEARCH] Todos los clientes recibidos:', result.data);
            console.log('[CLIENT-SEARCH] Primer cliente recibido:', result.data[0]);
          }
          if (result.success) {
            // Filtrar solo clientes completos
            const validClients = (result.data || []).filter((c: any): c is Client =>
                c && typeof c.id === 'number' &&
                typeof c.nombrePrincipal === 'string' &&
                typeof c.tipoCliente === 'string' &&
                typeof c.estado === 'string'
            );
            console.log('[CLIENT-SEARCH] validClients después de filtrar:', validClients);
            setSearchResults(Array.isArray(validClients) && validClients.length > 0 ? validClients : []);
          }
        } catch (error) {
          console.error('Error buscando clientes:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [clientSearchTerm]);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setFormData(prev => ({
      ...prev,
      guest_name: client.nombrePrincipal,
      email: client.email || '',
      phone: client.telefono || client.telefonoMovil || '',
      client_id: client.id
    }));
    setClientRut(client.rut || '');
    setClientSearchTerm('');
    setSearchResults([]);
    setShowClientForm(false);
  };

  const handleSearchByRut = async () => {
    if (!clientRut.trim()) {
      alert('Ingrese un RUT para buscar');
      return;
    }

    setIsSearching(true);
    try {
      const result = await getClientByRut(clientRut);
      if (result.success && result.data) {
        handleSelectClient(result.data);
      } else {
        alert('Cliente no encontrado. ¿Desea registrarlo como nuevo cliente?');
        setShowClientForm(true);
      }
    } catch (error) {
      alert('Error al buscar cliente');
    } finally {
      setIsSearching(false);
    }
  };

  // Type guard para razonSocial fuera de la función
  function hasRazonSocial(obj: any): obj is { razonSocial: string } {
    return obj && typeof obj.razonSocial === 'string';
  }

  const handleCreateClient = async () => {
    try {
      const clientData = {
        tipoCliente: newClientData.tipoCliente as ClientType,
        nombrePrincipal: formData.guest_name,
        apellido: newClientData.apellido,
        rut: clientRut,
        email: formData.email,
        telefono: formData.phone,
        calle: newClientData.calle || '',
        ciudad: newClientData.ciudad,
        region: newClientData.region,
        estado: ClientStatus.ACTIVO,
        esClienteFrecuente: false,
        razonSocial: newClientData.tipoCliente === ClientType.EMPRESA && hasRazonSocial(newClientData) ? newClientData.razonSocial : undefined,
        contactos: [],
        etiquetas: [],
        fechaCreacion: new Date(),
        fechaModificacion: new Date(),
        idioma: 'es',
        totalCompras: 0,
        rankingCliente: 0,
        recibirNewsletter: false,
        aceptaMarketing: false
      };

      const result = await createClient(clientData);
      if (result.success) {
        const data = result.data || {};
        const newClient: Client = {
          id: data.id || 0,
          tipoCliente: data.tipoCliente as ClientType,
          nombrePrincipal: data.nombrePrincipal,
          apellido: data.apellido,
          rut: data.rut,
          email: data.email,
          telefono: data.telefono,
          telefonoMovil: data.telefonoMovil,
          estado: data.estado === 'activo' ? ClientStatus.ACTIVO : ClientStatus.INACTIVO,
          fechaCreacion: typeof data.fechaCreacion === 'string' ? new Date(data.fechaCreacion) : data.fechaCreacion || new Date(),
          fechaModificacion: typeof data.fechaModificacion === 'string' ? new Date(data.fechaModificacion) : data.fechaModificacion || new Date(),
          calle: data.calle,
          calle2: data.calle2,
          ciudad: data.ciudad,
          codigoPostal: data.codigoPostal,
          region: data.region,
          paisId: data.paisId,
          sitioWeb: data.sitioWeb,
          idioma: data.idioma || 'es',
          zonaHoraria: data.zonaHoraria,
          imagen: data.imagen,
          comentarios: data.comentarios,
          razonSocial: data.razonSocial,
          giro: data.giro,
          numeroEmpleados: data.numeroEmpleados,
          facturacionAnual: data.facturacionAnual,
          sectorEconomicoId: data.sectorEconomicoId,
          fechaNacimiento: data.fechaNacimiento ? (typeof data.fechaNacimiento === 'string' ? new Date(data.fechaNacimiento) : data.fechaNacimiento) : undefined,
          genero: data.genero,
          profesion: data.profesion,
          titulo: data.titulo,
          esClienteFrecuente: !!data.esClienteFrecuente,
          fechaUltimaCompra: data.fechaUltimaCompra ? (typeof data.fechaUltimaCompra === 'string' ? new Date(data.fechaUltimaCompra) : data.fechaUltimaCompra) : undefined,
          totalCompras: data.totalCompras || 0,
          rankingCliente: data.rankingCliente || 0,
          origenCliente: data.origenCliente,
          recibirNewsletter: !!data.recibirNewsletter,
          aceptaMarketing: !!data.aceptaMarketing,
          pais: data.pais,
          sectorEconomico: data.sectorEconomico,
          contactos: data.contactos || [],
          etiquetas: data.etiquetas || []
        };
        handleSelectClient(newClient);
        setShowClientForm(false);
      } else {
        alert(result.error || 'Error al crear cliente');
      }
    } catch (error) {
      alert('Error al crear cliente');
    }
  };

  const getSeasonInfoForDate = async (date: string) => {
    if (!date) {
      setSeasonInfo(null);
      return;
    }

    setLoadingSeason(true);
    try {
      const result = await getSeasonForDate(date);
      if (result.success && result.data) {
        setSeasonInfo(result.data);
      } else {
        setSeasonInfo(null);
      }
    } catch (error) {
      console.error('Error obteniendo información de temporada:', error);
      setSeasonInfo(null);
    } finally {
      setLoadingSeason(false);
    }
  };

  useEffect(() => {
    if (formData.check_in) {
      getSeasonInfoForDate(formData.check_in);
    }
  }, [formData.check_in]);

  useEffect(() => {
    // 🎯 MODIFICADO: Solo recalcular en modo creación, NO en edición
    if (!isEditMode && formData.check_in && formData.check_out && formData.package_code && 
        (selectedRooms.length > 0 || formData.room_code)) {
      calculatePricing();
    }
  }, [
    isEditMode, // Nueva dependencia
    formData.adults,
    formData.children,
    formData.children_ages,
    formData.package_code,
    formData.room_code,
    formData.check_in,
    formData.check_out,
    formData.additional_products,
    // ✅ NUEVO: Incluir productos categorizados en dependencias
    formData.spa_products,
    formData.food_products,
    selectedRooms // Nueva dependencia para múltiples habitaciones
  ]);

  useEffect(() => {
    // 🎯 MODIFICADO: Solo calcular precios de paquetes en modo creación
    if (!isEditMode && formData.check_in && formData.check_out && packages.length > 0 && 
        (selectedRooms.length > 0 || formData.room_code)) {
      calculateAllPackagePrices();
    }
  }, [isEditMode, formData.check_in, formData.check_out, formData.room_code, formData.adults, formData.children, formData.children_ages, packages, selectedRooms]);

  const calculatePricing = async () => {
    const checkInDate = new Date(formData.check_in);
    const checkOutDate = new Date(formData.check_out);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) return;

    // ✅ NUEVO: Combinar todos los productos adicionales para el cálculo
    // Expandir productos con cantidades para enviar códigos repetidos según quantity
    const expandedSpaProducts = formData.spa_products.flatMap(p => 
      Array(p.quantity).fill(p.code)
    );
    const expandedFoodProducts = formData.food_products.flatMap(p => 
      Array(p.quantity).fill(p.code)
    );
    
    const allAdditionalProducts = [
      ...formData.additional_products,
      ...expandedSpaProducts,
      ...expandedFoodProducts
    ];
    
    console.log('🧮 Productos adicionales enviados al backend:', {
      spa_products: formData.spa_products,
      expandedSpaProducts,
      food_products: formData.food_products,
      expandedFoodProducts,
      allAdditionalProducts
    });

    try {
      // Si hay múltiples habitaciones seleccionadas, calcular el total de todas
      if (selectedRooms.length > 0) {
        let totalGrandTotal = 0;
        let combinedBreakdown: any[] = [];
        
        // Calcular precio para cada habitación
        for (const room of selectedRooms) {
          const roomCode = room.code || `habitacion_${room.number}`;
          const result = await calculatePackagePriceModular({
            package_code: formData.package_code,
            room_code: roomCode,
            adults: formData.adults,
            children_ages: formData.children_ages,
            nights,
            additional_products: allAdditionalProducts
          });

          if (result.data) {
            totalGrandTotal += result.data.grand_total;
            // Agregar información de la habitación al breakdown
            const roomBreakdown = result.data.breakdown.map((item: any) => ({
              ...item,
              room_info: `Habitación ${room.number}`
            }));
            combinedBreakdown.push(...roomBreakdown);
          }
        }

        // Crear objeto de pricing combinado
        const combinedPricing = {
          grand_total: totalGrandTotal,
          breakdown: combinedBreakdown,
          room_count: selectedRooms.length,
          per_room_average: totalGrandTotal / selectedRooms.length
        };
        
        setPricing(combinedPricing);
      } else if (formData.room_code) {
        // Fallback para habitación única (compatibilidad)
        const result = await calculatePackagePriceModular({
          package_code: formData.package_code,
          room_code: formData.room_code,
          adults: formData.adults,
          children_ages: formData.children_ages,
          nights,
          additional_products: allAdditionalProducts
        });

        if (result.data) {
          setPricing(result.data);
        }
      }
    } catch (error) {
      console.error('Error calculating pricing:', error);
    }
  };

  const calculateAllPackagePrices = async () => {
    const checkInDate = new Date(formData.check_in);
    const checkOutDate = new Date(formData.check_out);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0 || (selectedRooms.length === 0 && !formData.room_code)) {
      setPackagePrices({});
      return;
    }

    // ✅ NUEVO: Combinar todos los productos adicionales para el cálculo de paquetes
    // Expandir productos con cantidades para enviar códigos repetidos según quantity
    const expandedSpaProducts = formData.spa_products.flatMap(p => 
      Array(p.quantity).fill(p.code)
    );
    const expandedFoodProducts = formData.food_products.flatMap(p => 
      Array(p.quantity).fill(p.code)
    );
    
    const allAdditionalProducts = [
      ...formData.additional_products,
      ...expandedSpaProducts,
      ...expandedFoodProducts
    ];

    try {
      const pricesPromises = packages.map(async (pkg) => {
        try {
          let totalPrice = 0;
          
          if (selectedRooms.length > 0) {
            // Calcular precio total para todas las habitaciones
            for (const room of selectedRooms) {
              const roomCode = room.code || `habitacion_${room.number}`;
              const result = await calculatePackagePriceModular({
                package_code: pkg.code,
                room_code: roomCode,
                adults: formData.adults,
                children_ages: formData.children_ages,
                nights,
                additional_products: allAdditionalProducts
              });
              if (result.data) {
                totalPrice += result.data.grand_total;
              }
            }
            return { code: pkg.code, data: { grand_total: totalPrice, room_count: selectedRooms.length } };
          } else {
            // Fallback para habitación única
            const result = await calculatePackagePriceModular({
              package_code: pkg.code,
              room_code: formData.room_code,
              adults: formData.adults,
              children_ages: formData.children_ages,
              nights,
              additional_products: allAdditionalProducts
            });
            return { code: pkg.code, data: result.data };
          }
        } catch (error) {
          console.error(`Error calculating price for package ${pkg.code}:`, error);
          return { code: pkg.code, data: null };
        }
      });

      const results = await Promise.all(pricesPromises);
      const pricesMap: Record<string, any> = {};
      results.forEach(({ code, data }) => {
        if (data) {
          pricesMap[code] = data;
        }
      });

      setPackagePrices(pricesMap);
    } catch (error) {
      console.error('Error calculating package prices:', error);
    }
  };

  const handleAdultsChange = (count: number) => {
    setFormData(prev => ({
      ...prev,
      adults: count > 0 ? count : 1
    }));
  };

  const handleChildrenChange = (count: number) => {
    const newAges = Array(count).fill(8);
    setFormData(prev => ({
      ...prev,
      children: count,
      children_ages: newAges
    }));
  };

  const handleChildAgeChange = (index: number, age: number) => {
    const newAges = [...formData.children_ages];
    newAges[index] = age;
    setFormData(prev => ({
      ...prev,
      children_ages: newAges
    }));
  };

  const addAdditionalProduct = (productCode: string) => {
    if (!formData.additional_products.includes(productCode)) {
      setFormData(prev => ({
        ...prev,
        additional_products: [...prev.additional_products, productCode]
      }));
    }
  };

  const removeAdditionalProduct = (productCode: string) => {
    setFormData(prev => ({
      ...prev,
      additional_products: prev.additional_products.filter(p => p !== productCode)
    }));
  };

  // ✅ NUEVO: Funciones para manejo de productos de SPA con cantidad
  const addSpaProduct = (productCode: string) => {
    setFormData(prev => {
      const existingProduct = prev.spa_products.find(p => p.code === productCode);
      if (existingProduct) {
        // Si ya existe, incrementar cantidad
        return {
          ...prev,
          spa_products: prev.spa_products.map(p => 
            p.code === productCode 
              ? { ...p, quantity: p.quantity + 1 }
              : p
          )
        };
      } else {
        // Si no existe, agregar con cantidad 1
        return {
          ...prev,
          spa_products: [...prev.spa_products, { code: productCode, quantity: 1 }]
        };
      }
    });
  };

  const updateSpaProductQuantity = (productCode: string, quantity: number) => {
    if (quantity <= 0) {
      removeSpaProduct(productCode);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      spa_products: prev.spa_products.map(p => 
        p.code === productCode 
          ? { ...p, quantity }
          : p
      )
    }));
  };

  const removeSpaProduct = (productCode: string) => {
    setFormData(prev => ({
      ...prev,
      spa_products: prev.spa_products.filter(p => p.code !== productCode)
    }));
  };

  // ✅ NUEVO: Funciones para manejo de productos de COMIDA con cantidad
  const addFoodProduct = (productCode: string) => {
    setFormData(prev => {
      const existingProduct = prev.food_products.find(p => p.code === productCode);
      if (existingProduct) {
        // Si ya existe, incrementar cantidad
        return {
          ...prev,
          food_products: prev.food_products.map(p => 
            p.code === productCode 
              ? { ...p, quantity: p.quantity + 1 }
              : p
          )
        };
      } else {
        // Si no existe, agregar con cantidad 1
        return {
          ...prev,
          food_products: [...prev.food_products, { code: productCode, quantity: 1 }]
        };
      }
    });
  };

  const updateFoodProductQuantity = (productCode: string, quantity: number) => {
    if (quantity <= 0) {
      removeFoodProduct(productCode);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      food_products: prev.food_products.map(p => 
        p.code === productCode 
          ? { ...p, quantity }
          : p
      )
    }));
  };

  const removeFoodProduct = (productCode: string) => {
    setFormData(prev => ({
      ...prev,
      food_products: prev.food_products.filter(p => p.code !== productCode)
    }));
  };

  // Funciones para manejo de descuentos
  const calculateDiscountAmount = (subtotal: number, discountType: string, discountValue: number): number => {
    if (discountType === 'percentage') {
      return Math.round(subtotal * (discountValue / 100));
    } else if (discountType === 'fixed_amount') {
      return Math.min(discountValue, subtotal); // No puede ser mayor al subtotal
    }
    return 0;
  };

  const handleDiscountChange = (field: string, value: string | number) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Si cambió el tipo de descuento, resetear el valor
      if (field === 'discount_type' && value !== prev.discount_type) {
        newData.discount_value = 0;
      }
      
      return newData;
    });
  };

  // Funciones para manejo de recargos (surcharge)
  const calculateSurchargeAmount = (subtotal: number, surchargeType: string, surchargeValue: number): number => {
    if (surchargeType === 'percentage') {
      return Math.round(subtotal * (surchargeValue / 100));
    } else if (surchargeType === 'fixed_amount') {
      return surchargeValue; // El recargo fijo se suma al total
    }
    return 0;
  };

  const handleSurchargeChange = (field: string, value: string | number) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Si cambió el tipo de recargo, resetear el valor
      if (field === 'surcharge_type' && value !== prev.surcharge_type) {
        newData.surcharge_value = 0;
      }
      
      return newData;
    });
  };

  // 🎯 MODIFICADO: Calcular totales usando precios congelados en edición
  const getCalculatedTotals = () => {
    // En modo edición, usar precios congelados de BD
    if (isEditMode && frozenPricing) {
      const subtotal = frozenPricing.grand_total || 0;
      const discountAmount = calculateDiscountAmount(subtotal, formData.discount_type, formData.discount_value);
      const surchargeAmount = calculateSurchargeAmount(subtotal, formData.surcharge_type, formData.surcharge_value);
      const finalTotal = subtotal - discountAmount + surchargeAmount;
      
      console.log('💰 Cálculo con precios congelados (edición):', {
        subtotal,
        discountAmount,
        surchargeAmount,
        finalTotal
      });
      
      return { subtotal, discountAmount, surchargeAmount, finalTotal };
    }
    
    // En modo creación, usar pricing calculado
    if (!pricing) return { subtotal: 0, discountAmount: 0, surchargeAmount: 0, finalTotal: 0 };
    
    const subtotal = pricing.grand_total || 0;
    const discountAmount = calculateDiscountAmount(subtotal, formData.discount_type, formData.discount_value);
    const surchargeAmount = calculateSurchargeAmount(subtotal, formData.surcharge_type, formData.surcharge_value);
    const finalTotal = subtotal - discountAmount + surchargeAmount;
    
    return { subtotal, discountAmount, surchargeAmount, finalTotal };
  };

  const totals = getCalculatedTotals();

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (!selectedClient) {
        alert(`Debe seleccionar o registrar un cliente antes de ${isEditMode ? 'actualizar' : 'crear'} la reserva`);
        setLoading(false);
        return;
      }

      // ✅ NUEVO: Combinar todos los productos adicionales
      const allAdditionalProducts = [
        ...formData.additional_products,
        ...formData.spa_products.map(p => p.code),
        ...formData.food_products.map(p => p.code)
      ];

      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        // ✅ MODIFICAR: Reemplazar additional_products con productos combinados
        if (key === 'additional_products') {
          formDataObj.append(key, JSON.stringify(allAdditionalProducts));
        }
        // ✅ OMITIR: No enviar spa_products y food_products por separado (ya están combinados)
        else if (key === 'spa_products' || key === 'food_products') {
          // Skip - ya están incluidos en additional_products
        }
        else if (Array.isArray(value)) {
          formDataObj.append(key, JSON.stringify(value));
        } else if (value !== null) {
          formDataObj.append(key, value.toString());
        }
      });

      // Agregar datos calculados de descuento y recargo
      formDataObj.append('totalAmount', totals.finalTotal.toString());
      formDataObj.append('discount_amount', totals.discountAmount.toString());
      formDataObj.append('surcharge_amount', totals.surchargeAmount.toString());
      formDataObj.append('client_id', selectedClient.id.toString());
      
      // NUEVO: Agregar habitaciones seleccionadas para múltiples habitaciones
      formDataObj.append('selected_rooms', JSON.stringify(selectedRooms));

      // Si es modo edición, agregar el ID de la reserva
      if (isEditMode && initialData?.id) {
        formDataObj.append('reservation_id', initialData.id.toString());
      }

      let result;
      if (isEditMode && reservationId) {
        // En modo edición, usar la función de edición
        result = await editReservation(reservationId, formDataObj);
        if (result.success) {
          alert('✅ Reserva actualizada exitosamente');
          // Redirigir al detalle de la reserva
          router.push(`/dashboard/reservations/${reservationId}`);
        }
      } else {
        // Crear nueva reserva
        result = await createModularReservation(formDataObj);
      }

      if (result.success) {
        if (isEditMode) {
          // La redirección ya se maneja arriba
        } else {
          // Mostrar modal de éxito con opciones
          setCreatedReservation(result.data);
          setShowSuccessModal(true);
          
          // Limpiar formulario
          setFormData({
            guest_name: '',
            email: '',
            phone: '',
            check_in: '',
            check_out: '',
            adults: 2,
            children: 0,
            children_ages: [],
            package_code: 'MEDIA_PENSION',
            room_code: 'suite_junior',
            additional_products: [],
            // ✅ NUEVO: Limpiar productos categorizados
            spa_products: [],
            food_products: [],
            comments: '',
            client_id: null,
            // Campos de descuento
            discount_type: 'none' as 'none' | 'percentage' | 'fixed_amount',
            discount_value: 0,
            discount_reason: '',
            // Campos de recargo (surcharge)
            surcharge_type: 'none' as 'none' | 'percentage' | 'fixed_amount',
            surcharge_value: 0,
            surcharge_reason: '',
            // Campos de facturación
            billing_address: '',
            authorized_by: ''
          });
          setSelectedClient(null);
          setClientRut('');
          setClientSearchTerm('');
          setSearchResults([]);
          setShowClientForm(false);
          setPricing(null);
        }
      } else {
        alert(result.error || `Error desconocido al ${isEditMode ? 'actualizar' : 'crear'} la reserva`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Error inesperado al ${isEditMode ? 'actualizar' : 'crear'} la reserva`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToCalendar = () => {
    setShowSuccessModal(false);
    router.push('/dashboard/reservations/calendar');
  };

  const handleAddPayment = () => {
    setShowSuccessModal(false);
    setShowPaymentModal(true);
  };

  const handleCreateAnother = () => {
    setShowSuccessModal(false);
    setCreatedReservation(null);
    // El formulario ya está limpio
  };

  const roomProducts = products.filter(p => p.category === 'alojamiento');
  const selectedPackage = packages.find(p => p.code === formData.package_code);
  const nights = formData.check_in && formData.check_out ? 
    Math.ceil((new Date(formData.check_out).getTime() - new Date(formData.check_in).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const packageProductCodes = pricing?.breakdown.filter(item => item.is_included).map(item => item.code) || [];
  const availableAdditionalProducts = products.filter(p => 
    !packageProductCodes.includes(p.code) && 
    !formData.additional_products.includes(p.code) &&
    !formData.spa_products.some(sp => sp.code === p.code) &&
    !formData.food_products.some(fp => fp.code === p.code) &&
    p.category !== 'alojamiento'
  );

  // ✅ NUEVO: Filtrar productos disponibles para Spa (que no estén ya seleccionados)
  const availableSpaProducts = spaProducts.filter(p => 
    !packageProductCodes.includes(p.code) && 
    !formData.spa_products.some(sp => sp.code === p.code) &&
    !formData.additional_products.includes(p.code) &&
    !formData.food_products.some(fp => fp.code === p.code)
  );
  console.log('🧖‍♀️ DEBUG availableSpaProducts:', availableSpaProducts.length, availableSpaProducts);

  // ✅ NUEVO: Filtrar productos disponibles para Alimentación (que no estén ya seleccionados)
  const availableFoodProducts = foodProducts.filter(p => 
    !packageProductCodes.includes(p.code) && 
    !formData.food_products.some(fp => fp.code === p.code) &&
    !formData.additional_products.includes(p.code) &&
    !formData.spa_products.some(sp => sp.code === p.code)
  );
  console.log('🍽️ DEBUG availableFoodProducts:', availableFoodProducts.length, availableFoodProducts);

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showMultiRoomModal, setShowMultiRoomModal] = useState(false);

  const openRoomModal = () => {
    setShowRoomModal(true);
  };

  const closeRoomModal = () => {
    setShowRoomModal(false);
  };

  const openMultiRoomModal = () => {
    setShowMultiRoomModal(true);
  };

  const closeMultiRoomModal = () => {
    setShowMultiRoomModal(false);
  };

  const handleRoomsConfirm = (rooms: Room[]) => {
    setSelectedRooms(rooms);
    // Para compatibilidad con el sistema existente, establecer el primer room_code
    if (rooms.length > 0) {
      setFormData(prev => ({ 
        ...prev, 
        room_code: rooms[0].code || `habitacion_${rooms[0].number}` 
      }));
    } else {
      setFormData(prev => ({ ...prev, room_code: '' }));
    }
  };

  // Copio la función de cálculo del simulador:
  const calculatePackagePriceFrontend = (
    pkg: PackageModular & { products: string[] },
    products: ProductModular[],
    adults: number,
    children: number,
    nights: number
  ) => {
    let total = 0;
    pkg.products.forEach(productCode => {
      const product = products.find(p => p.code === productCode);
      if (!product) return;
      if (product.per_person) {
        const adultsPrice = adults * (product.price || 0);
        const childrenPrice = children * (product.price || 0) * 0.5;
        total += (adultsPrice + childrenPrice) * nights;
      } else {
        total += (product.price || 0) * nights;
      }
    });
    return total;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-[1800px] mx-auto py-6 px-4">
        {/* Cabecera mejorada con navegación */}
        <div className="bg-white/95 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
                🏨 {isEditMode ? 'Editar Reserva' : 'Sistema Modular de Reservas'}
              </h2>
              <p className="text-base text-gray-600">
                {isEditMode 
                  ? 'Modifica los datos de la reserva y actualiza las temporadas automáticamente'
                  : 'Selecciona habitación, paquete y servicios adicionales con cálculo automático de precios'
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/reservations/calendar')}
                className="flex items-center gap-2"
              >
                <Calendar size={16} />
                Ver Calendario
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/reservations/list')}
                className="flex items-center gap-2"
              >
                📋 Lista de Reservas
              </Button>
            </div>
          </div>
        </div>
        
        {/* Layout principal con dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal (formulario) */}
          <div className="lg:col-span-2 space-y-6">
        {/* Información del Huésped */}
        <div className="bg-white/95 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
            <User className="text-blue-600" />
            Cliente del Hotel
          </h3>

          {selectedClient ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-900">
                    {selectedClient.nombrePrincipal} {selectedClient.apellido}
                  </p>
                  <p className="text-sm text-green-700">
                    RUT: {selectedClient.rut} | Email: {selectedClient.email}
                  </p>
                  <p className="text-xs text-green-600">
                    Cliente registrado - {selectedClient.tipoCliente}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClient(null);
                    setFormData(prev => ({ ...prev, guest_name: '', email: '', phone: '', client_id: null }));
                    setClientRut('');
                  }}
                  className="text-green-600 hover:text-green-800"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar por RUT
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="12.345.678-9"
                      value={clientRut}
                      onChange={(e) => setClientRut(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleSearchByRut}
                      disabled={isSearching}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Search size={16} />
                      {isSearching ? '...' : 'Buscar'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  O buscar por nombre/email
                </label>
                <input
                  type="text"
                  placeholder="Nombre, email o razón social..."
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg bg-white max-h-48 overflow-y-auto">
                    {searchResults.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {client.tipoCliente === 'EMPRESA' 
                                ? client.razonSocial || client.nombrePrincipal
                                : `${client.nombrePrincipal} ${client.apellido || ''}`.trim()
                              }
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {client.rut && <span>RUT: {client.rut}</span>}
                              {client.email && <span> • {client.email}</span>}
                            </div>
                            {(client.telefono || client.telefonoMovil) && (
                              <div className="text-xs text-gray-500">
                                📞 {client.telefono || client.telefonoMovil}
                              </div>
                            )}
                          </div>
                          <div className="ml-3 flex flex-col items-end">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              client.tipoCliente === 'EMPRESA' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {client.tipoCliente === 'EMPRESA' ? '🏢 Empresa' : '👤 Persona'}
                            </span>
                            <span className="text-xs text-green-600 mt-1">✅ Activo</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {clientSearchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
                  <div className="mt-2 px-4 py-3 text-sm text-gray-500 text-center border border-gray-200 rounded-lg bg-gray-50">
                    No se encontraron clientes activos con "{clientSearchTerm}"
                  </div>
                )}

                {isSearching && (
                  <div className="mt-2 px-4 py-3 text-sm text-blue-600 text-center border border-blue-200 rounded-lg bg-blue-50">
                    🔍 Buscando clientes...
                  </div>
                )}
              </div>

              {showClientForm && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-yellow-900 flex items-center gap-2">
                    <UserPlus size={16} />
                    Registrar nuevo cliente
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Cliente
                      </label>
                      <select
                        value={newClientData.tipoCliente}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, tipoCliente: e.target.value as ClientType }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="PERSONA">Persona Natural</option>
                        <option value="EMPRESA">Empresa</option>
                      </select>
                    </div>

                    {newClientData.tipoCliente === 'PERSONA' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Apellido
                        </label>
                        <input
                          type="text"
                          value={newClientData.apellido}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, apellido: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={newClientData.ciudad}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, ciudad: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Región
                      </label>
                      <input
                        type="text"
                        value={newClientData.region}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, region: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={newClientData.calle}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, calle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreateClient}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <UserPlus size={16} />
                      Registrar Cliente
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClientForm(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Datos del Huésped */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
            <Users className="text-blue-600" />
            Datos del Huésped
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={formData.guest_name}
                onChange={(e) => setFormData(prev => ({ ...prev, guest_name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Nombre del huésped principal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="email@ejemplo.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="+56 9 XXXX XXXX"
              />
            </div>
          </div>
        </div>

        {/* Fechas */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
            <Calendar className="text-green-600" />
            Fechas de Estadía
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-in *
              </label>
              <input
                type="date"
                value={formData.check_in}
                onChange={(e) => setFormData(prev => ({ ...prev, check_in: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-out *
              </label>
              <input
                type="date"
                value={formData.check_out}
                onChange={(e) => setFormData(prev => ({ ...prev, check_out: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          {nights > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">
                📅 {nights} noche{nights !== 1 ? 's' : ''} de estadía
              </p>
            </div>
          )}

          {/* Información de Temporada */}
          {formData.check_in && (
            <div className="mt-4">
              {loadingSeason ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-medium animate-pulse">
                    🔄 Consultando temporada...
                  </p>
                </div>
              ) : seasonInfo ? (
                <div className={`p-4 rounded-lg border-2 ${
                  seasonInfo.season_type === 'high' 
                    ? 'bg-red-50 border-red-200' 
                    : seasonInfo.season_type === 'low' 
                    ? 'bg-green-50 border-green-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        {SEASON_TYPES[seasonInfo.season_type].icon}
                        {seasonInfo.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {SEASON_TYPES[seasonInfo.season_type].label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {SEASON_TYPES[seasonInfo.season_type].description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        seasonInfo.discount_percentage > 0 
                          ? 'text-red-600' 
                          : seasonInfo.discount_percentage < 0 
                          ? 'text-green-600' 
                          : 'text-gray-600'
                      }`}>
                        {seasonInfo.discount_percentage > 0 
                          ? `+${seasonInfo.discount_percentage}%` 
                          : seasonInfo.discount_percentage < 0 
                          ? `${seasonInfo.discount_percentage}%` 
                          : 'Precio Base'}
                      </div>
                      <p className="text-xs text-gray-500">
                        {seasonInfo.discount_percentage > 0 
                          ? 'Incremento' 
                          : seasonInfo.discount_percentage < 0 
                          ? 'Descuento' 
                          : 'Sin modificación'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className={`flex items-center gap-1 ${
                      seasonInfo.applies_to_rooms ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {seasonInfo.applies_to_rooms ? '✅' : '❌'} Habitaciones
                    </span>
                    <span className={`flex items-center gap-1 ${
                      seasonInfo.applies_to_programs ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {seasonInfo.applies_to_programs ? '✅' : '❌'} Programas
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-600 text-sm">
                    📅 Temporada no configurada para esta fecha
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Huéspedes */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">👥 Huéspedes</h3>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-1">Huéspedes</label>
            <div className="flex gap-4 items-center">
              <div>
                <span>Adultos: </span>
                <input
                  type="number"
                  min={1}
                  value={formData.adults}
                  onChange={e => handleAdultsChange(Number(e.target.value))}
                  className="w-16 border rounded px-2 py-1"
                />
              </div>
              <div>
                <span>Niños: </span>
                <input
                  type="number"
                  min={0}
                  value={formData.children}
                  onChange={e => handleChildrenChange(Number(e.target.value))}
                  className="w-16 border rounded px-2 py-1"
                />
              </div>
            </div>
            {formData.children > 0 && (
              <div className="mt-2 flex gap-2 items-center">
                {formData.children_ages.map((age, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <span className="text-xs text-gray-500">Edad niño {idx + 1}</span>
                    <input
                      type="number"
                      min={1}
                      max={17}
                      value={age}
                      onChange={e => handleChildAgeChange(idx, Number(e.target.value))}
                      className="w-14 border rounded px-1 py-0.5 text-center"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selección de Habitaciones Múltiples */}
        <div className="bg-white/90 rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold flex items-center gap-2 mb-4 border-b pb-2">
            🛏️ Habitaciones
            {selectedRooms.length > 1 && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                {selectedRooms.length} habitaciones
              </span>
            )}
          </h3>
          
          <div className="flex gap-3 mb-4">
            <button 
              onClick={openRoomModal} 
              className="btn-primary flex-1 py-3 rounded-xl text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
            >
              Seleccionar Una Habitación
            </button>
            <button 
              onClick={openMultiRoomModal} 
              className="btn-primary flex-1 py-3 rounded-xl text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
            >
              🏨 Múltiples Habitaciones
            </button>
          </div>

          {/* Mostrar habitaciones seleccionadas */}
          {selectedRooms.length > 0 ? (
            <div className="space-y-3">
              {selectedRooms.map((room, index) => (
                <div key={`${room.number}-${index}`} className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50 flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="text-lg font-bold text-blue-800">
                      Habitación {room.number} - {room.type}
                    </div>
                    <div className="text-gray-600">
                      {room.features?.join(' • ') || 'Habitación estándar'}
                    </div>
                    {room.capacity && (
                      <div className="text-sm text-gray-500 mt-1">
                        Capacidad: {room.capacity} huéspedes
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                                          <div className="text-xl font-bold text-blue-600">
                        ${room?.price?.toLocaleString('es-CL') || '0'} / noche
                      </div>
                    <div className="text-xs text-green-600 font-medium">IVA incluido</div>
                  </div>
                </div>
              ))}
              
              {/* Total de habitaciones */}
              {selectedRooms.length > 1 && (
                <div className="p-4 rounded-xl border-2 border-green-200 bg-green-50">
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-bold text-green-800">
                      Total de {selectedRooms.length} habitaciones por noche:
                    </div>
                    <div className="text-xl font-bold text-green-600">
                      ${selectedRooms.reduce((total, room) => total + (room?.price || 0), 0).toLocaleString('es-CL')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : formData.room_code ? (
            // Fallback para compatibilidad con sistema anterior
            <div className="mt-4 p-4 rounded-xl border-2 border-blue-200 bg-blue-50 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-1">
                <div className="text-lg font-bold text-blue-800">{roomProducts.find(r => r.code === formData.room_code)?.name}</div>
                <div className="text-gray-600">{roomProducts.find(r => r.code === formData.room_code)?.description}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-blue-600 mt-2">${roomProducts.find(r => r.code === formData.room_code)?.price?.toLocaleString() || '0'}</div>
                <div className="text-xs text-green-600 font-medium">IVA incluido</div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-center text-gray-500">
              Selecciona una o más habitaciones para continuar
            </div>
          )}
        </div>

        {/* Selección de Paquete */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">📦 Paquetes Disponibles</h3>
          <div className="space-y-4">
            {packages
              .slice()
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name))
              .map((pkg, index) => {
                // Cálculo frontend para desglose fiel al simulador
                const pkgWithProducts = pkg as PackageModular & { products: string[] };
                // Valor de habitación: siempre el producto seleccionado
                const selectedRoom = products.find(p => p.code === formData.room_code && p.category === 'alojamiento');
                const roomTotal = selectedRoom ? (selectedRoom.price || 0) * nights : 0;
                // Valor de paquete: suma de productos del paquete que no son alojamiento
                let packageTotal = 0;
                pkgWithProducts.products.forEach(productCode => {
                  const product = products.find(p => p.code === productCode);
                  if (!product || product.category === 'alojamiento') return;
                  if (product.per_person) {
                    const adultsPrice = formData.adults * (product.price || 0);
                    const childrenPrice = formData.children * (product.price || 0) * 0.5;
                    packageTotal += (adultsPrice + childrenPrice) * nights;
                  } else {
                    packageTotal += (product.price || 0) * nights;
                  }
                });
                const total = roomTotal + packageTotal;
                const selected = formData.package_code === pkg.code;
                return (
                  <div
                    key={`package-${pkg.code}-${index}`}
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between h-full ${
                      selected
                        ? 'border-green-500 bg-gradient-to-r from-green-50 to-green-100 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, package_code: pkg.code }))}
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg mb-1">{pkg.name}</h4>
                      <p className="text-gray-600 mb-2">{pkg.description}</p>
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">🏨 Habitación ({nights} noche{nights !== 1 ? 's' : ''})</span>
                          <span className="font-medium text-gray-700">${roomTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">📦 Paquete ({formData.adults} adultos{formData.children > 0 ? `, ${formData.children} niños` : ''})</span>
                          <span className="font-medium text-gray-700">${packageTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-semibold border-t pt-2">
                          <span className="text-green-800">💰 Total con IVA incluido</span>
                          <span className="text-green-800 text-lg">${total.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-green-600 text-center">
                          ${total.toLocaleString()} promedio por noche
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 mt-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium bg-${pkg.color}-100 text-${pkg.color}-800`}>
                        {pkg.color.toUpperCase()}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ${total.toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600">IVA incluido</div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* ✅ NUEVA SECCIÓN: Productos Adicionales por Categoría */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
              🛍️ Productos Adicionales
            </h3>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSpaSection(!showSpaSection)}
                className="flex items-center gap-2"
              >
                <Waves className="h-4 w-4" />
                Spa & Tratamientos
                {showSpaSection ? '▼' : '▶'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFoodSection(!showFoodSection)}
                className="flex items-center gap-2"
              >
                <Utensils className="h-4 w-4" />
                Programas por el Día
                {showFoodSection ? '▼' : '▶'}
              </Button>
            </div>
          </div>

          {/* Productos Spa Seleccionados */}
          {formData.spa_products.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Waves className="h-4 w-4 text-blue-600" />
                Spa & Tratamientos Seleccionados
              </h4>
              <div className="flex flex-wrap gap-2">
                {formData.spa_products.map((productItem) => {
                  const product = spaProducts.find(p => p.code === productItem.code);
                  return product ? (
                    <div key={productItem.code} className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-900">{product.name}</span>
                      <span className="text-xs text-blue-600">${product.price?.toLocaleString()}</span>
                      
                      {/* ✅ CONTROLES DE CANTIDAD */}
                      <div className="flex items-center gap-1 bg-white rounded px-2 py-1">
                        <button
                          type="button"
                          onClick={() => updateSpaProductQuantity(productItem.code, productItem.quantity - 1)}
                          className="text-blue-600 hover:text-blue-800 w-5 h-5 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="text-sm font-bold text-blue-900 min-w-[1.5rem] text-center">
                          {productItem.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateSpaProductQuantity(productItem.code, productItem.quantity + 1)}
                          className="text-blue-600 hover:text-blue-800 w-5 h-5 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeSpaProduct(productItem.code)}
                        className="text-blue-600 hover:text-blue-800 ml-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Productos Alimentación Seleccionados */}
          {formData.food_products.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Utensils className="h-4 w-4 text-green-600" />
                Programas por el Día Seleccionados
              </h4>
              <div className="flex flex-wrap gap-2">
                {formData.food_products.map((productItem) => {
                  const product = foodProducts.find(p => p.code === productItem.code);
                  return product ? (
                    <div key={productItem.code} className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                      <span className="text-sm font-medium text-green-900">{product.name}</span>
                      <span className="text-xs text-green-600">${product.price?.toLocaleString()}</span>
                      
                      {/* ✅ CONTROLES DE CANTIDAD */}
                      <div className="flex items-center gap-1 bg-white rounded px-2 py-1">
                        <button
                          type="button"
                          onClick={() => updateFoodProductQuantity(productItem.code, productItem.quantity - 1)}
                          className="text-green-600 hover:text-green-800 w-5 h-5 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="text-sm font-bold text-green-900 min-w-[1.5rem] text-center">
                          {productItem.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateFoodProductQuantity(productItem.code, productItem.quantity + 1)}
                          className="text-green-600 hover:text-green-800 w-5 h-5 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeFoodProduct(productItem.code)}
                        className="text-green-600 hover:text-green-800 ml-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Sección Spa Expandible */}
          {showSpaSection && (
            <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
              <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Waves className="h-5 w-5" />
                Spa & Tratamientos Disponibles
              </h4>
              {availableSpaProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableSpaProducts.map((product) => (
                    <div key={product.code} className="bg-white border border-blue-200 rounded-lg p-4 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{product.name}</h5>
                          <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                          <p className="text-sm font-medium text-blue-600 mt-2">
                            ${product.price?.toLocaleString() || '0'}{product.per_person ? ' por persona' : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addSpaProduct(product.code)}
                          className="ml-4 p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-blue-600 text-center py-4">No hay productos de Spa disponibles</p>
              )}
            </div>
          )}

          {/* Sección Programas por el Día Expandible */}
          {showFoodSection && (
            <div className="mb-6 p-4 border border-green-200 rounded-lg bg-green-50">
              <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Programas por el Día Disponibles
              </h4>
              {availableFoodProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableFoodProducts.map((product) => (
                    <div key={product.code} className="bg-white border border-green-200 rounded-lg p-4 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{product.name}</h5>
                          <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                          <p className="text-sm font-medium text-green-600 mt-2">
                            ${product.price?.toLocaleString() || '0'}{product.per_person ? ' por persona' : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addFoodProduct(product.code)}
                          className="ml-4 p-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-green-600 text-center py-4">No hay programas por el día disponibles</p>
              )}
            </div>
          )}
        </div>

        {/* Servicios Adicionales Generales (mantenemos la sección original para otros productos) */}
        {showAdditionalProducts && availableAdditionalProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">➕ Otros Servicios Adicionales</h3>
            <div className="space-y-3">
              {availableAdditionalProducts.map((product, index) => (
                <div key={`available-${product.code}-${index}`} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-600">{product.description}</p>
                    <p className="text-sm font-medium text-green-600 mt-1">
                      ${product.price?.toLocaleString() || '0'}{product.per_person ? ' por persona' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => addAdditionalProduct(product.code)}
                    className="ml-4 p-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Descuentos */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">💸 Descuento Especial</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tipo de descuento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Descuento</label>
              <select
                value={formData.discount_type ?? 'none'}
                onChange={(e) => handleDiscountChange('discount_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="none">Sin descuento</option>
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed_amount">Monto fijo ($)</option>
              </select>
            </div>

            {/* Valor del descuento */}
            {formData.discount_type !== 'none' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.discount_type === 'percentage' ? 'Porcentaje' : 'Monto'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.discount_value ?? 0}
                    onChange={(e) => handleDiscountChange('discount_value', parseFloat(e.target.value) || 0)}
                    min="0"
                    max={formData.discount_type === 'percentage' ? 100 : (pricing?.grand_total || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">
                    {formData.discount_type === 'percentage' ? '%' : '$'}
                  </span>
                </div>
                {totals.discountAmount > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    Descuento: ${totals.discountAmount.toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Razón del descuento */}
            {formData.discount_type !== 'none' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Razón del Descuento</label>
                <input
                  type="text"
                  value={formData.discount_reason ?? ''}
                  onChange={(e) => handleDiscountChange('discount_reason', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Cliente frecuente, promoción especial..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Recargos */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">💰 Recargo Especial</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tipo de recargo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Recargo</label>
              <select
                value={formData.surcharge_type ?? 'none'}
                onChange={(e) => handleSurchargeChange('surcharge_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="none">Sin recargo</option>
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed_amount">Monto fijo ($)</option>
              </select>
            </div>

            {/* Valor del recargo */}
            {formData.surcharge_type !== 'none' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.surcharge_type === 'percentage' ? 'Porcentaje' : 'Monto'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.surcharge_value ?? 0}
                    onChange={(e) => handleSurchargeChange('surcharge_value', parseFloat(e.target.value) || 0)}
                    min="0"
                    max={formData.surcharge_type === 'percentage' ? 100 : undefined}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">
                    {formData.surcharge_type === 'percentage' ? '%' : '$'}
                  </span>
                </div>
                {totals.surchargeAmount > 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    Recargo: ${totals.surchargeAmount.toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Razón del recargo */}
            {formData.surcharge_type !== 'none' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Razón del Recargo</label>
                <input
                  type="text"
                  value={formData.surcharge_reason ?? ''}
                  onChange={(e) => handleSurchargeChange('surcharge_reason', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Servicio premium, temporada alta..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Comentarios */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">💬 Comentarios Adicionales</h3>
          <textarea
            value={formData.comments}
            onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            rows={3}
            placeholder="Solicitudes especiales, preferencias, etc."
          />
        </div>
            </div>

            {/* Columna derecha: Resumen sticky */}
            <div className="lg:col-span-1">
              <div className="bg-white/95 rounded-2xl shadow-xl p-6 sticky top-8 space-y-6">
        <h3 className="text-xl font-semibold flex items-center gap-2 mb-4 border-b pb-2">💰 Resumen de Reserva</h3>

        {formData.room_code && (
          <div className="mb-4 p-4 rounded-xl border-2 border-blue-200 bg-blue-50">
            <div className="text-lg font-bold text-blue-800">{roomProducts.find(r => r.code === formData.room_code)?.name}</div>
            <div className="text-gray-600">{roomProducts.find(r => r.code === formData.room_code)?.description}</div>
            <div className="text-xl font-bold text-blue-600 mt-2">${roomProducts.find(r => r.code === formData.room_code)?.price?.toLocaleString() || '0'}</div>
            <div className="text-xs text-green-600 font-medium">IVA incluido</div>
          </div>
        )}

        {pricing && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <DollarSign className="text-green-600" />
                Desglose de Precios
                <span className="text-sm font-normal text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  ✅ IVA incluido
                </span>
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div>
                    <span className="text-gray-900 font-medium">🏨 {products.find(p => p.code === formData.room_code)?.name}</span>
                    <p className="text-sm text-gray-600">{nights} noche{nights !== 1 ? 's' : ''}</p>
                  </div>
                                      <span className="font-bold text-lg text-gray-900">${pricing?.room_total?.toLocaleString() || '0'}</span>
                </div>

                <div className="border-b border-gray-100 pb-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-900 font-medium">📦 {selectedPackage?.name}</span>
                    <span className="font-bold text-lg text-gray-900">${pricing?.package_total?.toLocaleString() || '0'}</span>
                  </div>

                  {/* Desglose detallado por producto */}
                  <div className="space-y-2 ml-4">
                    {pricing.breakdown.filter(item => item.is_included).map((product, index) => (
                      <div key={`breakdown-${product.code}-${index}`} className="flex flex-col text-sm mb-2 p-2 bg-green-50 rounded">
                        <span className="text-gray-700 font-medium">{product.name}</span>
                        {product.per_person ? (
                          <>
                            <div className="flex gap-2 items-center">
                              <span className="text-gray-600">Adultos:</span>
                              <span>${product.total && formData.adults ? (product.adults_price * formData.adults).toLocaleString() : (product.adults_price?.toLocaleString() || '0')} ({product.adults_price?.toLocaleString() || '0'} × {formData.adults})</span>
                            </div>
                            {formData.children > 0 && (
                              <div className="flex gap-2 items-center">
                                <span className="text-gray-600">Niños:</span>
                                <span>${product.children_price && formData.children ? (product.children_price * formData.children).toLocaleString() : (product.children_price?.toLocaleString() || '0')} ({product.children_price?.toLocaleString() || '0'} × {formData.children})</span>
                              </div>
                            )}
                            <div className="flex gap-2 items-center">
                              <span className="text-gray-600">Subtotal ({nights} noche{nights !== 1 ? 's' : ''}):</span>
                              <span className="font-semibold">${product.total?.toLocaleString() || '0'}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex gap-2 items-center">
                            <span className="text-gray-600">Subtotal ({nights} noche{nights !== 1 ? 's' : ''}):</span>
                            <span className="font-semibold">${product.total?.toLocaleString() || '0'}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ✅ NUEVO: Mostrar todos los productos adicionales categorizados */}
                {(formData.additional_products.length > 0 || formData.spa_products.length > 0 || formData.food_products.length > 0) && (
                  <div className="border-b border-gray-100 pb-3">
                    <h4 className="font-medium text-gray-900 mb-3">🛍️ Productos Adicionales</h4>
                    <div className="space-y-2">
                      {/* Productos Spa */}
                      {formData.spa_products.map((productItem, index) => {
                        const product = spaProducts.find(p => p.code === productItem.code);
                        const totalPrice = product ? (product.price * productItem.quantity) : 0;
                        return (
                          <div key={`spa-${productItem.code}-${index}`} className="flex justify-between items-center text-sm">
                            <div className="flex-1 flex items-center gap-2">
                              <Waves className="h-3 w-3 text-blue-600" />
                              <span className="text-gray-600">
                                {product?.name} x{productItem.quantity}
                              </span>
                              <button
                                onClick={() => removeSpaProduct(productItem.code)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <span className="font-medium text-gray-700">
                              ${totalPrice.toLocaleString()}
                              {productItem.quantity > 1 && (
                                <span className="text-xs text-gray-500 ml-1">
                                  (${product?.price.toLocaleString()} c/u)
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                      
                      {/* Productos Alimentación */}
                      {formData.food_products.map((productItem, index) => {
                        const product = foodProducts.find(p => p.code === productItem.code);
                        const totalPrice = product ? (product.price * productItem.quantity) : 0;
                        return (
                          <div key={`food-${productItem.code}-${index}`} className="flex justify-between items-center text-sm">
                            <div className="flex-1 flex items-center gap-2">
                              <Utensils className="h-3 w-3 text-green-600" />
                              <span className="text-gray-600">
                                {product?.name} x{productItem.quantity}
                              </span>
                              <button
                                onClick={() => removeFoodProduct(productItem.code)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <span className="font-medium text-gray-700">
                              ${totalPrice.toLocaleString()}
                              {productItem.quantity > 1 && (
                                <span className="text-xs text-gray-500 ml-1">
                                  (${product?.price.toLocaleString()} c/u)
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                      
                      {/* Productos Adicionales Generales */}
                      {formData.additional_products.map((productCode, index) => {
                        const product = products.find(p => p.code === productCode);
                        return (
                          <div key={`additional-${productCode}-${index}`} className="flex justify-between items-center text-sm">
                            <div className="flex-1 flex items-center gap-2">
                              <span className="text-gray-600">{product?.name}</span>
                              <button
                                onClick={() => removeAdditionalProduct(productCode)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <span className="font-medium text-gray-700">
                              ${product?.price.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Subtotal sin descuento */}
                <div className="border-b border-gray-100 pb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Subtotal</span>
                    <span className="font-bold text-lg text-gray-900">${totals.subtotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Descuento aplicado */}
                {formData.discount_type !== 'none' && totals.discountAmount > 0 && (
                  <div className="border-b border-gray-100 pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-red-600 font-medium">💸 Descuento</span>
                        {formData.discount_reason && (
                          <p className="text-xs text-gray-500">{formData.discount_reason}</p>
                        )}
                      </div>
                      <span className="font-bold text-lg text-red-600">
                        -${totals.discountAmount.toLocaleString()}
                        {formData.discount_type === 'percentage' && (
                          <span className="text-sm ml-1">({formData.discount_value}%)</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Recargo aplicado */}
                {formData.surcharge_type !== 'none' && totals.surchargeAmount > 0 && (
                  <div className="border-b border-gray-100 pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-red-600 font-medium">💰 Recargo</span>
                        {formData.surcharge_reason && (
                          <p className="text-xs text-gray-500">{formData.surcharge_reason}</p>
                        )}
                      </div>
                      <span className="font-bold text-lg text-red-600">
                        +${totals.surchargeAmount.toLocaleString()}
                        {formData.surcharge_type === 'percentage' && (
                          <span className="text-sm ml-1">({formData.surcharge_value}%)</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-green-800 font-bold text-2xl">TOTAL ESTADÍA</span>
                    <span className="font-bold text-3xl text-green-800">
                      ${totals.finalTotal.toLocaleString()}
                    </span>
                  </div>
                  {formData.discount_type !== 'none' && totals.discountAmount > 0 && (
                    <div className="flex justify-between items-center text-gray-600 mb-2 text-sm">
                      <span>Precio original:</span>
                      <span className="line-through">${totals.subtotal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-green-600 mb-2">
                    <span>Promedio por noche:</span>
                    <span className="font-semibold">${Math.round(totals.finalTotal / nights).toLocaleString()}</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-green-800 bg-green-200 px-3 py-2 rounded-full inline-block">
                      ✅ PRECIO FINAL CON IVA INCLUIDO (19%)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                ✅ Incluido en {selectedPackage?.name}
              </h3>
              <div className="space-y-3">
                {pricing.breakdown.filter(item => item.is_included).map((product, index) => (
                  <div key={`included-${product.code}-${index}`} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-600">
                        {products.find(p => p.code === product.code)?.description}
                      </p>
                      {showProductDetails && (
                        <p className="text-xs text-green-600 mt-1">
                                                  Total: ${product.total?.toLocaleString() || '0'}
                        {product.per_person && ` (Adultos: $${product.adults_price?.toLocaleString() || '0'}, Niños: $${product.children_price?.toLocaleString() || '0'})`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className={`${isEditMode ? 'flex gap-4' : ''}`}>
          <button
            onClick={handleSubmit}
            disabled={loading || !pricing || !selectedClient || !formData.guest_name || !formData.email || !formData.check_in || !formData.check_out}
            className={`${isEditMode ? 'flex-1' : 'w-full'} bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-lg font-semibold disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isEditMode ? 'Actualizando Reserva...' : 'Creando Reserva...'}
              </span>
            ) : !selectedClient ? (
              'Seleccionar Cliente Primero'
            ) : pricing ? (
              `${isEditMode ? 'Actualizar' : 'Crear'} Reserva - $${totals.finalTotal.toLocaleString()} (IVA incluido)`
            ) : (
              'Completar datos para calcular precio'
            )}
          </button>
          
          {isEditMode && (
            <button
              onClick={() => router.back()}
              disabled={loading}
              className="px-8 py-4 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 text-lg font-semibold disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
        </div>

        {!selectedClient && (
          <div className="text-center text-orange-600 text-sm font-medium">
            ⚠️ Debe seleccionar un cliente registrado para continuar
          </div>
        )}

        {selectedClient && !pricing && formData.check_in && formData.check_out && (
          <div className="text-center text-gray-500 text-sm">
            💡 El precio se calculará automáticamente al completar todos los datos
          </div>
        )}

        {/* Historial de Pagos */}
        {isEditMode && reservationId && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mt-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">💳 Pagos Realizados</h3>
            <PagosReservaTable reservationId={reservationId} />
          </div>
        )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Habitación */}
              {showRoomModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Seleccionar Habitación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {roomProducts.map((room, index) => (
                <div
                  key={`room-${room.code}-${index}`}
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 text-lg ${formData.room_code === room.code ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}`}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, room_code: room.code }));
                    closeRoomModal();
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold text-blue-800 text-xl">{room.name}</div>
                                      <div className="text-right ml-4">
                    <div className="font-bold text-2xl text-blue-600">${room?.price?.toLocaleString() || '0'}</div>
                    <div className="text-xs text-green-600 font-medium">IVA incluido</div>
                  </div>
                  </div>
                  <div className="text-gray-600 mb-2">{room.description}</div>
                </div>
              ))}
            </div>
            <button
              onClick={closeRoomModal}
              className="mt-8 w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 text-lg font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal de selección múltiple de habitaciones */}
      <MultiRoomSelectorModal
        open={showMultiRoomModal}
        onClose={closeMultiRoomModal}
        rooms={roomProducts.map(room => ({
          number: room.code.replace('habitacion_', '').replace('suite_', ''),
          type: room.name,
          price: room.price,
          features: room.description ? [room.description] : ['Habitación estándar'],
          status: 'available' as const,
          capacity: room.capacity || 2,
          code: room.code
        }))}
        selectedRooms={selectedRooms}
        onConfirm={handleRoomsConfirm}
        totalAdults={formData.adults}
        totalChildren={formData.children}
        totalChildrenAges={formData.children_ages}
      />

        {/* Modal de éxito después de crear reserva */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="max-w-md w-full p-6 rounded-2xl border border-gray-200 shadow-2xl flex flex-col items-center">
            <DialogTitle className="sr-only">Reserva creada exitosamente</DialogTitle>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setShowSuccessModal(false)}
              aria-label="Cerrar"
              style={{ lineHeight: 1 }}
            >
              &times;
            </button>
            <div className="flex flex-col items-center w-full">
              <div className="text-2xl font-bold text-green-700 flex items-center gap-2 mb-4">
                <span>✔️</span> ¡Reserva Creada Exitosamente!
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 w-full mb-4">
                <div className="font-semibold text-lg mb-2 text-green-900">Detalles de la Reserva:</div>
                <div className="text-gray-700 mb-1"><b>Cliente:</b> {selectedClient?.nombrePrincipal}</div>
                <div className="text-gray-700 mb-1"><b>Total:</b> ${pricing?.grand_total?.toLocaleString() || '0'} <span className="text-xs text-gray-500">(IVA incluido)</span></div>
                <div className="text-gray-700 flex items-center gap-2">
                  <b>Estado:</b>
                  <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                    ⏳ Esperando abono
                  </span>
                </div>
              </div>
              <div className="text-center text-gray-700 mb-4">¿Qué deseas hacer ahora?</div>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button onClick={handleGoToCalendar} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow">
                  📅 Ver en Calendario
                </Button>
                <Button onClick={handleAddPayment} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg shadow">
                  💰 Agregar Abono/Pago
                </Button>
                <Button onClick={handleCreateAnother} variant="outline" className="flex-1 border border-purple-400 text-purple-700 font-semibold py-2 rounded-lg shadow hover:bg-purple-50">
                  ➕ Crear Otra Reserva
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de pago */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                Agregar Abono/Pago
              </DialogTitle>
            </DialogHeader>
            
            {createdReservation && (
              <div className="space-y-4">
                {/* Estado actual de pagos */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="font-semibold">${createdReservation?.reservation?.total_amount?.toLocaleString('es-CL') || '0'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estado:</span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">❌ Sin Pago</span>
                  </div>
                </div>

                <div className="text-center text-gray-600">
                  <p>Use el sistema de administración para agregar pagos</p>
                  <p className="text-sm text-gray-500 mt-2">ID de Reserva: {createdReservation?.reservation?.id || 'N/A'}</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                onClick={() => {
                  setShowPaymentModal(false);
                  router.push('/dashboard/reservations/calendar');
                }}
                className="w-full"
              >
                Ir al Calendario
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
