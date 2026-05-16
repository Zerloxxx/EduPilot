import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { DIAGNOSTIC, OGE_DIAGNOSTIC, getMockAIRecommendation } from '../data/diagnosticData'
import { SUBJECTS, getSections } from '../data/curriculum'
import { normalizeAnswer } from '../data/examSimData'

const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY

async function generatePlan(subject, subjectLabel, score, weakTopics, strongTopics, sections, daysLeft) {
  const weakList  = weakTopics.length  ? weakTopics.map(t  => `- ${t.topic} (${t.sectionId})`).join('\n')  : '—'
  const strongList = strongTopics.length ? strongTopics.map(t => `- ${t.topic} (${t.sectionId})`).join('\n') : '—'
  const sectionList = sections.map(s => `${s.id}: №${s.taskNumber} ${s.label}`).join('\n')
  const examType = subject === 'math' || subject === 'russian' || subject === 'cs' ? 'ЕГЭ' : 'ОГЭ'
  const timeCtx = daysLeft !== null
    ? `До экзамена: ${daysLeft} дней. ${daysLeft <= 30 ? 'Мало времени — фокус только на слабых темах, не распыляйся.' : daysLeft <= 60 ? 'Умеренно времени — приоритет слабым темам, но проработай и ключевые сильные.' : 'Времени достаточно — можно охватить все темы системно.'}`
    : 'Дата экзамена не указана.'

  const prompt = `Составь персональный план подготовки к ${examType} по предмету: ${subjectLabel}.

Результат входного теста: ${score}%
${timeCtx}
Слабые темы:\n${weakList}
Сильные темы:\n${strongList}

Доступные разделы в приложении (используй ТОЛЬКО эти sectionId):
${sectionList}

Верни JSON строго в таком формате (без markdown, только JSON):
{
  "summary": "1-2 предложения об уровне ученика, сколько дней до экзамена и главном приоритете",
  "tasks": [
    { "id": "t1", "sectionId": "...", "type": "study_theory", "label": "Изучить теорию: №X ...", "priority": "high" },
    { "id": "t2", "sectionId": "...", "type": "complete_levels", "targetCount": 4, "label": "Пройти практику уровни 1–4: №X ...", "priority": "high" }
  ]
}

Правила:
- type: только "study_theory" (изучить теорию раздела) или "complete_levels" (пройти уровни практики)
- targetCount для complete_levels: число от 2 до 6
- Если дней мало (≤30): составь 3–5 задач только на критичные слабые темы
- Если дней достаточно: составь 5–8 задач, слабые темы в приоритете
- priority: "high", "medium" или "low"
- sectionId строго из списка выше`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 700,
      temperature: 0.3,
    }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const data = await res.json()
  return JSON.parse(data.choices[0].message.content)
}

// Returns true when the expected answer is a pure number (integer, decimal, fraction)
function isNumericAnswer(ans) {
  return /^-?\d+([.,]\d+)?(\/\d+)?$/.test((ans ?? '').trim())
}
function filterInput(value, numeric) {
  return numeric
    ? value.replace(/[^0-9.,\-\/]/g, '')
    : value.replace(/[0-9]/g, '')
}

const SUBJECT_ACCENT = {
  cs:      '#3b82f6',
  math:    '#7c3aed',
  russian: '#8b5cf6',
}

// ─── Screens ─────────────────────────────────────────────────────────────────
const SCREEN = { INTRO: 'intro', QUIZ: 'quiz', RESULTS: 'results' }

