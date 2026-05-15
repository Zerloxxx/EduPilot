import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { getSections, SUBJECTS, LEVEL_META, OGE_THRESHOLDS } from '../data/curriculum'

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const elapsed = ts - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return value
}

// ─── Animated bar width hook ──────────────────────────────────────────────────
function useAnimatedWidth(target, delay = 0) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(target), delay + 80)
    return () => clearTimeout(t)
  }, [target, delay])
  return width
}

// ─── Subject accent colors ────────────────────────────────────────────────────
const SUBJECT_ACCENT = { cs: '#3b82f6', math: '#7c3aed', russian: '#8b5cf6' }

// ─── EGE primary points — все задания по ФИПИ ────────────────────────────────
// Часть 2 (cs_24-27, ege_13-19, ru_27) в приложении не реализована →
// там 0% прогресса → 0 заработанных баллов. Честный результат без накруток.
const EGE_POINTS = {
  cs: {
    cs_1:1, cs_2:1, cs_3:1, cs_4:1, cs_5:1, cs_6:1, cs_7:1,
    cs_8:1, cs_9:1, cs_10:1, cs_11:1, cs_12:1, cs_13:1, cs_14:1,
    cs_15:1, cs_16:1, cs_17:1, cs_18:1, cs_19:1, cs_20:1, cs_21:1,
    cs_22:1, cs_23:1,
    cs_24:2, cs_25:2, cs_26:3, cs_27:4,
  },
  math: {
    ege_1:1, ege_2:1, ege_3:1, ege_4:1, ege_5:1, ege_6:1,
    ege_7:1, ege_8:1, ege_9:1, ege_10:1, ege_11:1, ege_12:1,
    ege_13:2, ege_14:3, ege_15:3, ege_16:4, ege_17:3, ege_18:4, ege_19:4,
  },
  russian: {
    ru_1:1, ru_2:1, ru_3:1, ru_4:1, ru_5:1, ru_6:1, ru_7:1,
    ru_8:5,
    ru_9:1, ru_10:1, ru_11:1, ru_12:1, ru_13:1, ru_14:1,
    ru_15:1, ru_16:1, ru_17:1, ru_18:1, ru_19:1, ru_20:1, ru_21:1,
    ru_22:1, ru_23:1, ru_24:1, ru_25:1,
    ru_26:4, ru_27:25,
  },
}

// Сколько заданий в приложении (часть 1 = карточки)
const APP_TASK_COUNT = { cs: 10, math: 10, russian: 10 }

// ─── FIPI conversion tables [primaryScore, testScore] ────────────────────────
const EGE_CONVERSION = {
  cs: [
    [0,0],[1,5],[2,9],[3,13],[4,17],[5,20],[6,23],[7,26],[8,29],[9,32],
    [10,36],[11,39],[12,43],[13,46],[14,50],[15,53],[16,57],[17,60],[18,63],
    [19,67],[20,70],[21,73],[22,76],[23,79],[24,82],[25,85],[26,88],[27,90],
    [28,92],[29,94],[30,96],[31,97],[32,98],[33,99],[34,100],
  ],
  math: [
    [0,0],[1,5],[2,10],[3,14],[4,18],[5,22],[6,25],[7,28],[8,31],[9,34],
    [10,36],[11,38],[12,40],[13,43],[14,46],[15,49],[16,52],[17,55],[18,58],
    [19,61],[20,64],[21,67],[22,70],[23,73],[24,76],[25,79],[26,82],[27,84],
    [28,87],[29,89],[30,91],[31,93],[32,95],[33,97],[34,98],[35,100],
  ],
  russian: [
    [0,0],[2,5],[4,10],[6,14],[8,17],[10,20],[12,23],[14,26],[16,29],[18,32],
    [20,36],[22,40],[24,44],[26,48],[28,52],[30,56],[32,60],[34,64],[36,68],
    [38,71],[40,73],[42,75],[44,77],[46,80],[48,83],[50,86],[52,89],[54,92],
    [56,96],[58,100],
  ],
}

// ─── Subject-specific EGE passing thresholds ─────────────────────────────────
const EGE_THRESHOLDS = {
  cs:      { pass: 40, good: 65, great: 85 },
  math:    { pass: 27, good: 55, great: 78 },
  russian: { pass: 36, good: 65, great: 85 },
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function getTodayStr() { return new Date().toISOString().split('T')[0] }

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      label: ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][d.getDay() === 0 ? 6 : d.getDay() - 1],
      date: d.toISOString().split('T')[0],
    }
  })
}

