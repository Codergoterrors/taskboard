import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully.' })

  // Clear the auth cookie by setting it to empty with maxAge 0
  response.cookies.set('token', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  })

  return response
}
