import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { sessionId, wordId, correct } = body as {
    sessionId: number
    wordId: number
    correct: boolean
  }

  await prisma.quizAnswer.create({
    data: { sessionId, wordId, correct },
  })

  await prisma.quizSession.update({
    where: { id: sessionId },
    data: {
      total: { increment: 1 },
      score: correct ? { increment: 1 } : undefined,
    },
  })

  return NextResponse.json({ ok: true })
}
