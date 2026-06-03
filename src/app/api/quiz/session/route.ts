import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await prisma.quizSession.create({ data: {} })
  return NextResponse.json({ sessionId: session.id })
}
