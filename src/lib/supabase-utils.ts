import { createClient } from './supabase'
import type { Database } from './supabase'

// Cliente para uso en browser/client components
const supabase = createClient()

// Tipos de las tablas principales
type Category = Database['public']['Tables']['category']['Row']
type Product = Database['public']['Tables']['product']['Row']
type Supplier = Database['public']['Tables']['supplier']['Row']
type User = Database['public']['Tables']['user']['Row']
type Warehouse = Database['public']['Tables']['warehouse']['Row']

// Funciones para Categorías
export const categoryUtils = {
  // Obtener todas las categorías
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('category')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  // Obtener categoría por ID
  async getById(id: number): Promise<Category | null> {
    const { data, error } = await supabase
      .from('category')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Crear nueva categoría
  async create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const { data, error } = await supabase
      .from('category')
      .insert(category)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Actualizar categoría
  async update(id: number, updates: Partial<Category>): Promise<Category> {
    const { data, error } = await supabase
      .from('category')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Eliminar categoría
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('category')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Funciones para Productos
export const productUtils = {
  // Obtener todos los productos
  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('product')
      .select(`
        *,
        category:categoryid(name),
        supplier:supplierid(name)
      `)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  // Obtener producto por ID
  async getById(id: number): Promise<Product | null> {
    const { data, error } = await supabase
      .from('product')
      .select(`
        *,
        category:categoryid(name),
        supplier:supplierid(name)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Crear nuevo producto
  async create(product: Omit<Product, 'id'>): Promise<Product> {
    const { data, error } = await supabase
      .from('product')
      .insert(product)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Actualizar producto
  async update(id: number, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('product')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Eliminar producto
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('product')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Funciones para Proveedores
export const supplierUtils = {
  // Obtener todos los proveedores
  async getAll(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('supplier')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  // Obtener proveedor por ID
  async getById(id: number): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from('supplier')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Crear nuevo proveedor
  async create(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('supplier')
      .insert(supplier)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Actualizar proveedor
  async update(id: number, updates: Partial<Supplier>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('supplier')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Eliminar proveedor
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('supplier')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Funciones para Usuarios
export const userUtils = {
  // Obtener todos los usuarios
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  // Obtener usuario por ID
  async getById(id: number): Promise<User | null> {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Crear nuevo usuario
  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const { data, error } = await supabase
      .from('user')
      .insert(user)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Actualizar usuario
  async update(id: number, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('user')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Eliminar usuario
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('user')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Funciones para Almacenes
export const warehouseUtils = {
  // Obtener todos los almacenes
  async getAll(): Promise<Warehouse[]> {
    const { data, error } = await supabase
      .from('warehouse')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  // Obtener almacén por ID
  async getById(id: number): Promise<Warehouse | null> {
    const { data, error } = await supabase
      .from('warehouse')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Crear nuevo almacén
  async create(warehouse: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>): Promise<Warehouse> {
    const { data, error } = await supabase
      .from('warehouse')
      .insert(warehouse)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Actualizar almacén
  async update(id: number, updates: Partial<Warehouse>): Promise<Warehouse> {
    const { data, error } = await supabase
      .from('warehouse')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Eliminar almacén
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('warehouse')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Función para probar la conexión
export const testConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('category')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Error de conexión a Supabase:', error)
      return false
    }
    
    console.log('Conexión a Supabase exitosa')
    return true
  } catch (error) {
    console.error('Error al probar conexión:', error)
    return false
  }
} 