import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') ?? 'term-to-def'

  const allWords = await prisma.word.findMany()
  if (allWords.length < 4) {
    return NextResponse.json({ error: 'Not enough words' }, { status: 400 })
  }

  const correctIndex = Math.floor(Math.random() * allWords.length)
  const correctWord = allWords[correctIndex]

  const wrongWords = allWords
    .filter((_, i) => i !== correctIndex)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)

  const choices = [...wrongWords, correctWord].sort(() => Math.random() - 0.5)

  return NextResponse.json({
    mode,
    question:
      mode === 'term-to-def'
        ? { id: correctWord.id, text: correctWord.term }
        : { id: correctWord.id, text: correctWord.definition },
    choices: choices.map((w) => ({
      id: w.id,
      text: mode === 'term-to-def' ? w.definition : w.term,
    })),
    correctId: correctWord.id,
  })
}
