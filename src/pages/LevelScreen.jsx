import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { getLevel, getSection, LEVEL_META } from '../data/curriculum'
import EnergyGate from '../components/EnergyGate'

const DRAFT_PREFIX = 'edupilot_level_draft_v1'
const letters = ['А', 'Б', 'В', 'Г']

// Normalize answer for input tasks (same as ExamSim)
function normalizeAnswer(s) {
  return String(s ?? '').trim()
    .replace(/\s+/g, '')
    .replace(',', '.')
    .replace(/^−/, '-')
    .replace(/^–/, '-')
    .toLowerCase()
}

function draftKey(sectionId, levelIndex) {
  return `${DRAFT_PREFIX}_${sectionId}_${levelIndex}`
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r},${g},${b}`
}

function readDraft(sectionId, levelIndex) {
  try {
    const raw = localStorage.getItem(draftKey(sectionId, levelIndex))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeDraft(sectionId, levelIndex, draft) {
  try {
    localStorage.setItem(draftKey(sectionId, levelIndex), JSON.stringify(draft))
  } catch {}
}

function clearDraft(sectionId, levelIndex) {
  try {
    localStorage.removeItem(draftKey(sectionId, levelIndex))
  } catch {}
}

function Shell({ section, title, subtitle, children, right, onBack }) {
  const color = section.color ?? '#3b82f6'
  return (
    <div className="page-enter" style={{
      minHeight: '100%',
      background: 'var(--bg)',
      color: 'var(--text-1)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '12px 18px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              width: '36px', height: '36px', borderRadius: '12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-2)', cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ←
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color, letterSpacing: '0.06em', marginBottom: '3px' }}>
              ЗАДАНИЕ {section.taskNumber}
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', lineHeight: 1.1 }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '3px' }}>
                {subtitle}
              </div>
            )}
          </div>
          {right}
        </div>
      </div>
      {children}
    </div>
  )
}

function TheoryBlock({ block, color }) {
  if (block.type === 'formulas') {
    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-2)', letterSpacing: '0.06em', marginBottom: '8px' }}>
          {block.title}
        </div>
        <div style={{
          borderRadius: '18px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          {block.items.map((item, index) => (
            <div key={item.label} style={{
              display: 'flex', justifyContent: 'space-between', gap: '12px',
              padding: '13px 15px',
              borderBottom: index < block.items.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{item.label}</span>
              <span style={{ fontSize: '13px', color, fontWeight: '800', fontFamily: 'monospace', textAlign: 'right' }}>
                {item.formula}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const accent = block.type === 'notes' ? '#10b981' : '#f59e0b'
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-2)', letterSpacing: '0.06em', marginBottom: '8px' }}>
        {block.title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {block.items.map(item => (
          <div key={item} style={{
            display: 'flex', gap: '10px', alignItems: 'flex-start',
            padding: '11px 13px', borderRadius: '15px',
            background: `rgba(${hexToRgb(accent)},0.08)`,
            border: `1px solid rgba(${hexToRgb(accent)},0.18)`,
          }}>
            <span style={{ color: accent, fontSize: '13px', fontWeight: '900', marginTop: '1px' }}>
              {block.type === 'notes' ? '✓' : '•'}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5 }}>
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TheoryScreen({ section, theory, onStart, onBack }) {
  const color = section.color ?? '#3b82f6'
  return (
    <Shell section={section} title="Теория" subtitle={section.label} onBack={onBack}>
      <div style={{ padding: '0 18px 24px', overflowY: 'auto' }}>
        <div style={{
          borderRadius: '20px',
          padding: '16px',
          background: `linear-gradient(135deg, rgba(${hexToRgb(color)},0.16), rgba(${hexToRgb(color)},0.06))`,
          border: `1px solid rgba(${hexToRgb(color)},0.26)`,
          marginBottom: '14px',
        }}>
          <div style={{ fontSize: '17px', fontWeight: '900', marginBottom: '7px' }}>{theory.title}</div>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>{theory.intro}</p>
        </div>
        {theory.blocks.map((block, index) => (
          <TheoryBlock key={index} block={block} color={color} />
        ))}
        <button className="btn-primary" onClick={onStart} style={{ marginTop: '8px' }}>
          Перейти к уровню 1
        </button>
      </div>
    </Shell>
  )
}

function EntryScreen({ section, meta, levelData, isTheory, hasTasks, hasDraft, onStart, onBack }) {
  const color = section.color ?? '#3b82f6'
  return (
    <Shell section={section} title={isTheory ? 'Теория' : meta.index === 5 ? 'Финал' : `Уровень ${meta.index}`} subtitle={section.label} onBack={onBack}>
      <div style={{ padding: '8px 18px 28px' }}>
        <div style={{
          borderRadius: '22px',
          padding: '20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          marginBottom: '14px',
          boxShadow: `0 6px 24px rgba(${hexToRgb(color)},0.12)`,
        }}>
          <div style={{
            width: '76px', height: '76px', borderRadius: '18px',
            background: `linear-gradient(135deg, ${color}, ${color}77)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '30px', fontWeight: '900',
            boxShadow: `0 8px 24px rgba(${hexToRgb(color)},0.35)`,
            marginBottom: '16px',
          }}>
            {isTheory ? '📚' : meta.index}
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', marginBottom: '8px' }}>
            {isTheory ? 'Разобрать основу' : hasTasks ? `${levelData.tasks.length} задания` : 'Скоро появится'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
            {isTheory
              ? 'Короткая теория, важные правила и список того, что стоит выписать в конспект.'
              : hasTasks
                ? 'Варианты ответа, подсказка при ошибке и переход к AI-ассистенту с прикрепленным заданием.'
                : 'Этот уровень пока закрыт для наполнения.'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
          <InfoRow icon="📌" text={isTheory ? 'Важно запомнить и выписать' : 'Правильный ответ при ошибке не показывается'} />
          <InfoRow icon="✨" text={isTheory ? 'После теории откроется практика' : 'Ошибочные задания вернутся в конце'} />
          <InfoRow icon="💬" text={isTheory ? 'AI поможет разобрать тему в чате' : 'Можно обсудить ошибку с AI-ассистентом'} />
        </div>

        <button
          className="btn-primary"
          onClick={onStart}
          disabled={!isTheory && !hasTasks}
          style={{ opacity: (!isTheory && !hasTasks) ? 0.4 : 1 }}
        >
          {isTheory
            ? 'Открыть теорию'
            : hasTasks
              ? hasDraft ? '▶ Продолжить' : 'Начать уровень'
              : 'Скоро'}
        </button>
      </div>
    </Shell>
  )
}