// ─── Intro ────────────────────────────────────────────────────────────────────
function IntroScreen({ subject, subjectInfo, accent, onStart, onSkip }) {
  return (
    <div className="page-enter" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', padding: '24px 20px', textAlign: 'center',
    }}>
      <div className="anim-pop-in" style={{
        width: '80px', height: '80px', borderRadius: '24px', marginBottom: '24px',
        background: `linear-gradient(135deg, ${accent}, ${accent}99)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px',
        boxShadow: `0 12px 32px ${accent}44`,
        animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}>
        {subjectInfo?.emoji ?? '📝'}
      </div>
      <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '10px', color: 'var(--text-1)' }}>
        Диагностика
      </h1>
      <p style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: '1.6', marginBottom: '32px', maxWidth: '280px' }}>
        Пройди короткий тест по <strong style={{ color: 'var(--text-1)' }}>{subjectInfo?.label}</strong> — узнаем твой уровень и что стоит подтянуть
      </p>

      <div style={{
        width: '100%', borderRadius: '18px', padding: '16px 18px', marginBottom: '28px',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        {[
          { icon: '❓', text: '10 вопросов по ключевым темам' },
          { icon: '⏱️', text: 'Займёт около 3–5 минут' },
          { icon: '🎯', text: 'AI покажет с чего начать' },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px' }}>{icon}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{text}</span>
          </div>
        ))}
      </div>

      <button onClick={onStart} className="tap-scale" style={{
        width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
        background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
        color: '#fff', fontSize: '16px', fontWeight: '700', cursor: 'pointer',
        boxShadow: `0 8px 24px ${accent}44`,
        transition: 'box-shadow 0.2s, transform 0.12s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        Начать диагностику →
      </button>

      <button onClick={onSkip} style={{
        marginTop: '14px', background: 'none', border: 'none',
        color: 'var(--text-3)', fontSize: '13px', cursor: 'pointer',
      }}>
        Пропустить
      </button>
    </div>
  )
}

// ─── Question (text-input version) ───────────────────────────────────────────
function QuizScreen({ questions, accent, onFinish }) {
  const [current, setCurrent] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [checked, setChecked] = useState(false)
  const [answers, setAnswers] = useState([])
  const inputRef = useRef(null)

  const q = questions[current]
  const numeric = isNumericAnswer(q.correctAnswer)
  const progress = (current / questions.length) * 100
  const isCorrect = checked && normalizeAnswer(inputValue) === normalizeAnswer(q.correctAnswer)
  const isWrong = checked && !isCorrect

  const handleCheck = () => {
    if (!inputValue.trim()) return
    setChecked(true)
  }

  const handleNext = () => {
    const newAnswers = [...answers, {
      question: q,
      userAnswer: inputValue,
      isCorrect: normalizeAnswer(inputValue) === normalizeAnswer(q.correctAnswer),
    }]
    if (current + 1 < questions.length) {
      setAnswers(newAnswers)
      setCurrent(current + 1)
      setInputValue('')
      setChecked(false)
      setTimeout(() => inputRef.current?.focus(), 80)
    } else {
      onFinish(newAnswers)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 18px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '600' }}>
          {current + 1} / {questions.length}
        </span>
        <div style={{ flex: 1, height: '4px', borderRadius: '4px', background: 'var(--border)' }}>
          <div style={{
            height: '100%', borderRadius: '4px',
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
            transition: 'width 0.3s ease',
          }} />
        </div>
        <span style={{
          fontSize: '11px', fontWeight: '700', color: accent,
          padding: '3px 8px', borderRadius: '8px',
          background: `${accent}22`, border: `1px solid ${accent}44`,
        }}>
          {q.topic}
        </span>
      </div>

      {/* Question */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          borderRadius: '20px', padding: '20px 18px', marginBottom: '16px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: '15px', lineHeight: '1.65', color: 'var(--text-1)', whiteSpace: 'pre-wrap' }}>
            {q.text}
          </p>
        </div>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          inputMode={numeric ? 'decimal' : 'text'}
          value={inputValue}
          onChange={e => { if (!checked) setInputValue(filterInput(e.target.value, numeric)) }}
          onKeyDown={e => { if (e.key === 'Enter' && !checked && inputValue.trim()) handleCheck() }}
          placeholder={numeric ? 'Введи число…' : 'Введи ответ…'}
          disabled={checked}
          autoFocus
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 14,
            border: `1.5px solid ${checked ? (isCorrect ? '#10b981' : '#ef4444') : `${accent}55`}`,
            background: checked
              ? (isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)')
              : 'var(--bg-card)',
            color: 'var(--text-1)', fontSize: 16, fontWeight: 700,
            outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.18s, background 0.18s',
          }}
        />

        {/* Feedback */}
        {checked && (
          <div style={{
            marginTop: '12px', padding: '12px 14px', borderRadius: '12px',
            background: isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(124,58,237,0.1)',
            border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.25)' : 'rgba(124,58,237,0.2)'}`,
          }}>
            {isCorrect ? (
              <p style={{ fontSize: '13px', color: '#34d399', fontWeight: 600 }}>✅ Верно!</p>
            ) : (
              <p style={{ fontSize: '13px', color: '#c084fc', lineHeight: '1.5' }}>
                💡 Правильный ответ: <strong>{q.correctAnswer}</strong>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!checked ? (
        <button
          onClick={handleCheck}
          disabled={!inputValue.trim()}
          className={inputValue.trim() ? 'tap-scale' : ''}
          style={{
            marginTop: '16px', width: '100%', padding: '15px', borderRadius: '16px',
            border: inputValue.trim() ? 'none' : '1px solid var(--border)',
            background: inputValue.trim()
              ? `linear-gradient(135deg, ${accent}, ${accent}cc)`
              : 'var(--bg-card)',
            color: inputValue.trim() ? '#fff' : 'var(--text-3)',
            fontSize: '15px', fontWeight: '700',
            cursor: inputValue.trim() ? 'pointer' : 'default',
            boxShadow: inputValue.trim() ? `0 6px 20px ${accent}44` : 'none',
            transition: 'all 0.18s',
          }}>
          Проверить ответ
        </button>
      ) : (
        <button className="page-enter" onClick={handleNext} style={{
          marginTop: '16px', width: '100%', padding: '15px', borderRadius: '16px',
          border: 'none', background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
          color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
          boxShadow: `0 6px 20px ${accent}44`,
        }}>
          {current + 1 < questions.length ? 'Следующий вопрос →' : 'Посмотреть результаты →'}
        </button>
      )}
    </div>
  )
}

