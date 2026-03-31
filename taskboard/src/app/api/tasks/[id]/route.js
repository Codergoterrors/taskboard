import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

// PUT /api/tasks/:id — Update an existing task
export async function PUT(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { id } = await params   // ← await added here (Next.js 15+ fix)
  const { title, description, status, priority } = await request.json()

  if (!title || title.trim() === '') {
    return NextResponse.json({ error: 'Task title is required.' }, { status: 400 })
  }

  const existingTask = await prisma.task.findFirst({
    where: { id, userId: user.userId },
  })

  if (!existingTask) {
    return NextResponse.json({ error: 'Task not found.' }, { status: 404 })
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      title: title.trim(),
      description: description?.trim() || '',
      status,
      priority,
    },
  })

  return NextResponse.json({ task: updatedTask })
}

// DELETE /api/tasks/:id — Delete a task
export async function DELETE(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { id } = await params   // ← await added here (Next.js 15+ fix)

  const existingTask = await prisma.task.findFirst({
    where: { id, userId: user.userId },
  })

  if (!existingTask) {
    return NextResponse.json({ error: 'Task not found.' }, { status: 404 })
  }

  await prisma.task.delete({ where: { id } })

  return NextResponse.json({ message: 'Task deleted successfully.' })
}