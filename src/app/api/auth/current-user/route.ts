import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/configuration/auth-actions'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error getting current user' },
      { status: 500 }
    )
  }
} 