function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]
}
function daysSince(date) {
  if (!date) return 9
  return Math.max(0, Math.round((new Date(getTodayStr()) - new Date(date)) / 86400000))
}
function stableHash(text) {
  return String(text).split('').reduce((s, c) => s + c.charCodeAt(0), 0)
}
function hexToRgb(hex) {
  const c = hex.replace('#','')
  return `${parseInt(c.slice(0,2),16)},${parseInt(c.slice(2,4),16)},${parseInt(c.slice(4,6),16)}`
}

// ─── Primary → Test score interpolation ──────────────────────────────────────
function convertToTestScore(primary, subject) {
  const table = EGE_CONVERSION[subject] ?? EGE_CONVERSION.cs
  if (primary <= 0) return 0
  for (let i = 0; i < table.length - 1; i++) {
    const [p1, t1] = table[i]
    const [p2, t2] = table[i + 1]
    if (primary <= p2) {
      const frac = (primary - p1) / (p2 - p1)
      return Math.round(t1 + frac * (t2 - t1))
    }
  }
  return table[table.length - 1][1]
}

// ─── Section mastery (0–1) ────────────────────────────────────────────────────
// Диагностика — реальный тест знаний, даёт базовое мастерство.
// Прохождение уровней добавляет сверху. Ошибка в диагностике ограничивает потолок.
function calcMastery(sectionId, completionPct, diagnosticData, staleDays, errorRate) {
  let m = completionPct / 100

  if (diagnosticData.done) {
    const isWeak   = diagnosticData.weakTopics?.some(t => t.sectionId === sectionId)
    const isStrong = diagnosticData.strongTopics?.some(t => t.sectionId === sectionId)
    // Правильный ответ в диагностике = базовое знание темы подтверждено
    if (isStrong) m = Math.max(m, 0.35)
    // Ошибка = тему не знаешь, даже если прошёл уровни формально
    if (isWeak)   m = Math.min(m, 0.55)
  }

  if (m === 0) return 0

  // Много ошибок в упражнениях снижают эффективное знание
  if (errorRate > 60) m *= 0.82
  else if (errorRate > 40) m *= 0.91

  // Кривая забывания
  if (staleDays > 28)      m *= 0.78
  else if (staleDays > 14) m *= 0.88
  else if (staleDays > 7)  m *= 0.95

  return Math.min(1, Math.max(0, m))
}

// ─── Mock analytics from localStorage ────────────────────────────────────────
const ANALYTICS_KEY = 'edupilot_mock_analytics_v1'
function readStored() { try { return JSON.parse(localStorage.getItem(ANALYTICS_KEY) ?? '{}') } catch { return {} } }
function writeStored(d) { try { localStorage.setItem(ANALYTICS_KEY, JSON.stringify(d)) } catch {} }

function buildMockAnalytics(progress, sections) {
  const stored = readStored()
  const subKey = progress.subject ?? 'default'
  const current = stored[subKey] ?? {}
  const mock = {}
  sections.forEach((section, idx) => {
    const completed = progress.completedLevels[section.id]?.length ?? 0
    const s = stableHash(section.id)
    mock[section.id] = {
      lastOpenedDate: completed > 0 ? daysAgo((s + completed) % 6) : daysAgo(4 + (s % 8)),
      errors: Math.max(0, (s + idx * 2) % 7 - completed),
      attempts: Math.max(2, completed + 2 + (s % 4)),
      ...current[section.id],
    }
  })
  writeStored({ ...stored, [subKey]: mock })
  return mock
}

