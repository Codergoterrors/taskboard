import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const { name, email, password } = await request.json()

    // --- Input Validation ---
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are all required.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      )
    }

    // --- Check for duplicate email ---
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered. Try logging in.' },
        { status: 409 }
      )
    }

    // --- Hash password ---
    const hashedPassword = await bcrypt.hash(password, 10)

    // --- Create user in database ---
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    })

    // --- Generate JWT token ---
    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    })

    // --- Set token as httpOnly cookie ---
    const response = NextResponse.json(
      {
        message: 'Account created successfully.',
        user: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 }
    )

    response.cookies.set('token', token, {
      httpOnly: true,                                      // Not accessible via JavaScript (XSS protection)
      secure: process.env.NODE_ENV === 'production',       // HTTPS only in production
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,                           // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[SIGNUP ERROR]', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
