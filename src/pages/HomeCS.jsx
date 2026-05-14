import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { getSections, SUBJECTS, EXAMS, LEVEL_META } from '../data/curriculum'
import SubjectSwitcher from '../components/SubjectSwitcher'

// ─── Circular progress ring ───────────────────────────────────────────────
function CircleRing({ pct, size = 60, stroke = 4, color = '#3b82f6' }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '13px', fontWeight: '800', color: pct === 100 ? '#10b981' : color, lineHeight: 1 }}>
          {pct}%
        </span>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>пройдено</span>
      </div>
    </div>
  )
}

// ─── Subject accent colors ─────────────────────────────────────────────────
const SUBJECT_ACCENT = {
  cs:      '#3b82f6',  // blue
  math:    '#7c3aed',  // purple
  russian: '#8b5cf6',  // violet
}

// ─── Background pattern text per subject ──────────────────────────────────
const SUBJECT_BG_TEXT = {
  cs:      '10110100101101001011010010110100101101001011010010110100101101001011010010110100101101001',
  math:    'a²+b²=c² f(x) π∑∫ dx √n lim→∞ sin cos tg a²+b²=c² f(x) π∑∫ dx √n lim→∞',
  russian: 'Аа Бб Вв Гг Дд Ее Жж Зз Ии Кк Лл Мм Нн Оо Пп Рр Сс Тт Уу Фф Хх Цц Чч Шш',
}

