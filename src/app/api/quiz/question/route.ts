import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 「〇〇とは、…」の先頭部分を削除する
function stripLeadingTerm(definition: string): string {
  return definition.replace(/^.+?とは[、，,]?\s*/, '')
}

// 単語名（「/」区切りの別名も含む）を■■■に置換する
function maskTerm(text: string, term: string): string {
  const variants = term.split('/').map((v) => v.trim()).filter(Boolean)
  let result = text
  for (const variant of variants) {
    const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(escaped, 'g'), '■■■')
  }
  return result
}

function processDefinition(definition: string, termToMask: string): string {
  return maskTerm(stripLeadingTerm(definition), termToMask)
}

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
        : { id: correctWord.id, text: processDefinition(correctWord.definition, correctWord.term) },
    choices: choices.map((w) => ({
      id: w.id,
      // term-to-def: 各選択肢がそれぞれ自分自身の単語名を伏せる
      //   → 全選択肢に同じように■■■が入るため正解が目立たない
      // def-to-term: 単語名をそのまま表示
      text:
        mode === 'term-to-def'
          ? processDefinition(w.definition, w.term)
          : w.term,
    })),
    correctId: correctWord.id,
  })
}
