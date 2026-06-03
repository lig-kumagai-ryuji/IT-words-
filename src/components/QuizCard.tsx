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
type Screen = 'start' | 'quiz' | 'result'

export default function QuizCard() {
  const [screen, setScreen] = useState<Screen>('start')
  const [mode, setMode] = useState<'term-to-def' | 'def-to-term'>('term-to-def')
  const [questionLimit, setQuestionLimit] = useState(10)
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [quizState, setQuizState] = useState<QuizState>('answering')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const startSession = useCallback(
    async (selectedMode: 'term-to-def' | 'def-to-term', limit: number) => {
      setLoading(true)
      setMode(selectedMode)
      setQuestionLimit(limit)
      const res = await fetch('/api/quiz/session', { method: 'POST' })
      const { sessionId: sid } = await res.json()
      setSessionId(sid)
      setScore(0)
      setTotal(0)
      setScreen('quiz')
      await fetchQuestion(selectedMode, setQuiz, setQuizState, setSelectedId, setLoading)
    },
    [],
  )

  const nextQuestion = useCallback(async () => {
    await fetchQuestion(mode, setQuiz, setQuizState, setSelectedId, setLoading)
  }, [mode])

  const handleAnswer = useCallback(
    async (choiceId: number) => {
      if (quizState !== 'answering' || !quiz || sessionId === null) return
      setSelectedId(choiceId)
      const correct = choiceId === quiz.correctId
      setQuizState(correct ? 'correct' : 'wrong')
      if (correct) setScore((s) => s + 1)
      setTotal((t) => t + 1)
      await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, wordId: quiz.correctId, correct }),
      })
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
  }, [])

  if (screen === 'start') {
    return <StartScreen onStart={startSession} />
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
      {answered && isSelected && !isCorrect && <span className="ml-2 text-red-500 font-bold">✗</span>}
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
    pct >= 90 ? { label: '優秀！', color: 'text-yellow-500' }
    : pct >= 70 ? { label: '合格', color: 'text-green-600' }
    : pct >= 50 ? { label: 'もう少し', color: 'text-blue-500' }
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
  setQuiz: (q: QuizData | null) => void,
  setQuizState: (s: QuizState) => void,
  setSelectedId: (id: number | null) => void,
  setLoading: (b: boolean) => void,
) {
  setLoading(true)
  try {
    const res = await fetch(`/api/quiz/question?mode=${mode}`)
    const data = await res.json()
    setQuiz(data)
    setQuizState('answering')
    setSelectedId(null)
  } finally {
    setLoading(false)
  }
}
