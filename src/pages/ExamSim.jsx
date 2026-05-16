import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { useProgress } from '../hooks/useProgress'
import { EXAM_SIM, normalizeAnswer } from '../data/examSimData'

// ─── Markdown+KaTeX renderer ─────────────────────────────────────────────────
const MD = {
  p: ({ children }) => <p style={{ margin: '0 0 8px', lineHeight: 1.6 }}>{children}</p>,
  strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
}
function MathText({ text, style }) {
  return (
    <div style={style}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} components={MD}>
        {text}
      </ReactMarkdown>
    </div>
  )
}

// ─── Timer ───────────────────────────────────────────────────────────────────
function useTimer(totalSeconds, running) {
  const [left, setLeft] = useState(totalSeconds)
  const ref = useRef(null)
  useEffect(() => {
    if (!running) { clearInterval(ref.current); return }
    ref.current = setInterval(() => setLeft(p => Math.max(0, p - 1)), 1000)
    return () => clearInterval(ref.current)
  }, [running])
  return left
}

function fmtTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ─── Intro screen ────────────────────────────────────────────────────────────
function Intro({ sim, onStart, onBack }) {
  const accent = sim.color ?? '#7c3aed'
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text-1)', padding: '0 20px' }}>
      {/* Back */}
      <div style={{ paddingTop: 18, paddingBottom: 8 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: 14, fontWeight: 600, padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12l-4-4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Назад
        </button>
      </div>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 0, paddingBottom: 20 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24, marginBottom: 20,
          background: `${accent}18`, border: `2px solid ${accent}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38,
        }}>📝</div>

        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-1)', marginBottom: 6 }}>{sim.title}</div>
        <div style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 28 }}>{sim.subtitle}</div>

        {sim.isStub && (
          <div style={{ marginBottom: 24, padding: '10px 18px', borderRadius: 14, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 13, color: '#d97706', fontWeight: 600, maxWidth: 280 }}>
            ⚠️ Демо-версия — задания ещё уточняются
          </div>
        )}

        {/* Info cards */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, width: '100%', maxWidth: 320 }}>
          {[
            { icon: '📋', label: 'Заданий', value: sim.tasks.length },
            { icon: '⏱', label: 'Время', value: `${sim.timeMinutes} мин` },
            { icon: '✍️', label: 'Формат', value: 'Ввод ответа' },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ flex: 1, padding: '12px 8px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', textAlign: 'center', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: `${accent}`, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 28, maxWidth: 290 }}>
          Введи ответ в поле под каждым заданием. Можно переходить между заданиями. После завершения увидишь разбор ошибок.
        </div>

        <button onClick={onStart} className="btn-primary" style={{ maxWidth: 280, background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 6px 20px ${accent}44` }}>
          Начать пробник
        </button>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Returns true when the expected answer is a pure number (integer, decimal, fraction)
function isNumericAnswer(ans) {
  return /^-?\d+([.,]\d+)?(\/\d+)?$/.test((ans ?? '').trim())
}
function filterInput(value, numeric) {
  return numeric
    ? value.replace(/[^0-9.,\-\/]/g, '')   // keep digits, comma, dot, minus, slash
    : value.replace(/[0-9]/g, '')           // strip digits from text answers
}

