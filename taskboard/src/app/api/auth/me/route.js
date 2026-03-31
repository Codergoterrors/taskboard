import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request) {
  const user = await getUserFromRequest(request)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  // Return only safe user fields (never return the password hash)
  return NextResponse.json({
    user: {
      userId: user.userId,
      name: user.name,
      email: user.email,
    },
  })
}
