import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { SUBJECTS, EXAMS } from '../data/curriculum'

// Типовые даты ЕГЭ/ОГЭ 2026 по предметам
const DATE_PRESETS = {
  ege: {
    russian: [{ label: '27 мая', value: '2026-05-27' }, { label: '3 июня', value: '2026-06-03' }],
    math:    [{ label: '5 июня', value: '2026-06-05' }, { label: '9 июня', value: '2026-06-09' }],
    cs:      [{ label: '10 июня', value: '2026-06-10' }, { label: '16 июня', value: '2026-06-16' }],
  },
  oge: {
    russian: [{ label: '29 мая', value: '2026-05-29' }, { label: '4 июня', value: '2026-06-04' }],
    math:    [{ label: '28 мая', value: '2026-05-28' }, { label: '3 июня', value: '2026-06-03' }],
    cs:      [{ label: '3 июня', value: '2026-06-03' }, { label: '9 июня', value: '2026-06-09' }],
  },
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { init } = useProgress()
  const [step, setStep] = useState(0)
  const [selectedExam, setSelectedExam] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [customDate, setCustomDate] = useState('')

  const getExamDate = () => showCustomDate ? (customDate || null) : selectedDate

  const handleContinue = () => {
    if (step === 0 && selectedExam) { setStep(1) }
    else if (step === 1 && selectedSubject) { setStep(2) }
    else if (step === 2) { setStep(3) }
    else if (step === 3) {
      init(selectedExam, selectedSubject, getExamDate())
      navigate('/diagnostic')
    }
  }

  const canProceed =
    (step === 0 && selectedExam) ||
    (step === 1 && selectedSubject) ||
    step === 2 ||
    step === 3

  return (
    <div className="page-enter" style={{
      minHeight: '100%', padding: '0 20px',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Logo */}
      <div style={{ paddingTop: '16px', paddingBottom: '20px', textAlign: 'center' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '18px', margin: '0 auto 14px',
          background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 28px rgba(124,58,237,0.4)', fontSize: '24px',
        }}>🚀</div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>
          <span className="gradient-text">EduPilot</span>
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          Персональный AI-репетитор
        </p>
      </div>

      {/* Step dots */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '28px' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            height: '3px', borderRadius: '3px',
            width: i === step ? '22px' : '7px',
            background: i <= step
              ? 'linear-gradient(90deg,#7c3aed,#a855f7)'
              : 'var(--border-2)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* ── Step 0: Exam ── */}
      {step === 0 && (
        <div className="page-enter" style={{ flex: 1 }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>
            Какой экзамен сдаёшь?
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
            Подберём подходящие задания
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            {EXAMS.map(exam => (
              <button key={exam.id} onClick={() => setSelectedExam(exam.id)}
                style={{
                  flex: 1, padding: '20px 14px', borderRadius: '18px', cursor: 'pointer',
                  border: selectedExam === exam.id
                    ? '1.5px solid rgba(168,85,247,0.6)'
                    : '1px solid var(--border)',
                  background: selectedExam === exam.id
                    ? 'rgba(124,58,237,0.15)' : 'var(--bg-card)',
                  transition: 'all 0.2s', textAlign: 'center',
                  boxShadow: selectedExam === exam.id ? '0 0 20px rgba(124,58,237,0.2)' : 'none',
                }}>
                <div style={{ fontSize: '26px', fontWeight: '800', color: selectedExam === exam.id ? '#a855f7' : 'var(--text-1)', marginBottom: '4px' }}>
                  {exam.label}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{exam.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 1: Subject ── */}
      {step === 1 && (
        <div className="page-enter" style={{ flex: 1 }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>
            Выбери предмет
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
            Начнём с этого предмета
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {SUBJECTS.filter(s => s.exams.includes(selectedExam)).map(s => (
              <button key={s.id} onClick={() => setSelectedSubject(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '16px 18px', borderRadius: '18px', cursor: 'pointer',
                  border: selectedSubject === s.id
                    ? '1.5px solid rgba(168,85,247,0.6)'
                    : '1px solid var(--border)',
                  background: selectedSubject === s.id
                    ? 'rgba(124,58,237,0.15)' : 'var(--bg-card)',
                  transition: 'all 0.2s', textAlign: 'left',
                  boxShadow: selectedSubject === s.id ? '0 0 20px rgba(124,58,237,0.2)' : 'none',
                }}>
                <span style={{ fontSize: '26px' }}>{s.emoji}</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: selectedSubject === s.id ? '#a855f7' : 'var(--text-1)' }}>
                  {s.label}
                </span>
                {selectedSubject === s.id && (
                  <span style={{ marginLeft: 'auto', color: '#a855f7', fontSize: '18px' }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2: Exam date ── */}
      {step === 2 && (
        <div className="page-enter" style={{ flex: 1 }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>
            Когда твой {selectedExam === 'oge' ? 'ОГЭ' : 'ЕГЭ'}?
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
            Покажем обратный отсчёт и скорректируем план
          </p>

          {/* Preset dates */}
          {!showCustomDate && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              {(DATE_PRESETS[selectedExam]?.[selectedSubject] ?? []).map(({ label, value }) => (
                <button key={value} onClick={() => setSelectedDate(value)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 18px', borderRadius: '16px', cursor: 'pointer',
                    border: selectedDate === value
                      ? '1.5px solid rgba(168,85,247,0.6)'
                      : '1px solid var(--border)',
                    background: selectedDate === value
                      ? 'rgba(124,58,237,0.15)' : 'var(--bg-card)',
                    transition: 'all 0.2s',
                    boxShadow: selectedDate === value ? '0 0 20px rgba(124,58,237,0.2)' : 'none',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>📅</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: selectedDate === value ? '#a855f7' : 'var(--text-1)' }}>
                        {label} 2026
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {selectedExam === 'oge' ? 'Основная дата ОГЭ' : 'Основная дата ЕГЭ'}
                      </div>
                    </div>
                  </div>
                  {selectedDate === value && <span style={{ color: '#a855f7', fontSize: '18px' }}>✓</span>}
                </button>
              ))}

              <button onClick={() => { setShowCustomDate(true); setSelectedDate(null) }}
                style={{
                  padding: '14px 18px', borderRadius: '16px', cursor: 'pointer',
                  border: '1px solid var(--border)', background: 'var(--bg-card)',
                  fontSize: '14px', fontWeight: '600', color: 'var(--text-2)',
                  transition: 'all 0.2s', textAlign: 'left',
                }}>
                📆 Другая дата...
              </button>
            </div>
          )}

          {/* Custom date picker */}
          {showCustomDate && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ padding: '16px 18px', borderRadius: '16px', background: 'var(--bg-card)', border: '1.5px solid rgba(168,85,247,0.4)' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-2)', marginBottom: '10px' }}>
                  Введи дату экзамена:
                </div>
                <input
                  type="date"
                  value={customDate}
                  min="2026-01-01"
                  max="2026-12-31"
                  onChange={e => setCustomDate(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '12px',
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    color: 'var(--text-1)', fontSize: '15px', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <button onClick={() => { setShowCustomDate(false); setCustomDate('') }}
                style={{ marginTop: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-3)' }}>
                ← Вернуться к вариантам
              </button>
            </div>
          )}

          {/* Skip */}
          <button
            onClick={() => { setSelectedDate(null); setShowCustomDate(false); setCustomDate(''); setStep(3) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-3)', padding: '4px 0' }}>
            Пропустить →
          </button>
        </div>
      )}

      {/* ── Step 3: Ready ── */}
      {step === 3 && (
        <div className="page-enter" style={{ flex: 1, textAlign: 'center', paddingTop: '16px' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎯</div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '10px' }}>
            Всё готово!
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
            Открою карту обучения по {SUBJECTS.find(s => s.id === selectedSubject)?.label.toLowerCase()}. Каждый уровень сложнее предыдущего.
          </p>
          <div className="glass-card" style={{ padding: '16px', textAlign: 'left' }}>
            {[
              { icon: '🧠', text: 'AI объясняет каждую ошибку' },
              { icon: '📈', text: 'Прогресс сохраняется автоматически' },
              { icon: '🔥', text: 'Ежедневный streak поддерживает мотивацию' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '16px' }}>{icon}</span>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ paddingBottom: '28px', paddingTop: '20px' }}>
        <button className="btn-primary" onClick={handleContinue}
          style={{ opacity: canProceed ? 1 : 0.35 }} disabled={!canProceed}>
          {step === 0 ? 'Продолжить' : step === 1 ? 'Далее' : step === 2 ? (selectedDate || (showCustomDate && customDate) ? 'Продолжить' : 'Пропустить') : 'Начать обучение →'}
        </button>
      </div>
    </div>
  )
}