// ─── Single task view ────────────────────────────────────────────────────────
function TaskView({ task, answer, onChange, submitted, accent }) {
  const isCorrect = submitted && normalizeAnswer(answer) === normalizeAnswer(task.answer)
  const numeric = isNumericAnswer(task.answer)
  const isWrong   = submitted && answer.trim() !== '' && !isCorrect
  const empty     = submitted && answer.trim() === ''

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Task number badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: `${accent}18`, border: `1.5px solid ${accent}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 900, color: accent,
        }}>{task.number}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.06em' }}>
          ЗАДАНИЕ {task.number} · {task.topic}
        </div>
      </div>

      {/* Task text */}
      <div style={{ fontSize: 15, color: 'var(--text-1)', lineHeight: 1.65, marginBottom: task.figure ? 14 : 18 }}>
        <MathText text={task.text} />
      </div>

      {/* Figure */}
      {task.figure && (
        <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{ maxWidth: 200 }}
            dangerouslySetInnerHTML={{ __html: task.figure }}
          />
        </div>
      )}

      {/* Answer input */}
      {!submitted ? (
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            inputMode={numeric ? 'decimal' : 'text'}
            value={answer}
            onChange={e => onChange(filterInput(e.target.value, numeric))}
            placeholder={task.hint ?? 'Введите ответ'}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 14,
              border: `1.5px solid ${accent}55`,
              background: 'var(--bg-card)', color: 'var(--text-1)',
              fontSize: 16, fontWeight: 700, outline: 'none',
              boxSizing: 'border-box',
              boxShadow: `0 2px 8px ${accent}15`,
            }}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* User answer */}
          <div style={{
            padding: '12px 16px', borderRadius: 14,
            border: `1.5px solid ${isCorrect ? '#10b981' : isWrong ? '#ef4444' : '#9ca3af'}55`,
            background: isCorrect ? 'rgba(16,185,129,0.08)' : isWrong ? 'rgba(239,68,68,0.08)' : 'rgba(156,163,175,0.08)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>{isCorrect ? '✅' : empty ? '⬜' : '❌'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>Твой ответ</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: isCorrect ? '#10b981' : isWrong ? '#ef4444' : 'var(--text-3)' }}>
                {answer.trim() || '—'}
              </div>
            </div>
          </div>

          {/* Correct answer (if wrong or empty) */}
          {!isCorrect && (
            <div style={{ padding: '12px 16px', borderRadius: 14, border: '1.5px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>Правильный ответ</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#10b981' }}>{task.answer}</div>
              </div>
            </div>
          )}

          {/* Explanation */}
          {task.explain && (
            <div style={{ padding: '12px 16px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', marginTop: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.05em' }}>РАЗБОР</div>
              <MathText
                text={task.explain}
                style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Exam screen ─────────────────────────────────────────────────────────────
function ExamScreen({ sim, onFinish }) {
  const accent = sim.color ?? '#7c3aed'
  const tasks = sim.tasks
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState(() => Object.fromEntries(tasks.map(t => [t.id, ''])))
  const [submitted, setSubmitted] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const timeLeft = useTimer(sim.timeMinutes * 60, !submitted)

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !submitted) setSubmitted(true)
  }, [timeLeft, submitted])

  const task = tasks[current]
  const answered = Object.values(answers).filter(v => v.trim() !== '').length
  const timerColor = timeLeft < 300 ? '#ef4444' : timeLeft < 600 ? '#f97316' : 'var(--text-1)'

  const handleSubmit = () => {
    setSubmitted(true)
    setShowConfirm(false)
    const results = tasks.map(t => ({
      id: t.id,
      number: t.number,
      topic: t.topic,
      answer: answers[t.id],
      correct: normalizeAnswer(answers[t.id]) === normalizeAnswer(t.answer),
    }))
    const score = results.filter(r => r.correct).length
    onFinish({ results, score, total: tasks.length, timeSpent: sim.timeMinutes * 60 - timeLeft })
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text-1)' }}>

      {/* Fixed header */}
      <div style={{ flexShrink: 0, background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '10px 18px 8px' }}>
        {/* Top row: title + timer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>{sim.title}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{sim.subtitle}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, background: timeLeft < 300 ? 'rgba(239,68,68,0.1)' : 'var(--bg-card)', border: `1px solid ${timeLeft < 300 ? 'rgba(239,68,68,0.3)' : 'var(--border)'}` }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke={timerColor} strokeWidth="1.5"/><path d="M8 4.5V8l2.5 1.5" stroke={timerColor} strokeWidth="1.5" strokeLinecap="round"/></svg>
            <span style={{ fontSize: 15, fontWeight: 800, color: timerColor, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(timeLeft)}</span>
          </div>
        </div>

        {/* Task navigation dots */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {tasks.map((t, i) => {
            const isCur = i === current
            const ans = answers[t.id].trim() !== ''
            const cor = submitted && normalizeAnswer(answers[t.id]) === normalizeAnswer(t.answer)
            const wrong = submitted && ans && !cor
            const bg = submitted
              ? cor ? '#10b981' : wrong ? '#ef4444' : 'var(--bg-card-2)'
              : ans ? accent : 'var(--bg-card-2)'
            return (
              <button key={t.id} onClick={() => setCurrent(i)} style={{
                width: 28, height: 28, borderRadius: 8, border: isCur ? `2px solid ${accent}` : `1px solid ${submitted ? (cor ? '#10b981' : wrong ? '#ef4444' : 'var(--border)') : ans ? `${accent}66` : 'var(--border)'}`,
                background: bg,
                color: ans || submitted ? '#fff' : 'var(--text-3)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s',
                opacity: isCur ? 1 : 0.8,
              }}>
                {t.number}
              </button>
            )
          })}
        </div>
      </div>

      {/* Scrollable task content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 0' }}>
        <TaskView
          key={task.id}
          task={task}
          answer={answers[task.id]}
          onChange={val => setAnswers(p => ({ ...p, [task.id]: val }))}
          submitted={submitted}
          accent={accent}
        />
      </div>

      {/* Fixed footer */}
      {!submitted && (
        <div style={{ flexShrink: 0, background: 'var(--bg)', borderTop: '1px solid var(--border)', padding: '10px 18px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setCurrent(p => Math.max(0, p - 1))} disabled={current === 0} style={{
            width: 42, height: 42, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)',
            cursor: current === 0 ? 'default' : 'pointer', opacity: current === 0 ? 0.35 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4l-4 4 4 4" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>

          <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
            {current + 1} / {tasks.length} · {answered} заполнено
          </div>

          {answers[task.id].trim() !== '' && current < tasks.length - 1 ? (
            <button onClick={() => setCurrent(p => Math.min(tasks.length - 1, p + 1))} style={{
              padding: '0 16px', height: 42, borderRadius: 12, border: 'none',
              background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', flexShrink: 0,
              boxShadow: `0 4px 14px ${accent}33`,
            }}>
              Ответить →
            </button>
          ) : (
            <button onClick={() => setCurrent(p => Math.min(tasks.length - 1, p + 1))} disabled={current === tasks.length - 1} style={{
              width: 42, height: 42, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)',
              cursor: current === tasks.length - 1 ? 'default' : 'pointer', opacity: current === tasks.length - 1 ? 0.35 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}

          <button onClick={() => setShowConfirm(true)} style={{
            padding: '0 18px', height: 42, borderRadius: 12, border: 'none',
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', flexShrink: 0,
            boxShadow: `0 4px 14px ${accent}44`,
          }}>
            Завершить
          </button>
        </div>
      )}

      {/* Confirm submit modal */}
      {showConfirm && (
        <>
          <div onClick={() => setShowConfirm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
            background: 'var(--bg)', borderRadius: '24px 24px 0 0', border: '1px solid var(--border)',
            padding: '20px 24px 36px', textAlign: 'center',
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-2)', margin: '0 auto 20px' }} />
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Завершить пробник?</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>
              Заполнено {answered} из {tasks.length} заданий.<br />Пустые ответы засчитаются как неверные.
            </div>
            <button onClick={handleSubmit} className="btn-primary" style={{ marginBottom: 10, background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>
              Завершить и посмотреть результат
            </button>
            <button onClick={() => setShowConfirm(false)} style={{ width: '100%', padding: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>
              Продолжить решать
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Results screen ───────────────────────────────────────────────────────────
function Results({ sim, results, score, total, timeSpent, onReview, onHome, examKey, initialTask = 0 }) {
  const navigate = useNavigate()
  const accent = sim.color ?? '#7c3aed'
  const tasks = sim.tasks
  const pct = Math.round((score / total) * 100)
  const circ = 2 * Math.PI * 32
  const dash = (pct / 100) * circ
  const minutes = Math.floor(timeSpent / 60)
  const seconds = timeSpent % 60

  let verdict, verdictEmoji
  if (pct >= 80) { verdict = 'Отлично!'; verdictEmoji = '🏆' }
  else if (pct >= 60) { verdict = 'Хороший результат'; verdictEmoji = '👍' }
  else if (pct >= 40) { verdict = 'Есть над чем работать'; verdictEmoji = '📚' }
  else { verdict = 'Нужно повторить темы'; verdictEmoji = '💪' }

  // card carousel
  const [current, setCurrent] = useState(initialTask)
  const [dragOffset, setDragOffset] = useState(0)
  const carouselRef = useRef(null)
  const draggingRef = useRef(false)

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    let start = null
    const onStart = e => { start = { x: e.touches[0].clientX, decided: false, horiz: false }; draggingRef.current = false }
    const onMove = e => {
      if (!start) return
      const dx = e.touches[0].clientX - start.x
      const dy = e.touches[0].clientY - start.y
      if (!start.decided) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return
        start.decided = true; start.horiz = Math.abs(dx) > Math.abs(dy)
      }
      if (!start.horiz) return
      e.preventDefault(); draggingRef.current = true; setDragOffset(dx)
    }
    const onEnd = e => {
      if (!start) return
      const dx = e.changedTouches[0].clientX - start.x; start = null; setDragOffset(0)
      if (!draggingRef.current) return; draggingRef.current = false
      if (dx < -30) setCurrent(p => Math.min(tasks.length - 1, p + 1))
      else if (dx > 30) setCurrent(p => Math.max(0, p - 1))
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => { el.removeEventListener('touchstart', onStart); el.removeEventListener('touchmove', onMove); el.removeEventListener('touchend', onEnd) }
  }, [tasks.length])

  const handleAskAI = (task, userAnswer) => {
    // Save results state so we restore the exact task after returning from chat
    try {
      localStorage.setItem(`edupilot_exam_results_${examKey}`, JSON.stringify({
        results, score, total, timeSpent, currentTask: current,
      }))
    } catch {}
    const threadId = `exam_${examKey}_${task.id}`
    const ctx = {
      threadId,
      threadTitle: `Задание ${task.number} · ${task.topic}`,
      threadEmoji: '📝',
      taskNumber: task.number,
      sectionLabel: task.topic,
      taskText: task.text,
      examKey,
      returnPath: `/exam-sim/${examKey}`,
      userAnswer: userAnswer || '(нет ответа)',
    }
    try { localStorage.setItem('edupilot_chat_context', JSON.stringify(ctx)) } catch {}
    navigate('/chat')
  }

  const task = tasks[current]
  const result = results.find(r => r.id === task.id)
  const isCorrect = result?.correct
  const userAnswer = result?.answer ?? ''

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text-1)' }}>

      {/* ── Fixed header: summary ── */}
      <div style={{ flexShrink: 0, padding: '12px 18px 10px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Score ring */}
          <svg width="64" height="64" style={{ flexShrink: 0 }}>
            <circle cx="32" cy="32" r="27" fill="none" stroke="var(--border)" strokeWidth="6"/>
            <circle cx="32" cy="32" r="27" fill="none" stroke={accent} strokeWidth="6"
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 32 32)"
              style={{ transition: 'stroke-dasharray 0.8s ease' }}/>
            <text x="32" y="29" textAnchor="middle" fill="var(--text-1)" fontSize="15" fontWeight="900">{score}</text>
            <text x="32" y="43" textAnchor="middle" fill="var(--text-3)" fontSize="9">из {total}</text>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-1)', marginBottom: 4 }}>
              {verdictEmoji} {verdict}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 8px', borderRadius: 7, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', fontSize: 11, fontWeight: 700, color: '#10b981' }}>✅ {score}</span>
              <span style={{ padding: '3px 8px', borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11, fontWeight: 700, color: '#ef4444' }}>❌ {total - score}</span>
              <span style={{ padding: '3px 8px', borderRadius: 7, background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-2)' }}>⏱ {minutes}:{seconds.toString().padStart(2,'0')}</span>
            </div>
          </div>
          <button onClick={onHome} style={{
            padding: '7px 14px', borderRadius: 12, border: 'none', flexShrink: 0,
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
          }}>На главную</button>
        </div>

        {/* Task dots */}
        <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
          {tasks.map((t, i) => {
            const r = results.find(x => x.id === t.id)
            const cor = r?.correct
            const bg = cor ? '#10b981' : '#ef4444'
            return (
              <button key={t.id} onClick={() => setCurrent(i)} style={{
                width: 26, height: 26, borderRadius: 7, border: i === current ? `2px solid ${accent}` : '1.5px solid transparent',
                background: bg, color: '#fff', fontSize: 10, fontWeight: 800, cursor: 'pointer',
                opacity: i === current ? 1 : 0.65, transition: 'all 0.15s',
              }}>{t.number}</button>
            )
          })}
        </div>
      </div>

      {/* ── Carousel ── */}
      <div ref={carouselRef} style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          display: 'flex', height: '100%',
          transform: `translateX(calc(-${current * 100}% + ${dragOffset}px))`,
          transition: draggingRef.current ? 'none' : 'transform 0.28s cubic-bezier(0.25,1,0.5,1)',
          willChange: 'transform',
        }}>
          {tasks.map((t, i) => {
            const r = results.find(x => x.id === t.id)
            const cor = r?.correct ?? false
            const ua = r?.answer ?? ''
            const isVisible = Math.abs(i - current) <= 1
            return (
              <div key={t.id} style={{ width: '100%', flexShrink: 0, overflowY: i === current ? 'auto' : 'hidden', padding: '16px 18px 28px' }}>
                {isVisible && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {/* Task header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                        background: cor ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
                        border: `1.5px solid ${cor ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.35)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 900, color: cor ? '#10b981' : '#ef4444',
                      }}>{t.number}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '0.05em' }}>{t.topic}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: cor ? '#10b981' : '#ef4444', marginTop: 1 }}>
                          {cor ? '✅ Верно' : '❌ Ошибка'}
                        </div>
                      </div>
                    </div>

                    {/* Task text */}
                    <div style={{ padding: '14px 16px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                      <div style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.65 }}>
                        <MathText text={t.text} />
                      </div>
                      {t.figure && (
                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
                          <div dangerouslySetInnerHTML={{ __html: t.figure }} />
                        </div>
                      )}
                    </div>

                    {/* Answers */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{
                        padding: '11px 14px', borderRadius: 13,
                        background: cor ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.07)',
                        border: `1px solid ${cor ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`,
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <span style={{ fontSize: 16 }}>{cor ? '✅' : '❌'}</span>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 1 }}>Твой ответ</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: cor ? '#10b981' : '#ef4444' }}>{ua.trim() || '—'}</div>
                        </div>
                      </div>
                      {!cor && (
                        <div style={{ padding: '11px 14px', borderRadius: 13, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>✅</span>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 1 }}>Правильный ответ</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>{t.answer}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Explanation */}
                    {t.explain && (
                      <div style={{ padding: '14px 16px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '0.06em', marginBottom: 8 }}>РАЗБОР РЕШЕНИЯ</div>
                        <MathText text={t.explain} style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.65 }} />
                      </div>
                    )}

                    {/* Ask AI button */}
                    <button onClick={() => handleAskAI(t, ua)} style={{
                      width: '100%', padding: '13px', borderRadius: 14,
                      border: `1.5px solid ${accent}44`,
                      background: `${accent}10`, color: accent,
                      fontSize: 14, fontWeight: 800, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                      <span style={{ fontSize: 18 }}>🤖</span>
                      Разобрать с ИИ
                    </button>

                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Fixed footer: nav + retry ── */}
      <div style={{ flexShrink: 0, background: 'var(--bg)', borderTop: '1px solid var(--border)', padding: '10px 18px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => setCurrent(p => Math.max(0, p - 1))} disabled={current === 0} style={{
          width: 40, height: 40, borderRadius: 11, border: '1px solid var(--border)', background: 'var(--bg-card)',
          cursor: current === 0 ? 'default' : 'pointer', opacity: current === 0 ? 0.3 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M10 4l-4 4 4 4" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
          {current + 1} / {tasks.length}
        </div>
        <button onClick={() => setCurrent(p => Math.min(tasks.length - 1, p + 1))} disabled={current === tasks.length - 1} style={{
          width: 40, height: 40, borderRadius: 11, border: '1px solid var(--border)', background: 'var(--bg-card)',
          cursor: current === tasks.length - 1 ? 'default' : 'pointer', opacity: current === tasks.length - 1 ? 0.3 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button onClick={onReview} style={{
          padding: '0 16px', height: 40, borderRadius: 11, border: '1.5px solid var(--border)',
          background: 'var(--bg-card)', color: 'var(--text-1)', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
        }}>Заново</button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ExamSim() {
  const { examKey } = useParams()
  const navigate = useNavigate()
  const { saveExamResult, progress } = useProgress()

  const sim = EXAM_SIM[examKey]
  const [phase, setPhase] = useState('intro') // intro | exam | results
  const [finalData, setFinalData] = useState(null)
  const [initialResultsTask, setInitialResultsTask] = useState(0)

  useEffect(() => {
    if (!progress) navigate('/onboarding', { replace: true })
  }, [progress, navigate])

  // Restore results if returning from AI chat
  useEffect(() => {
    const saved = localStorage.getItem(`edupilot_exam_results_${examKey}`)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setFinalData({ results: data.results, score: data.score, total: data.total, timeSpent: data.timeSpent })
        setInitialResultsTask(data.currentTask ?? 0)
        setPhase('results')
      } catch {}
      localStorage.removeItem(`edupilot_exam_results_${examKey}`)
    }
  }, [examKey])

  if (!sim) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text-1)', background: 'var(--bg)' }}>
        <div style={{ fontSize: 32 }}>❓</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Экзамен не найден</div>
        <button onClick={() => navigate('/home')} style={{ marginTop: 8, padding: '10px 20px', borderRadius: 12, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>На главную</button>
      </div>
    )
  }

  const handleFinish = (data) => {
    setFinalData(data)
    setPhase('results')
    if (saveExamResult) {
      saveExamResult(examKey, { score: data.score, total: data.total, timeSpent: data.timeSpent, at: Date.now() })
    }
  }

  if (phase === 'intro') {
    return <Intro sim={sim} onStart={() => setPhase('exam')} onBack={() => navigate(-1)} />
  }

  if (phase === 'exam') {
    return <ExamScreen sim={sim} onFinish={handleFinish} />
  }

  return (
    <Results
      sim={sim}
      {...finalData}
      examKey={examKey}
      initialTask={initialResultsTask}
      onHome={() => navigate('/home')}
      onReview={() => setPhase('intro')}
    />
  )
}