// ─── Smart EGE prediction ─────────────────────────────────────────────────────
function buildPrediction(sections, subject, progress, getSectionProgress, diagnosticData) {
  const points = EGE_POINTS[subject] ?? {}
  const appTaskCount = APP_TASK_COUNT[subject] ?? 10
  const mock = buildMockAnalytics(progress, sections)

  let earnedPrimary = 0
  const primaryMax = Object.values(points).reduce((s, v) => s + v, 0)

  const breakdown = sections.map(section => {
    const pts = points[section.id] ?? 0
    const completionPct = getSectionProgress(section.id)
    const item = mock[section.id] ?? {}
    const staleDays = daysSince(item.lastOpenedDate)
    const errorRate = Math.min(95, Math.round(((item.errors ?? 0) / Math.max(1, item.attempts ?? 1)) * 100))
    const mastery = calcMastery(section.id, completionPct, diagnosticData, staleDays, errorRate)
    const earned = pts * mastery
    earnedPrimary += earned
    return {
      ...section,
      pts,
      mastery: Math.round(mastery * 100),
      earned,
      potentialGain: pts * (1 - mastery),
      completionPct,
    }
  })

  const primaryRaw = Math.round(earnedPrimary)
  const testScore = convertToTestScore(primaryRaw, subject)

  // Opportunities — только из реализованных заданий (pts > 0, есть потенциал)
  const appSections = breakdown.filter(r => r.pts > 0 && r.taskNumber <= appTaskCount)
  const withTestGain = appSections.map(row => {
    const newPrimary = Math.min(primaryMax, primaryRaw + Math.round(row.potentialGain))
    return { ...row, testGain: convertToTestScore(newPrimary, subject) - testScore }
  })
  const opportunities = withTestGain
    .filter(r => r.potentialGain > 0.3)
    .sort((a, b) => b.potentialGain - a.potentialGain)
    .slice(0, 3)

  const weakSections = [...appSections]
    .sort((a, b) => (b.pts * (1 - b.mastery/100)) - (a.pts * (1 - a.mastery/100)))
    .slice(0, 4)

  return { primaryRaw, primaryMax, testScore, appTaskCount, breakdown, opportunities, weakSections }
}

// ─── Plan task auto-tracking ──────────────────────────────────────────────────
function getTaskStatus(task, completedLevels) {
  if (task.type === 'study_theory') {
    const done = completedLevels[task.sectionId]?.includes(0) ?? false
    return { done, current: done ? 1 : 0, total: 1 }
  }
  if (task.type === 'complete_levels') {
    const current = completedLevels[task.sectionId]?.length ?? 0
    const total = task.targetCount ?? 6
    return { done: current >= total, current: Math.min(current, total), total }
  }
  return { done: false, current: 0, total: 1 }
}

const PRIORITY_COLORS = {
  high:   { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   dot: '#ef4444' },
  medium: { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)',  dot: '#3b82f6' },
  low:    { bg: 'var(--bg-card)', border: 'var(--border)', dot: '#6b7280' },
}

// ─── Components ───────────────────────────────────────────────────────────────