function PracticeScreen({ section, levelIndex, tasks, onComplete, onBack, onConsumeEnergy, energyData, onScheduleReview, exam, sectionId, completeLevelWithBonus, nickname, avatar }) {
  const navigate = useNavigate()
  const meta = LEVEL_META[levelIndex]
  const color = section.color ?? meta.color ?? '#3b82f6'
  const storageKey = draftKey(section.id, levelIndex)

  const [state, setState] = useState(() => {
    const draft = readDraft(section.id, levelIndex)
    return draft ?? {
      queue: tasks.map((_, index) => index),
      currentQueueIndex: 0,
      selected: null,
      submitted: false,
      results: [],
      retryCounts: {},
    }
  })

  useEffect(() => {
    writeDraft(section.id, levelIndex, state)
  }, [section.id, levelIndex, state])

  const taskIndex = state.queue[state.currentQueueIndex]
  const task = tasks[taskIndex]
  const selected = state.selected
  const isLast = state.currentQueueIndex >= state.queue.length - 1
  const completedCount = state.results.filter(r => r.correct).length
  const retryNumber = state.retryCounts[task?.id] ?? 0
  const isInputTask = task?.type === 'input'
  const visibleOptions = isInputTask ? [] : (retryNumber > 0 && task.retryOptions ? task.retryOptions : task.options)
  const visibleCorrect = useMemo(() => {
    if (isInputTask) return -1
    const correctText = task.options[task.correct]
    return visibleOptions.findIndex(opt => opt === correctText)
  }, [task, visibleOptions, isInputTask])
  const isCorrect = isInputTask
    ? (state.submitted && state.results.find(r => r.taskId === task.id)?.correct === true)
    : selected === visibleCorrect
  const submittedWrong = state.submitted && !isCorrect

  // For input tasks: track text input
  const [inputValue, setInputValue] = useState('')
  useEffect(() => { setInputValue('') }, [state.currentQueueIndex])

  const persist = updater => setState(prev => {
    const next = typeof updater === 'function' ? updater(prev) : updater
    writeDraft(section.id, levelIndex, next)
    return next
  })

  const [showEnergyGate, setShowEnergyGate] = useState(false)
  const [hadMistakes, setHadMistakes] = useState(false)
  const [victoryData, setVictoryData] = useState(null)

  const submit = () => {
    if (isInputTask) {
      if (!inputValue.trim()) return
      const correct = normalizeAnswer(inputValue) === normalizeAnswer(task.correctAnswer)
      if (!correct) setHadMistakes(true)
      persist(prev => ({
        ...prev,
        submitted: true,
        results: [...prev.results, { taskId: task.id, correct, selectedText: inputValue }],
      }))
      onConsumeEnergy()
      if (!correct) {
        onScheduleReview(task.id, section.id, levelIndex, section.label, section.taskNumber, {
          id: task.id, text: task.text, options: [task.correctAnswer], correct: 0,
          explanation: task.explanation, retryOptions: null,
        })
      }
      return
    }
    if (selected === null) return
    const correct = selected === visibleCorrect
    if (!correct) setHadMistakes(true)
    persist(prev => ({
      ...prev,
      submitted: true,
      results: [...prev.results, { taskId: task.id, correct, selectedText: visibleOptions[selected] }],
    }))
    onConsumeEnergy()
    if (!correct) {
      onScheduleReview(task.id, section.id, levelIndex, section.label, section.taskNumber, {
        id: task.id,
        text: task.text,
        options: task.options,
        correct: task.correct,
        explanation: task.explanation,
        retryOptions: task.retryOptions,
      })
    }
  }

  const handleNext = () => {
    if (energyData?.isEmpty) {
      setShowEnergyGate(true)
      return
    }
    next()
  }

  const next = () => {
    if (isLast) {
      const wrongIds = state.results.filter(r => !r.correct).map(r => r.taskId)
      if (wrongIds.length === 0) {
        clearDraft(section.id, levelIndex)
        const reward = completeLevelWithBonus(sectionId, levelIndex, !hadMistakes)
        setVictoryData(reward)
        return
      }

      const wrongIndexes = wrongIds
        .map(id => tasks.findIndex(t => t.id === id))
        .filter(index => index >= 0)

      persist(prev => ({
        queue: wrongIndexes,
        currentQueueIndex: 0,
        selected: null,
        submitted: false,
        results: [],
        retryCounts: wrongIds.reduce((acc, id) => ({ ...acc, [id]: (prev.retryCounts[id] ?? 0) + 1 }), prev.retryCounts),
      }))
      return
    }

    persist(prev => ({
      ...prev,
      currentQueueIndex: prev.currentQueueIndex + 1,
      selected: null,
      submitted: false,
    }))
  }

  const discussWithAI = () => {
    const payload = {
      taskText: task.text,
      sectionLabel: section.label,
      taskNumber: section.taskNumber,
      levelIndex,
      userAnswer: selected !== null ? visibleOptions[selected] : 'не выбран',
      hideCorrectAnswer: true,
      explanation: task.explanation,
      // Thread routing
      threadId: section.id,
      threadTitle: `№${section.taskNumber} · ${section.label}`,
      threadEmoji: section.emoji ?? '📝',
      returnPath: `/level/${section.id}/${levelIndex}`,
    }
    localStorage.setItem('edupilot_chat_context', JSON.stringify(payload))
    writeDraft(section.id, levelIndex, state)
    navigate('/chat')
  }

  if (victoryData) {
    return (
      <VictoryScreen
        section={section}
        levelIndex={levelIndex}
        reward={victoryData}
        nickname={nickname}
        avatar={avatar}
        onContinue={onComplete}
      />
    )
  }

  return (
    <Shell
      section={section}
      title={`Уровень ${levelIndex}`}
      subtitle={`${section.label} · вопрос ${state.currentQueueIndex + 1} из ${state.queue.length}`}
      onBack={onBack}
      right={
        <div style={{
          width: '52px', height: '52px', borderRadius: '16px',
          background: `rgba(${hexToRgb(color)},0.12)`,
          border: `1px solid rgba(${hexToRgb(color)},0.28)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, fontWeight: '900',
        }}>
          {completedCount}/{state.results.length}
        </div>
      }
    >
      <div style={{ padding: '0 18px 24px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', gap: '5px', marginBottom: '14px' }}>
          {state.queue.map((_, index) => (
            <div key={index} style={{
              flex: 1, height: '5px', borderRadius: '5px',
              background: index < state.currentQueueIndex ? '#3b82f6' : index === state.currentQueueIndex ? color : 'var(--border)',
              boxShadow: index === state.currentQueueIndex ? `0 0 8px rgba(${hexToRgb(color)},0.5)` : 'none',
            }} />
          ))}
        </div>

        <div style={{
          borderRadius: '20px',
          padding: '18px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          marginBottom: '12px',
        }}>
          <div style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '9px', background: `rgba(${hexToRgb(color)},0.14)`, color, fontSize: '11px', fontWeight: '800', marginBottom: '10px' }}>
            {exam === 'oge' ? 'ОГЭ' : 'ЕГЭ'} №{section.taskNumber}
          </div>
          <div style={{ fontSize: '15px', lineHeight: 1.65, color: 'var(--text-1)', fontWeight: '600' }}>{task.text}</div>
        </div>

        {isInputTask ? (
          <div style={{ marginBottom: '14px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '4px 10px', borderRadius: '9px', marginBottom: '12px',
              background: `rgba(${hexToRgb(color)},0.12)`, width: 'fit-content',
              fontSize: '11px', fontWeight: '800', color,
            }}>
              ✏️ Введи числовой ответ
            </div>
            <div style={{
              display: 'flex', gap: '10px', alignItems: 'center',
              padding: '12px 14px', borderRadius: '16px',
              background: 'var(--bg-card)',
              border: state.submitted
                ? (isCorrect ? '1.5px solid rgba(16,185,129,0.5)' : '1.5px solid rgba(239,68,68,0.45)')
                : `1.5px solid rgba(${hexToRgb(color)},0.35)`,
            }}>
              <input
                type="text"
                inputMode="decimal"
                value={inputValue}
                onChange={e => !state.submitted && setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !state.submitted && submit()}
                placeholder="Введи ответ..."
                disabled={state.submitted}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontSize: '18px', fontWeight: '700', color: 'var(--text-1)',
                  fontFamily: 'inherit',
                }}
              />
              {state.submitted && (
                <span style={{ fontSize: '20px', flexShrink: 0 }}>
                  {isCorrect ? '✅' : '❌'}
                </span>
              )}
            </div>
            {state.submitted && !isCorrect && (
              <div style={{
                marginTop: '10px', padding: '10px 14px', borderRadius: '12px',
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                fontSize: '13px', color: '#34d399',
              }}>
                Правильный ответ: <strong>{task.correctAnswer}</strong>
              </div>
            )}
          </div>
        ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '14px' }}>
          {visibleOptions.map((option, index) => {
            const active = selected === index
            const wrong = submittedWrong && active
            return (
              <button
                key={`${task.id}-${option}`}
                className={state.submitted ? '' : 'tap-scale'}
                onClick={() => !state.submitted && persist(prev => ({ ...prev, selected: index }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '13px 14px', borderRadius: '15px',
                  background: wrong ? 'rgba(239,68,68,0.08)' : active ? `rgba(${hexToRgb(color)},0.12)` : 'var(--bg-card)',
                  border: wrong ? '1.5px solid rgba(239,68,68,0.35)' : active ? `1.5px solid rgba(${hexToRgb(color)},0.55)` : '1px solid var(--border)',
                  color: wrong ? '#f87171' : active ? color : 'var(--text-2)',
                  textAlign: 'left', cursor: state.submitted ? 'default' : 'pointer',
                  fontSize: '14px', fontWeight: '650',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{
                  width: '28px', height: '28px', borderRadius: '9px',
                  background: wrong ? 'rgba(239,68,68,0.14)' : active ? `rgba(${hexToRgb(color)},0.18)` : 'var(--bg-card-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '900',
                  flexShrink: 0,
                }}>
                  {letters[index]}
                </span>
                <span>{option}</span>
              </button>
            )
          })}
        </div>
        )}

        {state.submitted && isCorrect && (
          <div style={{
            padding: '13px 15px', borderRadius: '16px',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.22)',
            color: 'var(--text-1)',
            fontSize: '13px', lineHeight: 1.5, marginBottom: '12px',
          }}>
            <strong style={{ color: '#10b981' }}>Верно.</strong> {task.explanation.tip}
          </div>
        )}

        {submittedWrong && (
          <div style={{
            borderRadius: '18px',
            border: `1px solid rgba(${hexToRgb(color)},0.28)`,
            background: 'var(--bg-card)',
            overflow: 'hidden',
            marginBottom: '12px',
          }}>
            <div style={{ padding: '12px 14px', background: `rgba(${hexToRgb(color)},0.12)` }}>
              <div style={{ fontSize: '13px', fontWeight: '900', color }}>Подсказка без ответа</div>
              <div style={{ fontSize: '11px', color: 'var(--text-2)', marginTop: '2px' }}>
                Правильный вариант не показываем, чтобы ты дошел до него сам.
              </div>
            </div>
            <div style={{ padding: '13px 14px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55, marginBottom: '10px' }}>
                {task.explanation.error}
              </div>
              {task.explanation.steps.slice(0, 2).map((step, index) => (
                <div key={step} style={{ display: 'flex', gap: '9px', marginBottom: '7px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: `rgba(${hexToRgb(color)},0.16)`, color, fontSize: '10px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{index + 1}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showEnergyGate && (
          <EnergyGate
            refillsAt={energyData?.refillsAt}
            onRefill={() => { /* payment / free refill handled by parent */ setShowEnergyGate(false) }}
            onBack={() => setShowEnergyGate(false)}
          />
        )}

        {!state.submitted ? (
          <button
            className="btn-primary" onClick={submit}
            disabled={isInputTask ? !inputValue.trim() : selected === null}
            style={{ opacity: (isInputTask ? !inputValue.trim() : selected === null) ? 0.35 : 1 }}
          >
            Проверить
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {!isCorrect && (
              <button onClick={discussWithAI} style={{
                padding: '14px', borderRadius: '16px',
                background: `rgba(${hexToRgb(color)},0.12)`,
                border: `1px solid rgba(${hexToRgb(color)},0.3)`,
                color, fontSize: '14px', fontWeight: '800', cursor: 'pointer',
              }}>
                Обсудить с AI-ассистентом
              </button>
            )}
            <button className="btn-primary" onClick={handleNext}>
              {isLast ? (state.results.some(r => !r.correct) ? 'Повторить ошибки' : 'Завершить уровень') : 'Следующее задание →'}
            </button>
          </div>
        )}
      </div>
    </Shell>
  )
}

// ─── Victory Screen ──────────────────────────────────────────────────────────
function VictoryScreen({ section, levelIndex, reward, nickname, avatar, onContinue }) {
  const { xp, streakGain, newStreak, energyBonus } = reward
  const color = section.color ?? '#7c3aed'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
    }}>
      {/* Confetti circles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {['#f59e0b','#10b981','#3b82f6','#a855f7','#f43f5e','#06b6d4'].map((c, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${12 + (i % 3) * 8}px`, height: `${12 + (i % 3) * 8}px`,
            borderRadius: '50%', background: c, opacity: 0.25,
            top: `${10 + i * 14}%`, left: `${8 + i * 15}%`,
            animation: `confettiBounce ${1.2 + i * 0.15}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>

      {/* Avatar */}
      <div style={{
        width: '90px', height: '90px', borderRadius: '28px',
        background: `linear-gradient(135deg, ${color}, #3b82f6)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '42px', marginBottom: '20px',
        boxShadow: `0 12px 40px ${color}55`,
      }}>{avatar ?? '🎓'}</div>

      <div style={{ fontSize: '26px', fontWeight: '900', color: 'var(--text-1)', marginBottom: '6px', textAlign: 'center' }}>
        Уровень {levelIndex} пройден!
      </div>
      <div style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '28px', textAlign: 'center' }}>
        {section.label}
      </div>

      {/* Reward cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '320px', marginBottom: '28px' }}>
        {/* XP */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '14px 18px', borderRadius: '18px',
          background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)',
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '14px',
            background: 'rgba(250,204,21,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
          }}>⭐</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '600' }}>ОПЫТ</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#fbbf24' }}>+{xp} XP</div>
          </div>
        </div>

        {/* Streak */}
        {streakGain > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '14px 18px', borderRadius: '18px',
            background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'rgba(249,115,22,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
            }}>🔥</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '600' }}>СЕРИЯ ДНЕЙ</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#fb923c' }}>{newStreak} {newStreak === 1 ? 'день' : newStreak < 5 ? 'дня' : 'дней'}</div>
            </div>
          </div>
        )}

        {/* Energy bonus */}
        {energyBonus > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '14px 18px', borderRadius: '18px',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
            }}>⚡</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '600' }}>БОНУС БЕЗ ОШИБОК</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#34d399' }}>+{energyBonus} энергии</div>
            </div>
          </div>
        )}
      </div>

      <button className="btn-primary" onClick={onContinue} style={{ width: '100%', maxWidth: '320px', fontSize: '16px', padding: '16px' }}>
        Продолжить →
      </button>

      <style>{`
        @keyframes confettiBounce {
          from { transform: translateY(0) rotate(0deg); }
          to { transform: translateY(-18px) rotate(15deg); }
        }
      `}</style>
    </div>
  )
}

