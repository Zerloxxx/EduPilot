import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'

const letters = ['А', 'Б', 'В', 'Г']

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r},${g},${b}`
}

const ACCENT = '#f59e0b'

export default function ReviewScreen() {
  const navigate = useNavigate()
  const { dueReviews, completeReview, progress } = useProgress()

  const [queue, setQueue] = useState(() => [...dueReviews])
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [doneCount, setDoneCount] = useState(0)

  if (!progress) { navigate('/onboarding'); return null }

  // All done
  if (queue.length === 0 || idx >= queue.length) {
    return (
      <div style={{
        minHeight: '100%', background: '#0d0f14', color: '#f0f0ff',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '32px 24px', textAlign: 'center',
      }}>
        <div style={{
          width: '88px', height: '88px', borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.28), rgba(245,158,11,0.08))',
          border: '1.5px solid rgba(245,158,11,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '40px', marginBottom: '24px',
          boxShadow: '0 8px 28px rgba(245,158,11,0.2)',
        }}>🎯</div>
        <div style={{ fontSize: '24px', fontWeight: '900', marginBottom: '10px' }}>
          Повторение пройдено!
        </div>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.6, marginBottom: '32px', maxWidth: '280px' }}>
          Ты разобрал {doneCount} {plural(doneCount, 'задание', 'задания', 'заданий')}. Следующее повторение — завтра.
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate('/home')}
          style={{ maxWidth: '280px', width: '100%' }}
        >
          На главную
        </button>
      </div>
    )
  }

  const entry = queue[idx]
  const task = entry.taskData
  const visibleOptions = task.options
  const correctIdx = task.correct
  const isCorrect = selected === correctIdx
  const submittedWrong = submitted && !isCorrect

  const submit = () => {
    if (selected === null) return
    setSubmitted(true)
  }

  const advance = () => {
    const correct = selected === correctIdx
    completeReview(entry.taskId, correct)
    setDoneCount(c => c + 1)

    if (!correct) {
      // push to end of queue for this session so they see it again
      setQueue(q => [...q, entry])
    }

    setIdx(i => i + 1)
    setSelected(null)
    setSubmitted(false)
  }

  const total = queue.length
  const progress_ = idx / total

  return (
    <div style={{ minHeight: '100%', background: '#0d0f14', color: '#f0f0ff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '12px 18px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/home')}
            style={{
              width: '36px', height: '36px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '18px',
            }}
          >←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: ACCENT, letterSpacing: '0.06em', marginBottom: '2px' }}>
              🔁 ПОВТОРЕНИЕ ОШИБОК
            </div>
            <div style={{ fontSize: '18px', fontWeight: '900' }}>
              {entry.sectionLabel}
            </div>
          </div>
          <div style={{
            padding: '6px 12px', borderRadius: '10px',
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
            fontSize: '13px', fontWeight: '800', color: ACCENT,
          }}>
            {idx + 1}/{total}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.07)',
          marginTop: '12px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: '4px',
            background: `linear-gradient(90deg, ${ACCENT}, #fbbf24)`,
            width: `${progress_ * 100}%`,
            transition: 'width 0.4s ease',
            boxShadow: `0 0 8px rgba(245,158,11,0.5)`,
          }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 24px' }}>
        {/* Task label */}
        <div style={{
          display: 'inline-flex', padding: '4px 10px', borderRadius: '9px',
          background: 'rgba(245,158,11,0.12)', color: ACCENT,
          fontSize: '11px', fontWeight: '800', marginBottom: '10px',
        }}>
          ЕГЭ №{entry.taskNumber}
        </div>

        {/* Task text */}
        <div style={{
          borderRadius: '20px', padding: '18px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '12px',
        }}>
          <div style={{ fontSize: '15px', lineHeight: 1.65, color: '#f0f0ff', fontWeight: '600' }}>
            {task.text}
          </div>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '14px' }}>
          {visibleOptions.map((option, i) => {
            const active = selected === i
            const wrong = submittedWrong && active
            const showCorrect = submitted && i === correctIdx
            return (
              <button
                key={`${task.id}-${i}`}
                className={submitted ? '' : 'tap-scale'}
                onClick={() => !submitted && setSelected(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '13px 14px', borderRadius: '15px',
                  background: showCorrect
                    ? 'rgba(16,185,129,0.1)'
                    : wrong
                      ? 'rgba(239,68,68,0.08)'
                      : active
                        ? `rgba(${hexToRgb(ACCENT)},0.1)`
                        : 'rgba(255,255,255,0.035)',
                  border: showCorrect
                    ? '1.5px solid rgba(16,185,129,0.4)'
                    : wrong
                      ? '1.5px solid rgba(239,68,68,0.35)'
                      : active
                        ? `1.5px solid rgba(${hexToRgb(ACCENT)},0.55)`
                        : '1px solid rgba(255,255,255,0.08)',
                  color: showCorrect ? '#10b981' : wrong ? '#f87171' : active ? ACCENT : 'rgba(255,255,255,0.72)',
                  textAlign: 'left', cursor: submitted ? 'default' : 'pointer',
                  fontSize: '14px', fontWeight: '650',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{
                  width: '28px', height: '28px', borderRadius: '9px',
                  background: showCorrect
                    ? 'rgba(16,185,129,0.16)'
                    : wrong
                      ? 'rgba(239,68,68,0.14)'
                      : active
                        ? `rgba(${hexToRgb(ACCENT)},0.18)`
                        : 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '900', flexShrink: 0,
                }}>
                  {showCorrect && submitted ? '✓' : letters[i]}
                </span>
                <span>{option}</span>
              </button>
            )
          })}
        </div>

        {/* Feedback */}
        {submitted && isCorrect && (
          <div style={{
            padding: '13px 15px', borderRadius: '16px',
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)',
            color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: 1.5, marginBottom: '12px',
          }}>
            <strong style={{ color: '#10b981' }}>Верно.</strong> {task.explanation?.tip}
          </div>
        )}

        {submittedWrong && (
          <div style={{
            borderRadius: '18px', border: '1px solid rgba(245,158,11,0.28)',
            background: 'rgba(255,255,255,0.035)', overflow: 'hidden', marginBottom: '12px',
          }}>
            <div style={{ padding: '12px 14px', background: 'rgba(245,158,11,0.1)' }}>
              <div style={{ fontSize: '13px', fontWeight: '900', color: ACCENT }}>Разбор ошибки</div>
            </div>
            <div style={{ padding: '13px 14px' }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.64)', lineHeight: 1.55, marginBottom: '8px' }}>
                {task.explanation?.error}
              </div>
              {task.explanation?.steps?.slice(0, 2).map((step, i) => (
                <div key={step} style={{ display: 'flex', gap: '9px', marginBottom: '7px' }}>
                  <span style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: 'rgba(245,158,11,0.16)', color: ACCENT,
                    fontSize: '10px', fontWeight: '900',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{i + 1}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!submitted ? (
          <button
            className="btn-primary"
            onClick={submit}
            disabled={selected === null}
            style={{ opacity: selected === null ? 0.35 : 1 }}
          >
            Проверить
          </button>
        ) : (
          <button className="btn-primary" onClick={advance}>
            {idx + 1 >= queue.length ? 'Завершить повторение' : 'Следующее →'}
          </button>
        )}
      </div>
    </div>
  )
}

function plural(n, one, few, many) {
  if (n % 10 === 1 && n % 100 !== 11) return one
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return few
  return many
}
