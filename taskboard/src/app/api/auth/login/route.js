import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    // --- Input Validation ---
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      )
    }

    // --- Find user ---
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Use generic message to avoid leaking which emails are registered
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // --- Verify password ---
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // --- Generate JWT token ---
    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    })

    // --- Set token as httpOnly cookie ---
    const response = NextResponse.json({
      message: 'Login successful.',
      user: { id: user.id, name: user.name, email: user.email },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[LOGIN ERROR]', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