function InfoRow({ icon, text }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 14px', borderRadius: '15px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <span style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.35 }}>{text}</span>
    </div>
  )
}

export default function LevelScreen() {
  const { sectionId, levelIndex: levelIndexStr } = useParams()
  const levelIndex = parseInt(levelIndexStr, 10)
  const navigate = useNavigate()
  const { progress, completeLevel, completeLevelWithBonus, energyData, consumeEnergy, refillEnergy, scheduleReview } = useProgress()
  // If a draft exists, resume directly into practice (skips entry screen)
  const [mode, setMode] = useState(() =>
    readDraft(sectionId, levelIndex) ? 'practice' : 'entry'
  )

  if (!progress) {
    navigate('/onboarding')
    return null
  }

  const section = getSection(progress.subject, sectionId, progress.exam ?? 'ege')
  const levelData = getLevel(progress.subject, sectionId, levelIndex, progress.exam ?? 'ege')
  const meta = LEVEL_META[levelIndex]

  if (!section || !levelData || !meta) {
    navigate('/home')
    return null
  }

  const isTheory = meta.type === 'theory'
  const hasTasks = !isTheory && levelData.tasks?.length > 0

  // Show energy gate if empty (only for practice levels, not theory)
  if (!isTheory && energyData.isEmpty && mode === 'entry') {
    return (
      <EnergyGate
        refillsAt={energyData.refillsAt}
        onRefill={() => refillEnergy()}
        onBack={() => navigate('/home')}
      />
    )
  }

  const start = () => setMode(isTheory ? 'theory' : 'practice')
  const backHome = () => navigate('/home')

  const finishTheory = () => {
    completeLevel(sectionId, levelIndex)
    navigate(`/level/${sectionId}/1`)
  }

  const finishPractice = () => {
    completeLevel(sectionId, levelIndex)
    const nextLevel = levelIndex + 1
    if (nextLevel <= 3) navigate(`/level/${sectionId}/${nextLevel}`)
    else navigate('/home')
  }

  if (mode === 'entry') {
    return (
      <EntryScreen
        section={section}
        meta={meta}
        levelData={levelData}
        isTheory={isTheory}
        hasTasks={hasTasks}
        hasDraft={!!readDraft(sectionId, levelIndex)}
        onStart={start}
        onBack={backHome}
      />
    )
  }

  if (mode === 'theory') {
    return (
      <TheoryScreen
        section={section}
        theory={levelData.theory}
        onStart={finishTheory}
        onBack={() => setMode('entry')}
      />
    )
  }

  if (mode === 'practice') {
    return (
      <PracticeScreen
        section={section}
        levelIndex={levelIndex}
        tasks={levelData.tasks}
        onComplete={finishPractice}
        onBack={() => setMode('entry')}
        onConsumeEnergy={consumeEnergy}
        energyData={energyData}
        onScheduleReview={scheduleReview}
        exam={progress.exam ?? 'ege'}
        sectionId={sectionId}
        completeLevelWithBonus={completeLevelWithBonus}
        nickname={progress.nickname ?? 'Ученик'}
        avatar={progress.avatar ?? '🎓'}
      />
    )
  }

  return null
}