// ─── Results ──────────────────────────────────────────────────────────────────
function ResultsScreen({ answers, accent, subject, onContinue, onMakePlan }) {
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError]   = useState(null)

  const correct = answers.filter(a => a.isCorrect).length
  const total = answers.length
  const scorePct = Math.round((correct / total) * 100)

  const weak = answers.filter(a => !a.isCorrect).map(a => ({ topic: a.question.topic, sectionId: a.question.sectionId }))
  const strong = answers.filter(a => a.isCorrect).map(a => ({ topic: a.question.topic, sectionId: a.question.sectionId }))

  const aiRec = getMockAIRecommendation(scorePct, weak, subject)

  const scoreColor = scorePct >= 70 ? '#10b981' : scorePct >= 40 ? accent : '#f59e0b'

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '16px 18px 32px' }}>

      {/* Score */}
      <div className="anim-pop-in" style={{
        borderRadius: '22px', padding: '24px', marginBottom: '14px', textAlign: 'center',
        background: `linear-gradient(135deg, ${accent}22, ${accent}0d)`,
        border: `1px solid ${accent}33`,
      }}>
        <div style={{ fontSize: '52px', fontWeight: '900', color: scoreColor, lineHeight: 1 }}>
          {scorePct}%
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-3)', marginTop: '6px' }}>
          {correct} из {total} правильных ответов
        </div>
        <div style={{
          marginTop: '12px', fontSize: '16px', fontWeight: '700',
          color: scorePct >= 70 ? '#10b981' : scorePct >= 40 ? 'var(--text-1)' : '#f59e0b',
        }}>
          {scorePct === 100 ? '🏆 Отлично!' : scorePct >= 70 ? '🎯 Хороший результат!' : scorePct >= 40 ? '📚 Есть потенциал' : '🌱 Начало пути'}
        </div>
      </div>

      {/* AI recommendation */}
      <div style={{
        borderRadius: '18px', padding: '16px 18px', marginBottom: '14px',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(59,130,246,0.12))',
        border: '1px solid rgba(167,139,250,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
          }}>✨</div>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#a78bfa', letterSpacing: '0.04em' }}>
            AI РЕКОМЕНДУЕТ
          </span>
        </div>
        <p style={{ fontSize: '13px', color: '#e0e0f0', lineHeight: '1.6' }}>
          {aiRec}
        </p>
      </div>

      {/* Weak topics */}
      {weak.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-3)', letterSpacing: '0.07em', marginBottom: '8px' }}>
            НУЖНО ПОДТЯНУТЬ ({weak.length})
          </div>
          <div style={{
            borderRadius: '16px', overflow: 'hidden',
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
          }}>
            {weak.map((t, i) => (
              <div key={i} style={{
                padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '10px',
                borderBottom: i < weak.length - 1 ? '1px solid rgba(239,68,68,0.1)' : 'none',
              }}>
                <span style={{ fontSize: '14px' }}>🔴</span>
                <span style={{ fontSize: '13px', color: '#fca5a5' }}>{t.topic}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strong topics */}
      {strong.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-3)', letterSpacing: '0.07em', marginBottom: '8px' }}>
            УЖЕ ЗНАЕШЬ ({strong.length})
          </div>
          <div style={{
            borderRadius: '16px', overflow: 'hidden',
            background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
          }}>
            {strong.map((t, i) => (
              <div key={i} style={{
                padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '10px',
                borderBottom: i < strong.length - 1 ? '1px solid rgba(16,185,129,0.1)' : 'none',
              }}>
                <span style={{ fontSize: '14px' }}>🟢</span>
                <span style={{ fontSize: '13px', color: '#6ee7b7' }}>{t.topic}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Кнопка плана */}
      <button
        onClick={async () => {
          setPlanLoading(true)
          setPlanError(null)
          try {
            await onMakePlan(scorePct, weak, strong)
          } catch {
            setPlanError('Не удалось создать план — проверь интернет')
            setPlanLoading(false)
          }
        }}
        disabled={planLoading}
        className="tap-scale"
        style={{
          width: '100%', padding: '15px', borderRadius: '16px', border: 'none',
          background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
          color: '#fff', fontSize: '15px', fontWeight: '700', cursor: planLoading ? 'default' : 'pointer',
          boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          opacity: planLoading ? 0.8 : 1, marginBottom: '10px',
        }}
      >
        {planLoading ? (
          <>
            <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
            Составляю план…
          </>
        ) : '🤖 Составить план подготовки'}
      </button>

      {planError && (
        <div style={{ fontSize: '12px', color: '#f87171', textAlign: 'center', marginBottom: '8px' }}>
          ⚠️ {planError}
        </div>
      )}

      <button onClick={() => onContinue(scorePct, weak, strong)} style={{
        width: '100%', padding: '14px', borderRadius: '16px',
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        color: 'var(--text-2)', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
      }}>
        Начать без плана →
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DiagnosticTest() {
  const navigate = useNavigate()
  const { progress, saveDiagnostic, savePlan, daysLeft } = useProgress()
  const [screen, setScreen] = useState(SCREEN.INTRO)
  const [answers, setAnswers] = useState([])

  if (!progress) { navigate('/onboarding'); return null }

  const subject = progress.subject
  const accent = SUBJECT_ACCENT[subject] ?? '#7c3aed'
  const subjectInfo = SUBJECTS.find(s => s.id === subject)
  const isOge = progress.exam === 'oge'
  const questions = (isOge ? OGE_DIAGNOSTIC[subject] : DIAGNOSTIC[subject]) ?? []

  const handleFinishQuiz = (ans) => {
    setAnswers(ans)
    setScreen(SCREEN.RESULTS)
  }

  const handleContinue = (score, weak, strong) => {
    saveDiagnostic(score, weak, strong)
    navigate('/home')
  }

  const handleMakePlan = async (score, weak, strong) => {
    saveDiagnostic(score, weak, strong)
    const sections = getSections(subject, progress.exam)
    const plan = await generatePlan(subject, subjectInfo?.label ?? subject, score, weak, strong, sections, daysLeft)
    savePlan(plan)
    navigate('/progress')
  }

  if (screen === SCREEN.INTRO) {
    return <IntroScreen subject={subject} subjectInfo={subjectInfo} accent={accent} onStart={() => setScreen(SCREEN.QUIZ)} onSkip={() => navigate('/home')} />
  }

  if (screen === SCREEN.QUIZ) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text-1)' }}>
        {/* Header */}
        <div style={{
          padding: '12px 18px 10px', flexShrink: 0,
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <button onClick={() => setScreen(SCREEN.INTRO)} style={{
            background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '20px', lineHeight: 1,
          }}>←</button>
          <span style={{ fontSize: '15px', fontWeight: '700' }}>Диагностика</span>
          <div style={{
            marginLeft: 'auto', padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
            background: `${accent}22`, border: `1px solid ${accent}44`, color: accent,
          }}>
            {subjectInfo?.emoji} {subjectInfo?.label}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <QuizScreen key="quiz" questions={questions} accent={accent} onFinish={handleFinishQuiz} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text-1)' }}>
      {/* Header */}
      <div style={{
        padding: '12px 18px 10px', flexShrink: 0,
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <span style={{ fontSize: '15px', fontWeight: '700' }}>Результаты диагностики</span>
        <div style={{
          marginLeft: 'auto', padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
          background: `${accent}22`, border: `1px solid ${accent}44`, color: accent,
        }}>
          {subjectInfo?.emoji} {subjectInfo?.label}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <ResultsScreen answers={answers} accent={accent} subject={subject} onContinue={handleContinue} onMakePlan={handleMakePlan} />
      </div>
    </div>
  )
}
