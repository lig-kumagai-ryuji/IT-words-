'use client'

import { useState, useCallback } from 'react'

type Choice = {
  id: number
  text: string
}

type Question = {
  id: number
  text: string
}

type QuizData = {
  mode: string
  question: Question
  choices: Choice[]
  correctId: number
}

type QuizState = 'answering' | 'correct' | 'wrong'
type Screen = 'start' | 'quiz' | 'result' | 'error'

export default function QuizCard() {
  const [screen, setScreen] = useState<Screen>('start')
  const [errorMessage, setErrorMessage] = useState('')
  const [mode, setMode] = useState<'term-to-def' | 'def-to-term'>('term-to-def')
  const [questionLimit, setQuestionLimit] = useState(10)
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [quizState, setQuizState] = useState<QuizState>('answering')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [usedIds, setUsedIds] = useState<number[]>([])

  const showError = useCallback((msg: string) => {
    setErrorMessage(msg)
    setScreen('error')
    setLoading(false)
  }, [])

  const startSession = useCallback(
    async (selectedMode: 'term-to-def' | 'def-to-term', limit: number) => {
      setLoading(true)
      setMode(selectedMode)
      setQuestionLimit(limit)
      setScore(0)
      setTotal(0)

      try {
        const sessionRes = await fetch('/api/quiz/session', { method: 'POST' })
        if (!sessionRes.ok) throw new Error(`セッション作成に失敗しました (${sessionRes.status})`)
        const { sessionId: sid } = await sessionRes.json()
        if (!sid) throw new Error('セッションIDが取得できませんでした')
        setSessionId(sid)
      } catch (e) {
        showError(
          `データベースへの接続に失敗しました。\n\n` +
          `以下を確認してください:\n` +
          `1. docker compose up -d を実行済みか\n` +
          `2. npm run setup を実行済みか\n\n` +
          `詳細: ${e instanceof Error ? e.message : String(e)}`,
        )
        return
      }

      setUsedIds([])
      setScreen('quiz')

      const ok = await fetchQuestion(selectedMode, [], setQuiz, setQuizState, setSelectedId, setLoading, setUsedIds)
      if (!ok) {
        showError(
          `問題の取得に失敗しました。\n\n` +
          `npm run setup でデータが正しく投入されているか確認してください。`,
        )
      }
    },
    [showError],
  )

  const nextQuestion = useCallback(async () => {
    const ok = await fetchQuestion(mode, usedIds, setQuiz, setQuizState, setSelectedId, setLoading, setUsedIds)
    if (!ok) showError('次の問題の取得に失敗しました。')
  }, [mode, usedIds, showError])

  const handleAnswer = useCallback(
    async (choiceId: number) => {
      if (quizState !== 'answering' || !quiz || !sessionId) return
      setSelectedId(choiceId)
      const correct = choiceId === quiz.correctId
      setQuizState(correct ? 'correct' : 'wrong')
      if (correct) setScore((s) => s + 1)
      setTotal((t) => t + 1)

      // 回答記録は失敗してもクイズは続行する
      fetch('/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, wordId: quiz.correctId, correct }),
      }).catch(() => {})
    },
    [quizState, quiz, sessionId],
  )

  const handleNext = useCallback(() => {
    if (total >= questionLimit) {
      setScreen('result')
    } else {
      nextQuestion()
    }
  }, [total, questionLimit, nextQuestion])

  const restart = useCallback(() => {
    setScreen('start')
    setQuiz(null)
    setScore(0)
    setTotal(0)
    setSessionId(null)
    setUsedIds([])
  }, [])

  if (screen === 'start') {
    return <StartScreen onStart={startSession} />
  }

  if (screen === 'error') {
    return <ErrorScreen message={errorMessage} onBack={restart} />
  }

  if (screen === 'result') {
    return (
      <ResultScreen
        score={score}
        total={questionLimit}
        mode={mode}
        onRestart={restart}
        onRetry={() => startSession(mode, questionLimit)}
      />
    )
  }

  if (loading || !quiz) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  const isLastQuestion = total >= questionLimit

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <ScoreBar score={score} current={total} limit={questionLimit} />
      <div className="bg-white rounded-2xl shadow-lg p-6 mt-4">
        <div className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-3">
          {mode === 'term-to-def' ? '単語 → 意味を選ぶ' : '意味 → 単語を選ぶ'}
        </div>
        <div className="bg-blue-50 rounded-xl p-4 mb-6 min-h-[80px] flex items-center">
          <p className="text-lg font-bold text-gray-800 leading-relaxed">{quiz.question.text}</p>
        </div>
        <div className="space-y-3">
          {quiz.choices.map((choice) => (
            <ChoiceButton
              key={choice.id}
              choice={choice}
              selectedId={selectedId}
              correctId={quiz.correctId}
              quizState={quizState}
              onSelect={handleAnswer}
            />
          ))}
        </div>
        {quizState !== 'answering' && (
          <div className="mt-6 text-center">
            <ResultBanner correct={quizState === 'correct'} />
            <button
              onClick={handleNext}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
            >
              {isLastQuestion ? '結果を確認する →' : '次の問題へ →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const QUESTION_COUNTS = [10, 20, 30, 40, 50]

function StartScreen({
  onStart,
}: {
  onStart: (mode: 'term-to-def' | 'def-to-term', limit: number) => void
}) {
  const [limit, setLimit] = useState(10)

  return (
    <div className="w-full max-w-md mx-auto px-4 text-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">IT単語クイズ</h1>
      <p className="text-gray-500 mb-8">4択でランダムに出題されます</p>

      <div className="bg-white rounded-2xl shadow p-5 mb-6">
        <p className="text-sm font-semibold text-gray-600 mb-4">出題数を選ぶ</p>
        <div className="flex justify-between gap-2 mb-3">
          {QUESTION_COUNTS.map((n) => (
            <button
              key={n}
              onClick={() => setLimit(n)}
              className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors ${
                limit === n
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {n}問
            </button>
          ))}
        </div>
        <input
          type="range"
          min={10}
          max={50}
          step={10}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
        <p className="text-blue-600 font-bold text-lg mt-1">{limit}問</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => onStart('term-to-def', limit)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors text-lg"
        >
          単語 → 意味を答える
        </button>
        <button
          onClick={() => onStart('def-to-term', limit)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors text-lg"
        >
          意味 → 単語を答える
        </button>
      </div>
    </div>
  )
}

function ErrorScreen({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="w-full max-w-md mx-auto px-4 text-center">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
        <pre className="text-left text-sm text-gray-600 bg-gray-50 rounded-xl p-4 mb-6 whitespace-pre-wrap">
          {message}
        </pre>
        <button
          onClick={onBack}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
        >
          ← トップに戻る
        </button>
      </div>
    </div>
  )
}

function ScoreBar({
  score,
  current,
  limit,
}: {
  score: number
  current: number
  limit: number
}) {
  const pct = current === 0 ? 0 : Math.round((score / current) * 100)
  const progress = Math.round((current / limit) * 100)

  return (
    <div className="bg-white rounded-xl shadow px-5 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600 font-medium">
          第 <span className="text-blue-600 font-bold">{current}</span> 問 / {limit}問
        </span>
        <span className="text-gray-600 font-medium">
          正解: <span className="text-green-600 font-bold">{score}</span>
          　正答率: <span className="text-green-600 font-bold">{pct}%</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

function ChoiceButton({
  choice,
  selectedId,
  correctId,
  quizState,
  onSelect,
}: {
  choice: Choice
  selectedId: number | null
  correctId: number
  quizState: QuizState
  onSelect: (id: number) => void
}) {
  const isSelected = selectedId === choice.id
  const isCorrect = choice.id === correctId
  const answered = quizState !== 'answering'

  let bg = 'bg-gray-50 hover:bg-blue-50 border-gray-200 hover:border-blue-300 cursor-pointer'
  if (answered && isCorrect) bg = 'bg-green-50 border-green-400'
  else if (answered && isSelected && !isCorrect) bg = 'bg-red-50 border-red-400'
  else if (answered) bg = 'bg-gray-50 border-gray-200 opacity-60'

  return (
    <button
      onClick={() => !answered && onSelect(choice.id)}
      disabled={answered}
      className={`w-full text-left border-2 rounded-xl px-4 py-3 transition-all ${bg}`}
    >
      <span className="text-sm text-gray-800 leading-relaxed">{choice.text}</span>
      {answered && isCorrect && <span className="ml-2 text-green-600 font-bold">✓</span>}
      {answered && isSelected && !isCorrect && (
        <span className="ml-2 text-red-500 font-bold">✗</span>
      )}
    </button>
  )
}

function ResultBanner({ correct }: { correct: boolean }) {
  return correct ? (
    <div className="text-green-600 font-bold text-xl">正解！ 🎉</div>
  ) : (
    <div className="text-red-500 font-bold text-xl">不正解… 😢</div>
  )
}

function ResultScreen({
  score,
  total,
  mode,
  onRestart,
  onRetry,
}: {
  score: number
  total: number
  mode: string
  onRestart: () => void
  onRetry: () => void
}) {
  const pct = Math.round((score / total) * 100)
  const rank =
    pct >= 90
      ? { label: '優秀！', color: 'text-yellow-500' }
      : pct >= 70
        ? { label: '合格', color: 'text-green-600' }
        : pct >= 50
          ? { label: 'もう少し', color: 'text-blue-500' }
          : { label: '要復習', color: 'text-red-500' }

  return (
    <div className="w-full max-w-md mx-auto px-4 text-center">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">テスト終了</h2>
        <p className="text-gray-500 text-sm mb-6">
          {mode === 'term-to-def' ? '単語 → 意味モード' : '意味 → 単語モード'}　{total}問
        </p>
        <div className="text-6xl font-bold text-blue-600 mb-2">
          {score} <span className="text-3xl text-gray-400">/ {total}</span>
        </div>
        <div className="text-4xl font-bold mb-2">{pct}%</div>
        <div className={`text-2xl font-bold mb-8 ${rank.color}`}>{rank.label}</div>
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            同じ設定でもう一度
          </button>
          <button
            onClick={onRestart}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
          >
            設定を変えてやり直す
          </button>
        </div>
      </div>
    </div>
  )
}

async function fetchQuestion(
  mode: string,
  usedIds: number[],
  setQuiz: (q: QuizData | null) => void,
  setQuizState: (s: QuizState) => void,
  setSelectedId: (id: number | null) => void,
  setLoading: (b: boolean) => void,
  setUsedIds: (fn: (prev: number[]) => number[]) => void,
): Promise<boolean> {
  setLoading(true)
  try {
    const exclude = usedIds.length > 0 ? `&exclude=${usedIds.join(',')}` : ''
    const res = await fetch(`/api/quiz/question?mode=${mode}${exclude}`)
    if (!res.ok) return false
    const data = await res.json()
    if (data.error || !data.question || !data.choices) return false
    setQuiz(data)
    setQuizState('answering')
    setSelectedId(null)
    setUsedIds((prev) => [...prev, data.correctId])
    return true
  } catch {
    return false
  } finally {
    setLoading(false)
  }
}
