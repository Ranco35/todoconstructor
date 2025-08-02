import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET() {
  return handleForceReload();
}

export async function POST() {
  return handleForceReload();
}

async function handleForceReload() {
  try {
    console.log('🔄 Forcing complete calendar reload...');
    
    // Revalidar todas las rutas relacionadas con reservas
    const pathsToRevalidate = [
      '/',
      '/dashboard',
      '/dashboard/reservations',
      '/dashboard/reservations/calendar',
      '/api/reservations',
      '/api/reservations/list',
      '/api/reservations/with-client-info'
    ];
    
    // Revalidar todas las rutas en paralelo
    await Promise.all(
      pathsToRevalidate.map(path => {
        try {
          revalidatePath(path);
          console.log(`✅ Revalidated path: ${path}`);
        } catch (error) {
          console.warn(`⚠️ Failed to revalidate path ${path}:`, error);
        }
      })
    );
    
    // Revalidar rutas dinámicas de reservas específicas
    for (let i = 1; i <= 200; i++) {
      try {
        revalidatePath(`/dashboard/reservations/${i}`);
      } catch (error) {
        // Ignorar errores en rutas dinámicas que no existen
      }
    }
    
    console.log('✅ Complete calendar reload completed');
    
    return NextResponse.json({
      success: true,
      message: 'Calendar reload forced successfully',
      timestamp: new Date().toISOString(),
      revalidated_paths: pathsToRevalidate,
      instructions: {
        client_side: 'Dispatch force-calendar-reload event or refresh page',
        server_side: 'All relevant cache paths have been revalidated'
      }
    });
    
  } catch (error) {
    console.error('Error forcing calendar reload:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error forcing calendar reload',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
} 