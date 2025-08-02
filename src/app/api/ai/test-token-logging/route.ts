import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test endpoint para logging de tokens
    return NextResponse.json({
      success: true,
      message: 'Token logging test endpoint',
      timestamp: new Date().toISOString(),
      status: 'operational'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error in token logging test' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Token logged successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error logging token' },
      { status: 500 }
    )
  }
} 