import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { getSections, SUBJECTS, EXAMS, LEVEL_META } from '../data/curriculum'
import { useTheme } from '../contexts/ThemeContext'
import SubjectSwitcher from '../components/SubjectSwitcher'

const SUBJECT_ACCENT = { cs: '#10b981', math: '#7c3aed', russian: '#3b82f6' }

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

function plural(n, one, few, many) {
  if (n % 10 === 1 && n % 100 !== 11) return one
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return few
  return many
}
function hasDraftForLevel(sectionId, levelIndex) {
  try { return !!localStorage.getItem(`edupilot_level_draft_v1_${sectionId}_${levelIndex}`) } catch { return false }
}

// ─── Progress ring ────────────────────────────────────────────────────────────
function Ring({ pct, size = 56, stroke = 5, color = '#10b981' }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: pct === 100 ? '#10b981' : color, lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontSize: 8, color: 'var(--text-3)', marginTop: 2 }}>пройдено</span>
      </div>
    </div>
  )
}

// ─── Theme toggle ─────────────────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button onClick={toggle} className="tap-scale" style={{
      width: 36, height: 36, borderRadius: 12,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', fontSize: 16, flexShrink: 0,
    }}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}

// ─── First visit sheet (new subject) ─────────────────────────────────────────
function FirstVisitSheet({ exam, subject, subjectInfo, accent, setExamDate, onStartDiagnostic, onSkip }) {
  const [selectedDate, setSelectedDate] = useState(null)
  const [showCustom, setShowCustom] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const presets = DATE_PRESETS[exam]?.[subject] ?? []
  const examLabel = exam === 'oge' ? 'ОГЭ' : 'ЕГЭ'

  const getDate = () => showCustom ? (customDate || null) : selectedDate

  const handleStart = () => {
    const date = getDate()
    if (date) setExamDate(date)
    onStartDiagnostic()
  }

  const handleSkip = () => {
    const date = getDate()
    if (date) setExamDate(date)
    onSkip()
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={handleSkip} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
        backdropFilter: 'blur(4px)',
      }} />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
        background: 'var(--bg)', borderRadius: '24px 24px 0 0',
        border: '1px solid var(--border)', borderBottom: 'none',
        padding: '8px 20px 36px',
        animation: 'slideUp 0.3s cubic-bezier(0.34,1.2,0.64,1)',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-2)', margin: '12px auto 20px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: `${accent}20`, border: `1px solid ${accent}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>{subjectInfo?.emoji}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>
              {subjectInfo?.label} — первый раз!
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              Укажи дату {examLabel}, чтобы видеть обратный отсчёт
            </div>
          </div>
        </div>

        {/* Date presets */}
        {!showCustom && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {presets.map(({ label, value }) => (
              <button key={value} onClick={() => setSelectedDate(value)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                border: selectedDate === value ? '1.5px solid rgba(168,85,247,0.6)' : '1px solid var(--border)',
                background: selectedDate === value ? 'rgba(124,58,237,0.12)' : 'var(--bg-card)',
                transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>📅</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: selectedDate === value ? '#a855f7' : 'var(--text-1)' }}>
                    {label} 2026
                  </span>
                </div>
                {selectedDate === value && <span style={{ color: '#a855f7' }}>✓</span>}
              </button>
            ))}
            <button onClick={() => { setShowCustom(true); setSelectedDate(null) }} style={{
              padding: '12px 16px', borderRadius: 14, cursor: 'pointer',
              border: '1px solid var(--border)', background: 'var(--bg-card)',
              fontSize: 13, fontWeight: 600, color: 'var(--text-2)', textAlign: 'left',
            }}>
              📆 Другая дата...
            </button>
          </div>
        )}

        {/* Custom date */}
        {showCustom && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--bg-card)', border: '1.5px solid rgba(168,85,247,0.35)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>Дата экзамена:</div>
              <input type="date" value={customDate} min="2026-01-01" max="2026-12-31"
                onChange={e => setCustomDate(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text-1)', fontSize: 15, outline: 'none', boxSizing: 'border-box',
                }} />
            </div>
            <button onClick={() => { setShowCustom(false); setCustomDate('') }}
              style={{ marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-3)' }}>
              ← Назад
            </button>
          </div>
        )}

        {/* Actions */}
        <button onClick={handleStart} className="btn-primary" style={{ marginBottom: 10 }}>
          🎯 Начать диагностику
        </button>
        <button onClick={handleSkip} style={{
          width: '100%', padding: '12px', background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 13, color: 'var(--text-3)', fontWeight: 600,
        }}>
          Пропустить
        </button>
      </div>
    </>
  )
}

// ─── Exam countdown ───────────────────────────────────────────────────────────
function ExamCountdown({ daysLeft, exam }) {
  if (daysLeft === null) return null
  const examLabel = exam === 'oge' ? 'ОГЭ' : 'ЕГЭ'

  let color, bg, border, hint
  if (daysLeft <= 14) {
    color = '#ef4444'; bg = 'rgba(239,68,68,0.1)'; border = 'rgba(239,68,68,0.25)'
    hint = 'Финальный рывок! Повтори слабые темы'
  } else if (daysLeft <= 30) {
    color = '#f97316'; bg = 'rgba(249,115,22,0.1)'; border = 'rgba(249,115,22,0.25)'
    hint = 'Горячая пора — интенсивная подготовка'
  } else if (daysLeft <= 60) {
    color = '#f59e0b'; bg = 'rgba(245,158,11,0.1)'; border = 'rgba(245,158,11,0.25)'
    hint = 'Осталось немного, держи темп'
  } else {
    color = '#3b82f6'; bg = 'rgba(59,130,246,0.08)'; border = 'rgba(59,130,246,0.2)'
    hint = 'Времени достаточно, занимайся системно'
  }

  const dayWord = daysLeft % 10 === 1 && daysLeft % 100 !== 11 ? 'день'
    : [2,3,4].includes(daysLeft % 10) && ![12,13,14].includes(daysLeft % 100) ? 'дня'
    : 'дней'

  return (
    <div style={{ padding: '0 18px 10px', flexShrink: 0 }}>
      <div style={{
        borderRadius: 18, padding: '13px 16px', background: bg,
        border: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: 'var(--card-shadow)',
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 13, flexShrink: 0,
          background: `${color}20`, border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>📅</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>
            До {examLabel}:{' '}
            <span style={{ color }}>{daysLeft} {dayWord}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{daysLeft}</div>
          <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 1 }}>{dayWord}</div>
        </div>
      </div>
    </div>
  )
}

// ─── Level card ───────────────────────────────────────────────────────────────
function LevelCard({ meta, status, accent, hasDraft, onPress }) {
  const done  = status === 'completed'
  const avail = status === 'available'
  const locked = status === 'locked'

  return (
    <div>
      {meta.index > 0 && (
        <div style={{ width: 2, height: 8, marginLeft: 21, borderLeft: `2px dashed ${done ? `${accent}66` : 'var(--border)'}` }} />
      )}
      <div className={locked ? '' : 'tap-scale'} onClick={() => !locked && onPress()} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', borderRadius: 14,
        background: avail ? `${accent}12` : done ? `${accent}0a` : 'var(--bg-card)',
        border: avail ? `1.5px solid ${accent}55` : done ? `1px solid ${accent}22` : '1px solid var(--border)',
        cursor: locked ? 'default' : 'pointer',
        boxShadow: avail ? `0 4px 16px ${accent}22` : 'var(--card-shadow)',
        transition: 'all 0.15s',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: meta.type === 'exam' ? '50%' : 11, flexShrink: 0,
          background: done ? `${accent}30` : avail ? `${accent}20` : 'var(--bg-card-2)',
          border: `1px solid ${done ? `${accent}55` : avail ? `${accent}44` : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {done
            ? <span style={{ color: accent, fontSize: 16, fontWeight: 900 }}>✓</span>
            : locked
              ? <svg width="13" height="15" viewBox="0 0 13 15" fill="none"><rect x="1" y="6.5" width="11" height="7.5" rx="2" stroke="var(--lock-icon)" strokeWidth="1.4"/><path d="M3 6.5V4.5a3.5 3.5 0 017 0V6.5" stroke="var(--lock-icon)" strokeWidth="1.4" strokeLinecap="round"/></svg>
              : meta.index === 0
                ? <span style={{ fontSize: 17 }}>📖</span>
                : meta.index === 5
                  ? <span style={{ fontSize: 17 }}>🏆</span>
                  : <span style={{ fontSize: 13, fontWeight: 800, color: avail ? accent : 'var(--text-3)' }}>{meta.index}</span>
          }
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: locked ? 'var(--text-3)' : 'var(--text-1)', marginBottom: 2 }}>
            {meta.index === 0 ? 'Теория' : meta.index === 5 ? 'Финал' : `Уровень ${meta.index}`}
          </div>
          <div style={{ fontSize: 11, color: avail ? accent : 'var(--text-3)' }}>
            {meta.index === 0 ? 'Изучи материал и формулы' : meta.label}
          </div>
        </div>
        {avail && (
          <button onClick={e => { e.stopPropagation(); onPress() }} style={{
            padding: '7px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
            boxShadow: `0 3px 10px ${accent}44`,
          }}>
            {hasDraft ? '▶ Продолжить' : 'Начать'}
          </button>
        )}
        {done && (
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: accent, fontSize: 13 }}>✓</span>
          </div>
        )}
        {locked && (
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--bg-card-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="13" height="15" viewBox="0 0 13 15" fill="none"><rect x="1" y="6.5" width="11" height="7.5" rx="2" stroke="var(--lock-icon)" strokeWidth="1.4"/><path d="M3 6.5V4.5a3.5 3.5 0 017 0V6.5" stroke="var(--lock-icon)" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomeCS() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { progress, getLevelStatus, getSectionProgress, switchSubject, diagnosticData, energyData, dueReviews, ogeData, daysLeft, examDate, setExamDate } = useProgress()
  const [activeSectionIdx, setActiveSectionIdx] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [showSwitcher, setShowSwitcher] = useState(false)
  // показываем шторку первого визита: дата не задана и диагностика ещё не пройдена
  const [showFirstVisit, setShowFirstVisit] = useState(false)
  const tabsRef = useRef(null)
  const carouselRef = useRef(null)
  const sectionsCountRef = useRef(1)
  const draggingRef = useRef(false)

  // Scroll active tab into view
  useEffect(() => {
    const container = tabsRef.current
    if (!container) return
    const btn = container.children[activeSectionIdx]
    if (!btn) return
    const left = btn.offsetLeft - container.offsetWidth / 2 + btn.offsetWidth / 2
    container.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
  }, [activeSectionIdx])

  // Touch swipe on carousel
  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    let start = null
    const onStart = (e) => {
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY, decided: false, horiz: false }
      draggingRef.current = false
    }
    const onMove = (e) => {
      if (!start) return
      const dx = e.touches[0].clientX - start.x
      const dy = e.touches[0].clientY - start.y
      if (!start.decided) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
        start.decided = true
        start.horiz = Math.abs(dx) > Math.abs(dy)
      }
      if (!start.horiz) return
      e.preventDefault()
      draggingRef.current = true
      setDragOffset(dx)
    }
    const onEnd = (e) => {
      if (!start) return
      const dx = e.changedTouches[0].clientX - start.x
      start = null
      setDragOffset(0)
      if (!draggingRef.current) return
      draggingRef.current = false
      const count = sectionsCountRef.current
      if (dx < -30) setActiveSectionIdx(i => Math.min(i + 1, count - 1))
      else if (dx > 30) setActiveSectionIdx(i => Math.max(i - 1, 0))
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove',  onMove,  { passive: false })
    el.addEventListener('touchend',   onEnd,   { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove',  onMove)
      el.removeEventListener('touchend',   onEnd)
    }
  }, [])

  useEffect(() => {
    if (!progress) navigate('/onboarding', { replace: true })
  }, [progress, navigate])

  // Открываем шторку при первом визите на предмет (нет даты + нет диагностики)
  useEffect(() => {
    if (progress && !diagnosticData.done && !examDate) {
      setShowFirstVisit(true)
    } else {
      setShowFirstVisit(false)
    }
  }, [progress?.subject]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!progress) return null

  const subject   = progress.subject
  const accent    = SUBJECT_ACCENT[subject] ?? '#10b981'
  const sections  = getSections(subject, progress.exam)
  sectionsCountRef.current = sections.length
  const activeSection = sections[activeSectionIdx]
  const subjectInfo = SUBJECTS.find(s => s.id === subject)
  const examInfo    = EXAMS.find(e => e.id === progress.exam)
  const sc = activeSection.color ?? accent

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text-1)', position: 'relative' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 18px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 14, flexShrink: 0,
              background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, boxShadow: `0 4px 14px ${accent}44`,
            }}>
              {subjectInfo?.emoji}
            </div>
            <button onClick={() => setShowSwitcher(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)' }}>{subjectInfo?.label}</span>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.4, marginTop: 1 }}>
                  <path d="M4 6l4 4 4-4" stroke="var(--text-1)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Карта обучения</div>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <ThemeToggle />
            <button style={{
              width: 36, height: 36, borderRadius: 12,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', flexShrink: 0,
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="var(--text-2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: accent, border: `1.5px solid var(--bg)` }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 18px 12px', flexShrink: 0 }}>
        <div style={{ borderRadius: 18, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
          {[
            { icon: '🔥', value: progress.streak,       label: 'день в ударе', color: '#f97316' },
            { icon: '💎', value: progress.totalXp,       label: 'XP',           color: accent },
            { icon: '⚡', value: energyData.energy,      label: 'энергия',      color: energyData.isEmpty ? '#ef4444' : '#a855f7' },
          ].map((item, i) => (
            <div key={i} style={{ flex: 1, padding: '13px 8px', textAlign: 'center', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: 18, marginBottom: 3 }}>{item.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Exam countdown ─────────────────────────────────────────────── */}
      <ExamCountdown daysLeft={daysLeft} exam={progress.exam} />

      {/* ── OGE grade card ─────────────────────────────────────────────── */}
      {ogeData && (
        <div style={{ padding: '0 18px 10px', flexShrink: 0 }}>
          <div style={{ borderRadius: 18, padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: `${accent}20`, border: `1px solid ${accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎯</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Прогноз оценки</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{ogeData.earnedPoints} / {ogeData.maxPoints} баллов</div>
                </div>
              </div>
              <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: `${accent}18`, border: `2px solid ${accent}55`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: accent, lineHeight: 1 }}>{ogeData.grade}</div>
                <div style={{ fontSize: 8, color: 'var(--text-3)', marginTop: 1 }}>уровень</div>
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-card-2)', overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${accent}, ${accent}aa)`, width: `${Math.min(100, (ogeData.earnedPoints / ogeData.maxPoints) * 100)}%`, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right' }}>
              {ogeData.nextGrade
                ? <span style={{ color: accent }}>До {ogeData.nextGrade.grade} уровня: ещё {ogeData.nextGrade.need} балл(а)</span>
                : <span>🏆 Максимальный уровень!</span>}
            </div>
          </div>
        </div>
      )}

      {/* ── Review widget ──────────────────────────────────────────────── */}
      {dueReviews.length > 0 && (
        <div style={{ padding: '0 18px 10px', flexShrink: 0 }}>
          <div className="tap-scale" onClick={() => navigate('/review')} style={{
            borderRadius: 18, padding: '13px 16px',
            background: 'var(--bg-card)', border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', boxShadow: 'var(--card-shadow)',
          }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}>🔁</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>Повторить ошибки · {dueReviews.length} {plural(dueReviews.length,'задание','задания','заданий')}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Повторяя ошибки, сдают лучше на 15+ баллов</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="rgba(245,158,11,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      )}

      {/* ── Exam simulation entry ──────────────────────────────────────── */}
      {(() => {
        const examKey = `${progress.exam}_${subject}`
        return (
          <div style={{ padding: '0 18px 10px', flexShrink: 0 }}>
            <div className="tap-scale" onClick={() => navigate(`/exam-sim/${examKey}`)} style={{
              borderRadius: 18, padding: '13px 16px',
              background: `${accent}10`, border: `1px solid ${accent}33`,
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', boxShadow: 'var(--card-shadow)',
            }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: `0 4px 12px ${accent}44` }}>📝</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>Пробный экзамен · Часть 1</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Проверь себя в условиях реального экзамена</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        )
      })()}

      {/* ── Section tabs ───────────────────────────────────────────────── */}
      <div style={{ paddingBottom: 12, flexShrink: 0 }}>
        <div ref={tabsRef} style={{ display: 'flex', gap: 6, paddingLeft: 18, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
          {sections.map((section, idx) => {
            const active = idx === activeSectionIdx
            const pct = getSectionProgress(section.id)
            const done = pct === 100
            return (
              <button key={section.id} className="tap-scale" onClick={() => setActiveSectionIdx(idx)} style={{
                flexShrink: 0, width: 40, height: 40, borderRadius: 12,
                background: active ? accent : done ? `${accent}18` : 'var(--bg-card)',
                border: active ? `1.5px solid ${accent}` : done ? `1.5px solid ${accent}44` : '1.5px solid var(--border)',
                cursor: 'pointer', fontSize: 13, fontWeight: 700,
                color: active ? '#fff' : done ? accent : 'var(--text-3)',
                transition: 'all 0.15s',
                boxShadow: active ? `0 4px 12px ${accent}44` : 'none',
              }}>
                {done && !active ? '✓' : section.taskNumber}
              </button>
            )
          })}
          <div style={{ flexShrink: 0, width: 18 }} />
        </div>
      </div>

      {/* ── Carousel ───────────────────────────────────────────────────── */}
      <div ref={carouselRef} style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          display: 'flex', height: '100%',
          transform: `translateX(calc(-${activeSectionIdx * 100}% + ${dragOffset}px))`,
          transition: draggingRef.current ? 'none' : 'transform 0.28s cubic-bezier(0.25,1,0.5,1)',
          willChange: 'transform',
        }}>
          {sections.map((section, idx) => {
            const color = section.color ?? accent
            const pct   = getSectionProgress(section.id)
            const isActive = idx === activeSectionIdx
            const visible  = Math.abs(idx - activeSectionIdx) <= 1
            const num = String(section.taskNumber).padStart(2, '0')

            return (
              <div key={section.id} style={{ width: '100%', flexShrink: 0, overflowY: isActive ? 'auto' : 'hidden', padding: '0 18px 28px' }}>
                {visible && (<>
                  {/* Section header card */}
                  <div style={{
                    borderRadius: 20, padding: 16, marginBottom: 14,
                    background: 'var(--bg-card)', border: `1px solid var(--border)`,
                    boxShadow: 'var(--card-shadow)',
                  }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      {/* Number badge */}
                      <div style={{
                        width: 72, height: 72, borderRadius: 18, flexShrink: 0,
                        background: `${color}18`, border: `1.5px solid ${color}33`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'monospace', fontSize: 26, fontWeight: 900, color,
                        boxShadow: `0 4px 16px ${color}22`,
                      }}>
                        {num}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.06em', marginBottom: 4 }}>
                          Задание {section.taskNumber}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.2, marginBottom: 5 }}>
                          {section.label}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4 }}>
                          {section.description}
                        </div>
                      </div>
                      <Ring pct={pct} color={color} />
                    </div>
                  </div>

                  {/* Level cards */}
                  <div className="stagger">
                    {LEVEL_META.map((meta, i) => (
                      <LevelCard
                        key={i}
                        meta={meta}
                        status={getLevelStatus(section.id, i)}
                        accent={color}
                        hasDraft={hasDraftForLevel(section.id, i)}
                        onPress={() => navigate(`/level/${section.id}/${i}`)}
                      />
                    ))}
                  </div>

                  {/* Diagnostic + AI — only on active slide */}
                  {isActive && (<>
                    {!diagnosticData.done && (
                      <div style={{
                        marginTop: 16, borderRadius: 18, padding: '13px 16px',
                        background: 'var(--bg-card)', border: `1px solid ${accent}33`,
                        display: 'flex', alignItems: 'center', gap: 12,
                        boxShadow: 'var(--card-shadow)',
                      }}>
                        <div style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, background: `${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎯</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>Пройди диагностику</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Определим твой уровень — 10 вопросов</div>
                        </div>
                        <button onClick={() => navigate('/diagnostic')} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, color: '#fff', fontSize: 12, fontWeight: 700, boxShadow: `0 3px 10px ${accent}44` }}>Начать</button>
                      </div>
                    )}
                    <div style={{
                      marginTop: 14, borderRadius: 18, padding: '15px 16px',
                      background: 'var(--bg-card)', border: '1px solid rgba(124,58,237,0.2)',
                      display: 'flex', alignItems: 'center', gap: 14,
                      boxShadow: 'var(--card-shadow)',
                    }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>🤖</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>AI-помощник</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Задай вопрос о теме или попроси объяснить задание</div>
                      </div>
                      <button onClick={() => navigate('/chat')} style={{ flexShrink: 0, padding: '9px 16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6366f1)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.35)', whiteSpace: 'nowrap' }}>💬 Чат</button>
                    </div>
                  </>)}
                </>)}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Subject Switcher ───────────────────────────────────────────── */}
      {showSwitcher && (
        <SubjectSwitcher
          exam={progress.exam}
          currentSubject={progress.subject}
          onSelect={(s) => { if (s !== progress.subject) { switchSubject(s); setActiveSectionIdx(0) } setShowSwitcher(false) }}
          onClose={() => setShowSwitcher(false)}
        />
      )}

      {/* ── First visit sheet ──────────────────────────────────────────── */}
      {showFirstVisit && (
        <FirstVisitSheet
          exam={progress.exam}
          subject={subject}
          subjectInfo={subjectInfo}
          accent={accent}
          setExamDate={setExamDate}
          onStartDiagnostic={() => { setShowFirstVisit(false); navigate('/diagnostic') }}
          onSkip={() => setShowFirstVisit(false)}
        />
      )}
    </div>
  )
}