function PreparationPlanCard({ plan, completedLevels, navigate, diagnosticData, accent }) {
  // If diagnostic done but no plan yet → show CTA
  if (!plan) {
    if (!diagnosticData.done) return null
    return (
      <div style={{
        borderRadius: '20px', padding: '16px 18px', marginBottom: '12px',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(99,102,241,0.07))',
        border: '1px solid rgba(124,58,237,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
            background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
            boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
          }}>🤖</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-1)', marginBottom: '2px' }}>
              Составить план подготовки
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-2)' }}>
              AI выстроит персональный план по результатам диагностики
            </div>
          </div>
          <button
            onClick={() => navigate('/diagnostic')}
            className="tap-scale"
            style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(124,58,237,0.35)', whiteSpace: 'nowrap',
            }}
          >
            Создать
          </button>
        </div>
      </div>
    )
  }

  const tasks = plan.tasks ?? []
  const taskStatuses = tasks.map(t => ({ ...t, status: getTaskStatus(t, completedLevels) }))
  const doneCount  = taskStatuses.filter(t => t.status.done).length
  const totalCount = taskStatuses.length
  const planPct    = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
  const allDone    = doneCount === totalCount

  const createdDate = plan.createdAt
    ? new Date(plan.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'short' })
    : null

  return (
    <div style={{
      borderRadius: '20px', padding: '16px 18px', marginBottom: '12px',
      background: allDone
        ? 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))'
        : 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(99,102,241,0.07))',
      border: allDone ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(124,58,237,0.25)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{allDone ? '🏆' : '🤖'}</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-1)' }}>
              {allDone ? 'План выполнен!' : 'План подготовки'}
            </div>
            {createdDate && (
              <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '1px' }}>
                создан {createdDate}
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: '900', color: allDone ? '#10b981' : '#a78bfa', lineHeight: 1 }}>
            {doneCount}/{totalCount}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>задач</div>
        </div>
      </div>

      {/* AI summary */}
      {plan.summary && (
        <div style={{
          padding: '10px 12px', borderRadius: '12px', marginBottom: '12px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5,
        }}>
          {plan.summary}
        </div>
      )}

      {/* Progress bar */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ height: '5px', borderRadius: '5px', background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '5px',
            width: `${planPct}%`,
            background: allDone
              ? 'linear-gradient(90deg, #10b981, #34d399)'
              : 'linear-gradient(90deg, #7c3aed, #a855f7)',
            transition: 'width 0.6s cubic-bezier(0.34,1.2,0.64,1)',
            boxShadow: allDone ? '0 0 8px rgba(16,185,129,0.4)' : '0 0 8px rgba(124,58,237,0.4)',
          }} />
        </div>
      </div>

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {taskStatuses.map((task, idx) => {
          const { done, current, total } = task.status
          const p = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.low
          const showProgress = task.type === 'complete_levels' && !done && current > 0

          return (
            <div key={task.id ?? idx} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '12px',
              background: done ? 'rgba(16,185,129,0.07)' : p.bg,
              border: done ? '1px solid rgba(16,185,129,0.2)' : `1px solid ${p.border}`,
              transition: 'all 0.3s ease',
            }}>
              {/* Checkbox */}
              <div style={{
                width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                background: done ? '#10b981' : 'var(--bg-card-2)',
                border: done ? 'none' : `1.5px solid ${p.dot}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {done && <span style={{ fontSize: '11px', color: '#fff' }}>✓</span>}
              </div>

              {/* Label */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '12px', fontWeight: '600', lineHeight: 1.4,
                  color: done ? 'var(--text-3)' : 'var(--text-1)',
                  textDecoration: done ? 'line-through' : 'none',
                }}>
                  {task.label}
                </div>
                {showProgress && (
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>
                    {current} из {total} уровней
                  </div>
                )}
              </div>

              {/* Priority dot (only for pending high/medium) */}
              {!done && task.priority !== 'low' && (
                <div style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: p.dot, flexShrink: 0,
                  boxShadow: `0 0 6px ${p.dot}`,
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Обновить план */}
      <button
        onClick={() => navigate('/diagnostic')}
        className="tap-scale"
        style={{
          marginTop: '12px', width: '100%', padding: '10px', borderRadius: '12px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          color: 'var(--text-2)', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
        }}
      >
        {allDone ? '🎉 Пройти диагностику снова' : '↻ Обновить план'}
      </button>
    </div>
  )
}

function EgeScoreCard({ prediction, subject, diagnosticData, accent }) {
  const { primaryRaw, primaryMax, testScore, appTaskCount } = prediction
  const displayScore = useCountUp(testScore)
  const thresholds = EGE_THRESHOLDS[subject] ?? EGE_THRESHOLDS.cs
  const markerPct = Math.min(98, Math.max(2, testScore))

  let statusText, statusColor
  if (testScore >= thresholds.great)      { statusText = 'Отличный результат 🏆'; statusColor = '#10b981' }
  else if (testScore >= thresholds.good)  { statusText = 'Хороший результат'; statusColor = '#3b82f6' }
  else if (testScore >= thresholds.pass)  { statusText = 'Выше порога'; statusColor = '#f59e0b' }
  else                                    { statusText = 'Ниже порога'; statusColor = '#ef4444' }

  let goal = null
  if (testScore < thresholds.pass)  goal = { label: `до минимума (${thresholds.pass})`, delta: thresholds.pass - testScore, color: '#f59e0b' }
  else if (testScore < thresholds.good)  goal = { label: `до ${thresholds.good} баллов`, delta: thresholds.good - testScore, color: '#3b82f6' }
  else if (testScore < thresholds.great) goal = { label: `до ${thresholds.great} баллов`, delta: thresholds.great - testScore, color: '#10b981' }

  return (
    <div style={{
      borderRadius: '22px', padding: '20px', marginBottom: '12px',
      background: `linear-gradient(135deg, ${accent}1a, ${accent}0a)`,
      border: `1px solid ${accent}44`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-2)', letterSpacing: '0.06em' }}>
            ПРОГНОЗ БАЛЛА ЕГЭ
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>
            задания 1–{appTaskCount} из {primaryMax} первичных · {diagnosticData.done ? 'диагностика учтена · кривая забывания' : 'пройди диагностику для точности'}
          </div>
        </div>
        <span style={{
          padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700',
          background: `rgba(${hexToRgb(statusColor)},0.15)`,
          border: `1px solid rgba(${hexToRgb(statusColor)},0.3)`, color: statusColor,
        }}>{statusText}</span>
      </div>

      {/* Score + primary + goal */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '68px', fontWeight: '900', color: statusColor, lineHeight: 1 }}>{displayScore}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>тестовых баллов</div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
            первичный: <strong style={{ color: 'var(--text-1)' }}>{primaryRaw}</strong> из {primaryMax}
          </div>
        </div>
        {goal && (
          <div style={{
            flex: 1, padding: '12px 14px', borderRadius: '14px', marginBottom: '4px',
            background: `rgba(${hexToRgb(goal.color)},0.1)`,
            border: `1px solid rgba(${hexToRgb(goal.color)},0.2)`,
          }}>
            <div style={{ fontSize: '26px', fontWeight: '900', color: goal.color, lineHeight: 1 }}>+{goal.delta}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-2)', marginTop: '3px', lineHeight: 1.4 }}>
              {goal.label}
            </div>
          </div>
        )}
      </div>

      {/* Gradient score bar */}
      <div style={{ position: 'relative', marginBottom: '6px' }}>
        <div style={{ height: '10px', borderRadius: '10px', overflow: 'visible', position: 'relative',
          background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 35%, #3b82f6 65%, #10b981 100%)' }}>
          <div style={{
            position: 'absolute', left: `${markerPct}%`, top: '-5px',
            width: '20px', height: '20px', borderRadius: '50%',
            background: 'var(--bg)', border: `3px solid ${statusColor}`,
            transform: 'translateX(-50%)',
            boxShadow: `0 0 12px ${statusColor}88`,
          }} />
        </div>

        {/* Threshold lines */}
        {[thresholds.pass, thresholds.good, thresholds.great].map((t, i) => (
          <div key={t} style={{ position: 'absolute', left: `${t}%`, top: 0, height: '10px',
            width: '1px', background: 'var(--border-2)', transform: 'translateX(-50%)' }} />
        ))}
      </div>

      {/* Threshold labels */}
      <div style={{ position: 'relative', height: '18px' }}>
        <span style={{ position: 'absolute', left: '0', fontSize: '10px', color: 'var(--text-3)' }}>0</span>
        <span style={{ position: 'absolute', left: `${thresholds.pass}%`, transform: 'translateX(-50%)', fontSize: '10px', fontWeight: '700', color: '#f59e0b' }}>{thresholds.pass}</span>
        <span style={{ position: 'absolute', left: `${thresholds.good}%`, transform: 'translateX(-50%)', fontSize: '10px', fontWeight: '700', color: '#3b82f6' }}>{thresholds.good}</span>
        <span style={{ position: 'absolute', left: `${thresholds.great}%`, transform: 'translateX(-50%)', fontSize: '10px', fontWeight: '700', color: '#10b981' }}>{thresholds.great}</span>
        <span style={{ position: 'absolute', right: '0', fontSize: '10px', color: 'var(--text-3)' }}>100</span>
      </div>
    </div>
  )
}

function OpportunitiesCard({ opportunities, subject, prediction, accent }) {
  if (opportunities.length === 0) return null
  const points = EGE_POINTS[subject] ?? {}

  return (
    <div style={{
      borderRadius: '20px', padding: '16px 18px', marginBottom: '12px',
      background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.06))',
      border: '1px solid rgba(16,185,129,0.18)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '9px', flexShrink: 0,
          background: 'linear-gradient(135deg, #10b981, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px',
        }}>⚡</div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '800' }}>Что прокачать сейчас</div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>задания с наибольшим приростом</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {opportunities.map((row, i) => {
          const pts = points[row.id] ?? 1

          return (
            <div key={row.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '11px 13px', borderRadius: '14px',
              background: 'var(--bg-card-2)', border: '1px solid var(--border)',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '9px', flexShrink: 0,
                background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: '800', color: '#10b981',
              }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-1)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  №{row.taskNumber} {row.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                  {pts} {pts === 1 ? 'балл' : pts < 5 ? 'балла' : 'баллов'} первичных · мастерство {row.mastery}%
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: '900', color: '#10b981' }}>+{row.testGain}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>тест. балл</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeakTopicsCard({ diagnosticData, weakSections, accent, navigate, subject }) {
  const diagWeak = diagnosticData.weakTopics ?? []
  const points = EGE_POINTS[subject] ?? {}
  const hasDiag = diagnosticData.done && diagWeak.length > 0

  return (
    <div style={{
      borderRadius: '20px', padding: '16px 18px', marginBottom: '12px',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ fontSize: '15px', fontWeight: '800' }}>Слабые темы</div>
        {hasDiag
          ? <span style={{ fontSize: '10px', fontWeight: '700', color: '#a78bfa', padding: '3px 8px', borderRadius: '8px', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)' }}>из диагностики</span>
          : <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-3)', padding: '3px 8px', borderRadius: '8px', background: 'var(--bg-card)' }}>по аналитике</span>
        }
      </div>

      {hasDiag ? (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            {diagWeak.slice(0, 6).map((t, i) => (
              <span key={i} style={{
                padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5',
              }}>{t.topic}</span>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
            Ошибки в диагностике снижают мастерство этих разделов в прогнозе
          </div>
        </div>
      ) : (
        <div>
          {weakSections.map((row, i) => {
            const pts = points[row.id] ?? 1
            const barAccent = row.mastery < 30 ? '#ef4444' : row.mastery < 60 ? '#f59e0b' : accent
            return (
              <div key={row.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px', marginBottom: i < weakSections.length - 1 ? '10px' : 0,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-1)' }}>
                      №{row.taskNumber} {row.label}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', flexShrink: 0, marginLeft: '8px' }}>
                      {pts} {pts < 2 ? 'балл' : 'балла'} · мастерство {row.mastery}%
                    </span>
                  </div>
                  <AnimatedBar mastery={row.mastery} accent={barAccent} delay={i * 80} />
                </div>
              </div>
            )
          })}
          {!diagnosticData.done && (
            <button onClick={() => navigate('/diagnostic')} style={{
              marginTop: '14px', width: '100%', padding: '11px', borderRadius: '12px', border: 'none',
              background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            }}>
              🎯 Пройти диагностику — точный анализ
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function AnimatedBar({ mastery, accent, delay }) {
  const width = useAnimatedWidth(mastery, delay)
  return (
    <div style={{ height: '4px', borderRadius: '4px', background: 'var(--border)' }}>
      <div style={{
        height: '100%', borderRadius: '4px', width: `${width}%`,
        background: mastery === 100
          ? 'linear-gradient(90deg,#10b981,#34d399)'
          : `linear-gradient(90deg,${accent},${accent}99)`,
        boxShadow: mastery > 0 ? `0 0 6px ${accent}44` : 'none',
        transition: 'width 0.55s cubic-bezier(0.34,1.2,0.64,1)',
      }} />
    </div>
  )
}

function SectionBars({ breakdown, accent }) {
  return (
    <div style={{
      borderRadius: '20px', padding: '16px 18px', marginBottom: '12px',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>Разделы</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {breakdown.slice(0, 14).map((section, idx) => (
          <div key={section.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ fontSize: '13px', flexShrink: 0 }}>{section.emoji}</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-1)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  №{section.taskNumber} {section.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                {section.pts > 1 && (
                  <span style={{ fontSize: '10px', fontWeight: '700', color: accent,
                    padding: '2px 6px', borderRadius: '6px', background: `${accent}20` }}>
                    {section.pts}б
                  </span>
                )}
                <span style={{ fontSize: '11px', fontWeight: '800',
                  color: section.mastery === 100 ? '#10b981' : section.mastery > 0 ? accent : 'var(--text-3)' }}>
                  {section.mastery}%
                </span>
              </div>
            </div>
            <AnimatedBar mastery={section.mastery} accent={accent} delay={idx * 40} />
          </div>
        ))}
      </div>
    </div>
  )
}

function StatsRow({ streak, totalXp, totalCompleted, totalLevels, accent }) {
  return (
    <div style={{
      borderRadius: '18px', overflow: 'hidden', marginBottom: '12px',
      background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex',
    }}>
      {[
        { icon: '🔥', value: streak, label: 'дней в ударе', color: '#f97316' },
        { icon: '⚡', value: totalXp, label: 'XP заработано', color: accent },
        { icon: '✅', value: `${totalCompleted}/${totalLevels}`, label: 'уровней', color: '#10b981' },
      ].map((s, i) => (
        <div key={i} style={{
          flex: 1, padding: '14px 8px', textAlign: 'center',
          borderRight: i < 2 ? '1px solid var(--border)' : 'none',
        }}>
          <div style={{ fontSize: '18px', marginBottom: '4px' }}>{s.icon}</div>
          <div style={{ fontSize: '17px', fontWeight: '900', color: s.color, lineHeight: 1 }}>{s.value}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '3px' }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

function WeekActivity({ days, lastActiveDate }) {
  return (
    <div style={{
      borderRadius: '20px', padding: '16px 18px', marginBottom: '12px',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>Активность недели</div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {days.map(({ label, date }) => {
          const isToday = date === getTodayStr()
          const isActive = date === lastActiveDate
          return (
            <div key={date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '12px',
                background: isActive ? 'linear-gradient(135deg,#3b82f6,#7c3aed)' : isToday ? 'rgba(59,130,246,0.1)' : 'var(--bg-card-2)',
                border: isToday && !isActive ? '1px solid rgba(59,130,246,0.25)' : '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                boxShadow: isActive ? '0 4px 14px rgba(59,130,246,0.35)' : 'none',
              }}>
                {isActive ? '✓' : ''}
              </div>
              <span style={{ fontSize: '10px', color: isActive ? '#60a5fa' : 'var(--text-3)', fontWeight: isActive ? '700' : '500' }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── OGE Grade Card ───────────────────────────────────────────────────────────
function OgeGradeCard({ ogeData, subject, accent }) {
  if (!ogeData) return null
  const { earnedPoints, maxPoints, grade, nextGrade } = ogeData
  const threshData = OGE_THRESHOLDS[subject] ?? OGE_THRESHOLDS.math

  const gradeColor = { 2: '#ef4444', 3: '#f59e0b', 4: '#3b82f6', 5: '#10b981' }
  const color = gradeColor[grade] ?? accent

  // Build scale: 0 → grade3.min → grade4.min → grade5.min → max
  const sorted = [...threshData.thresholds].sort((a, b) => a.min - b.min)
  const max = threshData.max

  const barWidth = useAnimatedWidth(Math.round((earnedPoints / max) * 100), 0)

  return (
    <div style={{
      borderRadius: '22px', padding: '20px', marginBottom: '12px',
      background: `linear-gradient(135deg, ${color}1a, ${color}0a)`,
      border: `1px solid ${color}44`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-2)', letterSpacing: '0.06em' }}>
            ПРОГНОЗ ОЦЕНКИ ОГЭ
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>
            {earnedPoints} из {maxPoints} первичных баллов (задания в приложении)
          </div>
        </div>
        <div style={{
          width: '52px', height: '52px', borderRadius: '16px', flexShrink: 0,
          background: `linear-gradient(135deg, ${color}, ${color}99)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 20px ${color}44`,
        }}>
          <span style={{ fontSize: '28px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>{grade}</span>
        </div>
      </div>

      {/* Points progress bar */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ height: '8px', borderRadius: '8px', background: 'var(--border)', overflow: 'hidden', position: 'relative' }}>
          <div style={{
            height: '100%', borderRadius: '8px',
            width: `${barWidth}%`,
            background: `linear-gradient(90deg, ${color}, ${color}99)`,
            boxShadow: `0 0 8px ${color}55`,
            transition: 'width 0.7s cubic-bezier(0.34,1.2,0.64,1)',
          }} />
        </div>
      </div>

      {/* Grade scale */}
      <div style={{ position: 'relative', marginBottom: '8px' }}>
        {/* Track */}
        <div style={{ height: '4px', borderRadius: '4px', background: 'var(--border)' }}>
          <div style={{
            height: '100%', borderRadius: '4px',
            background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 30%, #3b82f6 65%, #10b981 100%)',
          }} />
        </div>

        {/* Threshold ticks */}
        {sorted.map(({ min }) => (
          <div key={min} style={{
            position: 'absolute', left: `${(min / max) * 100}%`, top: '-3px',
            width: '1px', height: '10px', background: 'var(--border-2)',
            transform: 'translateX(-50%)',
          }} />
        ))}

        {/* Current position dot */}
        <div style={{
          position: 'absolute',
          left: `${Math.min(98, Math.max(2, (earnedPoints / max) * 100))}%`,
          top: '-8px',
          width: '20px', height: '20px', borderRadius: '50%',
          background: 'var(--bg)', border: `3px solid ${color}`,
          transform: 'translateX(-50%)',
          boxShadow: `0 0 10px ${color}88`,
        }} />
      </div>

      {/* Grade labels */}
      <div style={{ position: 'relative', height: '20px', marginBottom: '16px' }}>
        <span style={{ position: 'absolute', left: '0', fontSize: '10px', color: 'var(--text-3)' }}>0</span>
        {sorted.map(({ grade: g, min }) => (
          <span key={g} style={{
            position: 'absolute', left: `${(min / max) * 100}%`,
            transform: 'translateX(-50%)', fontSize: '10px', fontWeight: '800',
            color: gradeColor[g] ?? accent,
          }}>{g}</span>
        ))}
        <span style={{ position: 'absolute', right: '0', fontSize: '10px', color: 'var(--text-3)' }}>{max}</span>
      </div>

      {/* Next grade hint */}
      {nextGrade ? (
        <div style={{
          padding: '10px 14px', borderRadius: '14px',
          background: `rgba(${hexToRgb(gradeColor[nextGrade.grade] ?? accent)},0.1)`,
          border: `1px solid rgba(${hexToRgb(gradeColor[nextGrade.grade] ?? accent)},0.2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>
            До оценки <strong style={{ color: gradeColor[nextGrade.grade] }}>{nextGrade.grade}</strong>
          </span>
          <span style={{ fontSize: '16px', fontWeight: '900', color: gradeColor[nextGrade.grade] ?? accent }}>
            ещё {nextGrade.need} {nextGrade.need === 1 ? 'балл' : nextGrade.need < 5 ? 'балла' : 'баллов'}
          </span>
        </div>
      ) : (
        <div style={{
          padding: '10px 14px', borderRadius: '14px', textAlign: 'center',
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
          fontSize: '13px', fontWeight: '700', color: '#10b981',
        }}>
          🏆 Максимальный балл за все разделы!
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Progress() {
  const navigate = useNavigate()
  const { progress, getTotalProgress, getSectionProgress, diagnosticData, planData, ogeData } = useProgress()

  if (!progress) { navigate('/onboarding'); return null }

  const isOge = progress.exam === 'oge'
  const sections = getSections(progress.subject, progress.exam)
  const accent = SUBJECT_ACCENT[progress.subject] ?? '#7c3aed'
  const subjectInfo = SUBJECTS.find(s => s.id === progress.subject)
  const days = getLast7Days()

  const prediction = useMemo(
    () => buildPrediction(sections, progress.subject, progress, getSectionProgress, diagnosticData),
    [progress, sections, getSectionProgress, diagnosticData]
  )

  const totalCompleted = sections.reduce((sum, s) => sum + (progress.completedLevels[s.id]?.length ?? 0), 0)
  const totalLevels = sections.length * LEVEL_META.length

  return (
    <div className="page-enter" style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)', color: 'var(--text-1)' }}>
      <div className="stagger" style={{ padding: '16px 18px 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '18px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', lineHeight: 1, marginBottom: '8px' }}>Аналитика</h1>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
              background: `${accent}22`, border: `1px solid ${accent}44`, color: accent,
            }}>{subjectInfo?.emoji} {subjectInfo?.label}</span>
            <span style={{
              padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
              background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)',
            }}>{progress.exam?.toUpperCase()}</span>
            {!isOge && (
              <span style={{
                padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
                background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)',
              }}>задания 1–{prediction.appTaskCount} в приложении</span>
            )}
          </div>
        </div>

        {isOge
          ? <OgeGradeCard ogeData={ogeData} subject={progress.subject} accent={accent} />
          : <EgeScoreCard prediction={prediction} subject={progress.subject} diagnosticData={diagnosticData} accent={accent} />
        }
        <StatsRow streak={progress.streak} totalXp={progress.totalXp} totalCompleted={totalCompleted} totalLevels={totalLevels} accent={accent} />
        <PreparationPlanCard plan={planData} completedLevels={progress.completedLevels} navigate={navigate} diagnosticData={diagnosticData} accent={accent} />
        {!isOge && <OpportunitiesCard opportunities={prediction.opportunities} subject={progress.subject} prediction={prediction} accent={accent} />}
        <WeakTopicsCard diagnosticData={diagnosticData} weakSections={prediction.weakSections} accent={accent} navigate={navigate} subject={progress.subject} />
        <WeekActivity days={days} lastActiveDate={progress.lastActiveDate} />
        <SectionBars breakdown={prediction.breakdown} accent={accent} />

      </div>
    </div>
  )
}
