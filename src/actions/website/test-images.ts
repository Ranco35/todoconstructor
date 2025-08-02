'use server'

import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server'

export interface TestResult {
  test: string
  success: boolean
  error?: string
  data?: any
}

/**
 * Test completo del sistema de imágenes
 */
export async function runWebsiteImagesSystemTest(): Promise<TestResult[]> {
  const results: TestResult[] = []

  // TEST 1: Verificar conectividad básica con service client (bypassa RLS)
  try {
    console.log('🧪 TEST 1: Service client connectivity...')
    const supabaseService = await getSupabaseServiceClient()
    const { data, error } = await supabaseService
      .from('website_images')
      .select('count', { count: 'exact' })
      .limit(1)

    if (error) {
      results.push({
        test: 'Service Client Connectivity',
        success: false,
        error: `Service client error: ${error.message}`,
        data: { fullError: JSON.stringify(error) }
      })
    } else {
      results.push({
        test: 'Service Client Connectivity',
        success: true,
        data: { count: data }
      })
    }
  } catch (error) {
    results.push({
      test: 'Service Client Connectivity',
      success: false,
      error: `Service client exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: { fullError: JSON.stringify(error) }
    })
  }

  // TEST 2: Verificar conectividad con cliente normal (con RLS)
  try {
    console.log('🧪 TEST 2: Normal client connectivity...')
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from('website_images')
      .select('id')
      .limit(1)

    if (error) {
      results.push({
        test: 'Normal Client Connectivity (RLS)',
        success: false,
        error: `Normal client error: ${error.message}`,
        data: { fullError: JSON.stringify(error) }
      })
    } else {
      results.push({
        test: 'Normal Client Connectivity (RLS)',
        success: true,
        data: { count: data?.length || 0 }
      })
    }
  } catch (error) {
    results.push({
      test: 'Normal Client Connectivity (RLS)',
      success: false,
      error: `Normal client exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: { fullError: JSON.stringify(error) }
    })
  }

  // TEST 3: Verificar que la tabla existe
  try {
    console.log('🧪 TEST 3: Table structure verification...')
    const supabaseService = await getSupabaseServiceClient()
    const { data, error } = await supabaseService
      .rpc('get_table_info', { table_name: 'website_images' })

    if (error) {
      // Si RPC no existe, intentar consulta simple
      const { data: tableData, error: tableError } = await supabaseService
        .from('website_images')
        .select('*')
        .limit(0)

      if (tableError) {
        results.push({
          test: 'Table Structure Verification',
          success: false,
          error: `Table verification error: ${tableError.message}`,
          data: { fullError: JSON.stringify(tableError) }
        })
      } else {
        results.push({
          test: 'Table Structure Verification',
          success: true,
          data: { message: 'Table exists and is accessible' }
        })
      }
    } else {
      results.push({
        test: 'Table Structure Verification',
        success: true,
        data: { tableInfo: data }
      })
    }
  } catch (error) {
    results.push({
      test: 'Table Structure Verification',
      success: false,
      error: `Table verification exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: { fullError: JSON.stringify(error) }
    })
  }

  // TEST 4: Verificar datos de ejemplo
  try {
    console.log('🧪 TEST 4: Sample data verification...')
    const supabaseService = await getSupabaseServiceClient()
    const { data, error } = await supabaseService
      .from('website_images')
      .select('id, filename, category, is_active')

    if (error) {
      results.push({
        test: 'Sample Data Verification',
        success: false,
        error: `Sample data error: ${error.message}`,
        data: { fullError: JSON.stringify(error) }
      })
    } else {
      results.push({
        test: 'Sample Data Verification',
        success: true,
        data: { 
          count: data?.length || 0,
          sampleData: data?.slice(0, 3) || []
        }
      })
    }
  } catch (error) {
    results.push({
      test: 'Sample Data Verification',
      success: false,
      error: `Sample data exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: { fullError: JSON.stringify(error) }
    })
  }

  // TEST 5: Verificar políticas RLS
  try {
    console.log('🧪 TEST 5: RLS policies verification...')
    const supabaseService = await getSupabaseServiceClient()
    const { data, error } = await supabaseService
      .from('pg_policies')
      .select('policyname, permissive')
      .eq('tablename', 'website_images')

    if (error) {
      results.push({
        test: 'RLS Policies Verification',
        success: false,
        error: `RLS verification error: ${error.message}`,
        data: { fullError: JSON.stringify(error) }
      })
    } else {
      results.push({
        test: 'RLS Policies Verification',
        success: true,
        data: { 
          policiesCount: data?.length || 0,
          policies: data || []
        }
      })
    }
  } catch (error) {
    results.push({
      test: 'RLS Policies Verification',
      success: false,
      error: `RLS verification exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: { fullError: JSON.stringify(error) }
    })
  }

  console.log('🧪 All tests completed:', results)
  return results
}

/**
 * Test simple de conectividad
 */
export async function simpleConnectivityTest(): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    console.log('🔌 Simple connectivity test...')
    const supabaseService = await getSupabaseServiceClient()
    
    const { data, error } = await supabaseService
      .from('website_images')
      .select('id')
      .limit(1)

    if (error) {
      return {
        success: false,
        error: error.message,
        data: { fullError: JSON.stringify(error) }
      }
    }

    return {
      success: true,
      data: { message: 'Connection successful', count: data?.length || 0 }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: { fullError: JSON.stringify(error) }
    }
  }
} 