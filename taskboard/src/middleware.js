import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const getSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  return new TextEncoder().encode(secret)
}

export async function middleware(request) {
  const { pathname } = request.nextUrl

  const protectedRoutes = ['/dashboard']
  const authRoutes = ['/login', '/signup']

  const token = request.cookies.get('token')?.value

  let user = null
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecret())
      user = payload
    } catch (error) {
      console.error('[v0] JWT verification failed:', error.message)
      user = null
    }
  }

  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
}
