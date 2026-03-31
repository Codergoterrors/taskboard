import { PrismaClient } from '@prisma/client'

// Prevent multiple Prisma Client instances in development (hot reload creates new instances)
// In production, this is just a regular singleton

const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
