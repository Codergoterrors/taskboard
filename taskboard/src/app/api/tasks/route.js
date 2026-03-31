import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

// GET /api/tasks — Fetch all tasks for the logged-in user
export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const tasks = await prisma.task.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' }, // Newest first
  })

  return NextResponse.json({ tasks })
}

// POST /api/tasks — Create a new task
export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { title, description, status, priority } = await request.json()

  if (!title || title.trim() === '') {
    return NextResponse.json({ error: 'Task title is required.' }, { status: 400 })
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description?.trim() || '',
      status: status || 'todo',
      priority: priority || 'medium',
      userId: user.userId,
    },
  })

  return NextResponse.json({ task }, { status: 201 })
}