// ─── Section icon ──────────────────────────────────────────────────────────
function SectionIcon({ section, subject = 'cs', accentColor }) {
  const color = accentColor ?? section.color ?? SUBJECT_ACCENT[subject] ?? '#3b82f6'
  const num = String(section.taskNumber).padStart(2, '0')
  const bgText = SUBJECT_BG_TEXT[subject] ?? SUBJECT_BG_TEXT.cs
  return (
    <div style={{
      width: 80, height: 80, borderRadius: 18, flexShrink: 0,
      background: `linear-gradient(135deg, ${color}cc, ${color}55)`,
      border: `1px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      boxShadow: `0 6px 20px ${color}33`,
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.12,
        fontFamily: 'monospace', fontSize: '7px', color: '#fff',
        overflow: 'hidden', padding: '4px', lineHeight: '9px',
        wordBreak: 'break-all', letterSpacing: '1px', userSelect: 'none',
      }}>
        {bgText}
      </div>
      <span style={{
        fontSize: '26px', fontWeight: '900', color: '#fff',
        fontFamily: 'monospace', letterSpacing: '2px',
        zIndex: 1, textShadow: `0 2px 8px ${color}88`,
      }}>
        {num}
      </span>
    </div>
  )
}

// ─── Level card ───────────────────────────────────────────────────────────
function LevelCard({ meta, status, isLast, onPress, accent = '#3b82f6', hasDraft = false }) {
  const isCompleted = status === 'completed'
  const isAvailable = status === 'available'
  const isLocked = status === 'locked'
  const isTheory = meta.index === 0
  const isExam = meta.type === 'exam'

  // Icon style per state
  let iconBg = 'rgba(255,255,255,0.06)'
  let iconBorder = '1px solid rgba(255,255,255,0.08)'

  if (isCompleted) {
    iconBg = `${accent}40`
    iconBorder = `1px solid ${accent}66`
  } else if (isAvailable) {
    iconBg = `${accent}33`
    iconBorder = `1.5px solid ${accent}`
  }

  // Difficulty color
  const diffColor = {
    1: accent, 2: accent, 3: '#f59e0b', 4: '#ef4444', 5: '#a855f7',
  }[meta.index] ?? '#6b7280'

  return (
    <div>
      {/* Connector line above (not for first item) */}
      {meta.index > 0 && (
        <div style={{
          width: '2px', height: '10px', marginLeft: '22px',
          borderLeft: `2px dashed ${isCompleted ? `${accent}99` : 'rgba(255,255,255,0.1)'}`,
        }} />
      )}

      {/* Card */}
      <div
        className={isLocked ? '' : 'tap-scale'}
        style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '14px 16px', borderRadius: '16px',
          background: isAvailable
            ? `${accent}14`
            : isCompleted
              ? `${accent}0d`
              : 'rgba(255,255,255,0.03)',
          border: isAvailable
            ? `1.5px solid ${accent}66`
            : isCompleted
              ? `1px solid ${accent}28`
              : '1px solid rgba(255,255,255,0.06)',
          cursor: isLocked ? 'default' : 'pointer',
          transition: 'all 0.18s ease, box-shadow 0.3s ease',
          boxShadow: isAvailable ? `0 4px 20px ${accent}33` : 'none',
        }}
        onClick={() => !isLocked && onPress()}
      >
        {/* Icon */}
        <div style={{
          width: '44px', height: '44px',
          borderRadius: isExam ? '50%' : '12px',
          background: iconBg, border: iconBorder,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {isCompleted ? (
            <span style={{ fontSize: '18px', color: accent }}>✓</span>
          ) : isTheory ? (
            <span style={{ fontSize: '20px', opacity: isLocked ? 0.3 : 1 }}>📚</span>
          ) : isExam ? (
            <span style={{ fontSize: '20px', opacity: isLocked ? 0.3 : 1 }}>⭐</span>
          ) : (
            <span style={{
              fontSize: '16px', fontWeight: '800',
              color: isLocked ? 'rgba(255,255,255,0.25)' : '#fff',
            }}>{meta.index}</span>
          )}
        </div>

        {/* Text */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '14px', fontWeight: '600',
            color: isLocked ? 'rgba(255,255,255,0.35)' : '#f0f0ff',
            marginBottom: '2px',
          }}>
            {isTheory ? 'Теория' : isExam ? 'Финал' : `Уровень ${meta.index}`}
          </div>
          <div style={{
            fontSize: '12px',
            color: isAvailable
              ? diffColor
              : isCompleted
                ? `${accent}bb`
                : 'rgba(255,255,255,0.25)',
          }}>
            {isTheory ? 'Изучи материал и формулы' : meta.label}
          </div>
        </div>

        {/* Right side */}
        {isCompleted && (
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: `${accent}28`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '14px', color: accent }}>✓</span>
          </div>
        )}
        {isAvailable && (
          <button style={{
            padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            color: '#fff', fontSize: '13px', fontWeight: '700',
            boxShadow: `0 4px 12px ${accent}66`,
            flexShrink: 0, whiteSpace: 'nowrap',
          }}
            onClick={e => { e.stopPropagation(); onPress() }}
          >
            {hasDraft ? '▶ Продолжить' : 'Начать'}
          </button>
        )}
        {isLocked && (
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
              <rect x="1" y="7" width="12" height="8" rx="2" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
              <path d="M4 7V5a3 3 0 016 0v2" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}


function hasDraftForLevel(sectionId, levelIndex) {
  try { return !!localStorage.getItem(`edupilot_level_draft_v1_${sectionId}_${levelIndex}`) }
  catch { return false }
}

function plural(n, one, few, many) {
  if (n % 10 === 1 && n % 100 !== 11) return one
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return few
  return many
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function HomeCS() {
  const navigate = useNavigate()
  const { progress, getLevelStatus, getSectionProgress, getTotalProgress, switchSubject, diagnosticData, energyData, dueReviews } = useProgress()
  const [activeSectionIdx, setActiveSectionIdx] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const tabsRef = useRef(null)
  const carouselRef = useRef(null)
  const sectionsCountRef = useRef(1)
  const draggingRef = useRef(false)

  // Scroll tabs to keep active tab centred (within tabs row only)
  useEffect(() => {
    const container = tabsRef.current
    if (!container) return
    const btn = container.children[activeSectionIdx]
    if (!btn) return
    const left = btn.offsetLeft - container.offsetWidth / 2 + btn.offsetWidth / 2
    container.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
  }, [activeSectionIdx])

  // Carousel drag — non-passive so we can preventDefault on horizontal moves
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

  if (!progress) {
    navigate('/onboarding')
    return null
  }

  const subject = progress.subject
  const accent = SUBJECT_ACCENT[subject] ?? '#3b82f6'
  const sections = getSections(subject)
  sectionsCountRef.current = sections.length
  const activeSection = sections[activeSectionIdx]
  const subjectInfo = SUBJECTS.find(s => s.id === subject)
  const examInfo = EXAMS.find(e => e.id === progress.exam)
  const pct = getSectionProgress(activeSection.id)
  const sectionColor = activeSection.color ?? accent

  const handleSwitchSubject = (newSubject) => {
    if (newSubject !== progress.subject) {
      switchSubject(newSubject)
      setActiveSectionIdx(0)
    }
    setShowSwitcher(false)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#0d0f14', color: '#f0f0ff',
      position: 'relative',
    }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 18px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Subject name — tappable */}
          <button
            onClick={() => setShowSwitcher(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#f0f0ff', lineHeight: 1.1 }}>
                {subjectInfo?.emoji} {subjectInfo?.label}
              </h1>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: '2px', opacity: 0.5 }}>
                <path d="M4 6l4 4 4-4" stroke="#f0f0ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
              Карта обучения
            </div>
          </button>

          {/* Bell */}
          <button style={{
            width: '36px', height: '36px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{
              position: 'absolute', top: '6px', right: '6px',
              width: '7px', height: '7px', borderRadius: '50%',
              background: accent, border: '1.5px solid #0d0f14',
            }} />
          </button>
        </div>
      </div>

      {/* ── Stats card ──────────────────────────────────────────────────── */}
      <div style={{ padding: '0 18px 12px', flexShrink: 0 }}>
        <div style={{
          borderRadius: '18px', padding: '0',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', overflow: 'hidden',
        }}>
          {[
            { icon: '🔥', value: progress.streak, label: 'дней в ударе', color: '#f97316' },
            { icon: '💠', value: progress.totalXp, label: 'XP', color: accent },
            { icon: '⚡', value: energyData.energy, label: 'энергия', color: energyData.isEmpty ? '#ef4444' : '#a855f7' },
          ].map((item, i) => (
            <div key={i} style={{
              flex: 1, padding: '14px 10px', textAlign: 'center',
              borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: item.color, lineHeight: 1 }}>
                {item.value}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '3px' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Review widget ───────────────────────────────────────────────── */}
      {dueReviews.length > 0 && (
        <div style={{ padding: '0 18px 10px', flexShrink: 0 }}>
          <div
            className="tap-scale"
            onClick={() => navigate('/review')}
            style={{
              borderRadius: '18px', padding: '14px 16px',
              background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06))',
              border: '1px solid rgba(245,158,11,0.32)',
              display: 'flex', alignItems: 'center', gap: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(245,158,11,0.12)',
            }}
          >
            <div style={{
              width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
            }}>🔁</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#f0f0ff', marginBottom: '2px' }}>
                Повторить ошибки · {dueReviews.length} {plural(dueReviews.length, 'задание', 'задания', 'заданий')}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.4 }}>
                Повторяя ошибки каждый день, сдают ЕГЭ на 15+ баллов лучше
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <path d="M6 4l4 4-4 4" stroke="rgba(245,158,11,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      )}

      {/* ── Section tabs ────────────────────────────────────────────────── */}
      <div style={{ paddingBottom: '12px', flexShrink: 0 }}>
        <div
          ref={tabsRef}
          style={{
            display: 'flex', gap: '6px',
            paddingLeft: '18px',
            overflowX: 'auto', scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {sections.map((section, idx) => {
            const active = idx === activeSectionIdx
            const sp = getSectionProgress(section.id)
            const isDone = sp === 100
            const inProgress = sp > 0 && sp < 100
            return (
              <button
                key={section.id}
                className="tap-scale"
                onClick={() => setActiveSectionIdx(idx)}
                style={{
                  flexShrink: 0,
                  width: '42px', height: '42px',
                  borderRadius: '12px',
                  border: active
                    ? `1.5px solid ${accent}`
                    : isDone
                      ? '1.5px solid rgba(16,185,129,0.4)'
                      : '1.5px solid rgba(255,255,255,0.09)',
                  background: active
                    ? `linear-gradient(135deg, ${accent}, ${accent}cc)`
                    : isDone
                      ? 'rgba(16,185,129,0.1)'
                      : 'rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: '700',
                  color: active ? '#fff' : isDone ? '#10b981' : 'rgba(255,255,255,0.5)',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                  boxShadow: active ? `0 4px 12px ${accent}55` : 'none',
                }}
              >
                {isDone && !active ? '✓' : section.taskNumber}
                {inProgress && !active && (
                  <span style={{
                    position: 'absolute', top: '-3px', right: '-3px',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: '#f59e0b', border: '1.5px solid #0d0f14',
                  }} />
                )}
              </button>
            )
          })}
          {/* Trailing spacer so last tab isn't clipped */}
          <div style={{ flexShrink: 0, width: '18px' }} />

          {/* Filter btn */}
          <button style={{
            flexShrink: 0, width: '42px', height: '42px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.09)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M7 12h10M10 18h4" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Carousel ─────────────────────────────────────────────────────── */}
      <div ref={carouselRef} style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          display: 'flex', height: '100%',
          transform: `translateX(calc(-${activeSectionIdx * 100}% + ${dragOffset}px))`,
          transition: draggingRef.current ? 'none' : 'transform 0.28s cubic-bezier(0.25,1,0.5,1)',
          willChange: 'transform',
        }}>
          {sections.map((section, idx) => {
            const sc = section.color ?? accent
            const spct = getSectionProgress(section.id)
            const isActive = idx === activeSectionIdx
            // Only render content for active + adjacent slides
            const visible = Math.abs(idx - activeSectionIdx) <= 1
            return (
              <div key={section.id} style={{
                width: '100%', flexShrink: 0,
                overflowY: isActive ? 'auto' : 'hidden',
                padding: '0 16px 24px',
              }}>
                {visible && (<>
                  {/* Section header card */}
                  <div style={{
                    borderRadius: '20px', padding: '16px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    marginBottom: '12px', boxShadow: `0 4px 24px ${sc}18`,
                  }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <SectionIcon section={section} subject={subject} accentColor={sc} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: sc, letterSpacing: '0.06em', marginBottom: '4px' }}>
                          Задание {section.taskNumber}
                        </div>
                        <div style={{ fontSize: '17px', fontWeight: '800', color: '#f0f0ff', lineHeight: 1.2, marginBottom: '5px' }}>
                          {section.label}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                          {section.description}
                        </div>
                      </div>
                      <CircleRing pct={spct} size={64} stroke={5} color={sc} />
                    </div>
                  </div>

                  {/* Level cards */}
                  <div className="stagger" style={{ paddingTop: '4px' }}>
                    {LEVEL_META.map((meta, i) => (
                      <LevelCard
                        key={i}
                        meta={meta}
                        status={getLevelStatus(section.id, i)}
                        isLast={i === LEVEL_META.length - 1}
                        accent={accent}
                        hasDraft={hasDraftForLevel(section.id, i)}
                        onPress={() => navigate(`/level/${section.id}/${i}`)}
                      />
                    ))}
                  </div>

                  {/* Diagnostic + AI — only on active slide */}
                  {isActive && (<>
                    {!diagnosticData.done && (
                      <div style={{
                        marginTop: '16px', borderRadius: '20px', padding: '14px 16px',
                        background: `linear-gradient(135deg, ${accent}20, ${accent}0a)`,
                        border: `1px solid ${accent}44`,
                        display: 'flex', alignItems: 'center', gap: '14px',
                      }}>
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
                          background: `linear-gradient(135deg, ${accent}, ${accent}99)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                          boxShadow: `0 4px 14px ${accent}44`,
                        }}>🎯</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#f0f0ff', marginBottom: '2px' }}>Пройди диагностику</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Узнаем твой уровень — 10 вопросов</div>
                        </div>
                        <button onClick={() => navigate('/diagnostic')} style={{
                          flexShrink: 0, padding: '8px 14px', borderRadius: '12px', border: 'none',
                          background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                          color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                          boxShadow: `0 4px 12px ${accent}44`, whiteSpace: 'nowrap',
                        }}>Начать</button>
                      </div>
                    )}
                    <div style={{
                      marginTop: '16px', borderRadius: '20px', padding: '16px',
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(59,130,246,0.08))',
                      border: '1px solid rgba(124,58,237,0.22)',
                      display: 'flex', alignItems: 'center', gap: '14px',
                    }}>
                      <div style={{
                        width: '52px', height: '52px', borderRadius: '16px', flexShrink: 0,
                        background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '24px', boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
                      }}>🤖</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#f0f0ff', marginBottom: '2px' }}>AI-помощник</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>Задай вопрос о теме или попроси объяснить сложное задание</div>
                      </div>
                      <button onClick={() => navigate('/chat')} style={{
                        flexShrink: 0, padding: '9px 16px', borderRadius: '12px', border: 'none',
                        background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                        color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        boxShadow: '0 4px 12px rgba(124,58,237,0.4)', whiteSpace: 'nowrap',
                      }}>💬 Чат</button>
                    </div>
                  </>)}
                </>)}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Subject Switcher modal ───────────────────────────────────────── */}
      {showSwitcher && (
        <SubjectSwitcher
          exam={progress.exam}
          currentSubject={progress.subject}
          onSelect={handleSwitchSubject}
          onClose={() => setShowSwitcher(false)}
        />
      )}
    </div>
  )
}
