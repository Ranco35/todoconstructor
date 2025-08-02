import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente para el navegador (browser/client components)
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Tipos para las tablas de Supabase (basados en tu schema de Prisma)
export interface Database {
  public: {
    Tables: {
      account: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
      }
      category: {
        Row: {
          id: number
          name: string
          description: string | null
          parentId: number | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          parentId?: number | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          parentId?: number | null
          createdAt?: string
          updatedAt?: string
        }
      }
      product: {
        Row: {
          id: number
          type: string | null
          supplierid: number | null
          supplierCode: string | null
          name: string
          sku: string | null
          barcode: string | null
          description: string | null
          categoryid: number | null
          brand: string | null
          image: string | null
          costprice: number | null
          saleprice: number | null
          vat: number | null
          salesunitid: number | null
          purchaseunitid: number | null
          usageid: number | null
          stateid: number | null
          marketplaceid: number | null
          invoicepolicyid: number | null
          salelinewarnid: number | null
          stockid: number | null
          storageid: number | null
          acquisitionid: number | null
          defaultCostCenterId: number | null
        }
        Insert: {
          id?: number
          type?: string | null
          supplierid?: number | null
          supplierCode?: string | null
          name: string
          sku?: string | null
          barcode?: string | null
          description?: string | null
          categoryid?: number | null
          brand?: string | null
          image?: string | null
          costprice?: number | null
          saleprice?: number | null
          vat?: number | null
          salesunitid?: number | null
          purchaseunitid?: number | null
          usageid?: number | null
          stateid?: number | null
          marketplaceid?: number | null
          invoicepolicyid?: number | null
          salelinewarnid?: number | null
          stockid?: number | null
          storageid?: number | null
          acquisitionid?: number | null
          defaultCostCenterId?: number | null
        }
        Update: {
          id?: number
          type?: string | null
          supplierid?: number | null
          supplierCode?: string | null
          name?: string
          sku?: string | null
          barcode?: string | null
          description?: string | null
          categoryid?: number | null
          brand?: string | null
          image?: string | null
          costprice?: number | null
          saleprice?: number | null
          vat?: number | null
          salesunitid?: number | null
          purchaseunitid?: number | null
          usageid?: number | null
          stateid?: number | null
          marketplaceid?: number | null
          invoicepolicyid?: number | null
          salelinewarnid?: number | null
          stockid?: number | null
          storageid?: number | null
          acquisitionid?: number | null
          defaultCostCenterId?: number | null
        }
      }
      supplier: {
        Row: {
          id: number
          name: string
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          postalCode: string | null
          taxId: string | null
          companyType: string | null
          rank: string | null
          paymentTerm: string | null
          creditLimit: number | null
          isActive: boolean
          notes: string | null
          costCenterId: number | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postalCode?: string | null
          taxId?: string | null
          companyType?: string | null
          rank?: string | null
          paymentTerm?: string | null
          creditLimit?: number | null
          isActive?: boolean
          notes?: string | null
          costCenterId?: number | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postalCode?: string | null
          taxId?: string | null
          companyType?: string | null
          rank?: string | null
          paymentTerm?: string | null
          creditLimit?: number | null
          isActive?: boolean
          notes?: string | null
          costCenterId?: number | null
          createdAt?: string
          updatedAt?: string
        }
      }
      user: {
        Row: {
          id: number
          name: string
          email: string
          password: string
          role: string
          department: string | null
          costCenterId: number | null
          isActive: boolean
          lastLogin: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          name: string
          email: string
          password: string
          role: string
          department?: string | null
          costCenterId?: number | null
          isActive?: boolean
          lastLogin?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          name?: string
          email?: string
          password?: string
          role?: string
          department?: string | null
          costCenterId?: number | null
          isActive?: boolean
          lastLogin?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      warehouse: {
        Row: {
          id: number
          name: string
          description: string | null
          location: string | null
          type: string
          capacity: number | null
          costCenterId: number | null
          isActive: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          location?: string | null
          type: string
          capacity?: number | null
          costCenterId?: number | null
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          location?: string | null
          type?: string
          capacity?: number | null
          costCenterId?: number | null
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
      }
    }
  }
}

// Cliente tipado de Supabase
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey) 