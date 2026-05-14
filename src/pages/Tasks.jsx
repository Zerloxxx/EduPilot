import React, { useState } from 'react'

const TASK = {
  id: 1,
  number: '№ 14',
  topic: 'Тригонометрия',
  text: 'Найдите значение выражения: sin²(30°) + cos²(60°) + tg(45°)',
  options: ['1,5', '2', '2,5', '3'],
  correct: 0,
  explanation: {
    short: 'Ты перепутал значение tg(45°). Оно равно 1, а не 2.',
    steps: [
      'sin(30°) = 0,5 → sin²(30°) = 0,25',
      'cos(60°) = 0,5 → cos²(60°) = 0,25',
      'tg(45°) = 1',
      '0,25 + 0,25 + 1 = 1,5',
    ],
    tip: 'Запомни таблицу значений тригонометрических функций для углов 0°, 30°, 45°, 60°, 90°.',
  },
}

export default function Tasks() {
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [showChat, setShowChat] = useState(false)

  const isCorrect = selected === TASK.correct
  const canSubmit = selected !== null && !submitted

  const handleSubmit = () => {
    if (canSubmit) setSubmitted(true)
  }

  const handleNext = () => {
    setSelected(null)
    setSubmitted(false)
    setShowChat(false)
  }

  return (
    <div className="page-enter" style={{ padding: '0 18px 20px' }}>
      {/* Header */}
      <div style={{ paddingTop: '16px', paddingBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>ЕГЭ · Математика</p>
          <h1 style={{ fontSize: '22px', fontWeight: '800' }}>Задания</h1>
        </div>
        <div style={{
          padding: '6px 14px', borderRadius: '20px',
          background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(168,85,247,0.25)',
        }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#a855f7' }}>
            3 / 10
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', marginBottom: '24px' }}>
        <div style={{
          height: '100%', width: '30%', borderRadius: '4px',
          background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
          boxShadow: '0 0 10px rgba(168,85,247,0.4)',
        }} />
      </div>

      {/* Task card */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <span style={{
            fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '8px',
            background: 'rgba(168,85,247,0.15)', color: '#a855f7',
          }}>{TASK.number}</span>
          <span style={{
            fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted)',
          }}>{TASK.topic}</span>
        </div>
        <p style={{ fontSize: '16px', lineHeight: '1.6', fontWeight: '500' }}>
          {TASK.text}
        </p>
      </div>

      {/* Answer options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {TASK.options.map((opt, i) => {
          let bg = 'rgba(255,255,255,0.03)'
          let border = '1px solid rgba(255,255,255,0.07)'
          let color = '#f0f0ff'
          if (submitted) {
            if (i === TASK.correct) {
              bg = 'rgba(16,185,129,0.12)'; border = '1px solid rgba(16,185,129,0.4)'; color = '#10b981'
            } else if (i === selected && !isCorrect) {
              bg = 'rgba(239,68,68,0.1)'; border = '1px solid rgba(239,68,68,0.35)'; color = '#ef4444'
            }
          } else if (selected === i) {
            bg = 'rgba(124,58,237,0.15)'; border = '1.5px solid rgba(168,85,247,0.5)'; color = '#a855f7'
          }

          return (
            <button
              key={i}
              onClick={() => !submitted && setSelected(i)}
              style={{
                padding: '16px 18px', borderRadius: '16px', cursor: submitted ? 'default' : 'pointer',
                background: bg, border, color,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: '15px', fontWeight: '500', transition: 'all 0.2s', textAlign: 'left',
              }}
            >
              <span>{opt}</span>
              {submitted && i === TASK.correct && <span style={{ fontSize: '16px' }}>✓</span>}
              {submitted && i === selected && !isCorrect && <span style={{ fontSize: '16px' }}>✗</span>}
            </button>
          )
        })}
      </div>

      {/* Submit / Next */}
      {!submitted ? (
        <button className="btn-primary" onClick={handleSubmit} style={{ opacity: canSubmit ? 1 : 0.4 }}>
          Проверить ответ
        </button>
      ) : (
        <>
          {/* AI Explanation */}
          <div style={{
            padding: '18px', borderRadius: '18px', marginBottom: '14px',
            background: isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(124,58,237,0.12)',
            border: isCorrect ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(168,85,247,0.2)',
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>{isCorrect ? '🎉' : '🧠'}</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: isCorrect ? '#10b981' : '#a855f7', marginBottom: '4px' }}>
                  {isCorrect ? 'Верно! Отличная работа' : 'AI-разбор ошибки'}
                </p>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                  {TASK.explanation.short}
                </p>
              </div>
            </div>

            {/* Steps */}
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                Ход решения:
              </p>
              {TASK.explanation.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: i < TASK.explanation.steps.length - 1 ? '6px' : 0 }}>
                  <span style={{ fontSize: '12px', color: '#a855f7', fontWeight: '700', minWidth: '16px' }}>{i + 1}.</span>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{step}</span>
                </div>
              ))}
            </div>

            {/* Tip */}
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '14px' }}>💡</span>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                {TASK.explanation.tip}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowChat(true)}
            className="btn-ghost"
            style={{ marginBottom: '10px' }}
          >
            💬 Объясни подробнее
          </button>
          <button className="btn-primary" onClick={handleNext}>
            Следующее задание →
          </button>
        </>
      )}
    </div>
  )
}
