import { useState, useCallback, useRef, useEffect } from 'react'
import { getSections, getOgeGrade, getOgeNextGrade } from '../data/curriculum'

const STORAGE_KEY = 'edupilot_progress_v4'

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

// ─── Per-subject data structure ──────────────────────────────────────────────
function getSubjectInitialData(subject, exam = 'ege') {
  const sections = getSections(subject, exam)
  const unlockedLevels = {}
  const completedLevels = {}
  sections.forEach(section => {
    unlockedLevels[section.id] = [0]
    completedLevels[section.id] = []
  })
  return {
    unlockedLevels,
    completedLevels,
    solvedTasks: [],
    diagnosticDone: false,
    diagnosticScore: null,
    diagnosticBestScore: null,
    diagnosticAttempts: 0,
    weakTopics: [],
    strongTopics: [],
    preparationPlan: null,
    energy: 30,
    energyDepletedAt: null,
    reviewQueue: [],
    examDate: null,
    examHistory: [],
  }
}

// ─── Full initial state (called from onboarding) ─────────────────────────────
function getInitialState(exam, subject, examDate = null) {
  return {
    exam,
    currentSubject: subject,
    streak: 0,
    lastActiveDate: null,
    totalXp: 0,
    nickname: 'Ученик',
    avatar: '🎓',
    subjects: {
      [subject]: { ...getSubjectInitialData(subject, exam), examDate },
    },
  }
}

// ─── Computed "progress" view — same shape as before so all components work ──
function buildProgressView(state) {
  if (!state) return null
  const subjectData = state.subjects[state.currentSubject] ?? getSubjectInitialData(state.currentSubject, state.exam ?? 'ege')
  return {
    exam: state.exam,
    subject: state.currentSubject,
    streak: state.streak,
    lastActiveDate: state.lastActiveDate,
    totalXp: state.totalXp,
    ...subjectData,
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const state = JSON.parse(raw)
    if (state && !state.exam) state.exam = 'ege'
    // Миграция: глобальный examDate → поле предмета
    if (state && state.examDate !== undefined) {
      const subj = state.subjects?.[state.currentSubject]
      if (subj && !subj.examDate) subj.examDate = state.examDate ?? null
      delete state.examDate
    }
    return state
  } catch {
    return null
  }
}

function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

export function useProgress() {
  const [state, setReactState] = useState(() => load() || null)

  const stateRef = useRef(state)
  stateRef.current = state

  // Synchronous update: save → stateRef → setState
  const update = useCallback((updater) => {
    const prev = stateRef.current
    const next = updater(prev)
    if (next === prev) return
    save(next)
    stateRef.current = next
    setReactState(next)
  }, [])

  // ── Init (onboarding — full reset) ──────────────────────────────────────
  const init = useCallback((exam, subject, examDate = null) => {
    const initial = getInitialState(exam, subject, examDate)
    save(initial)
    stateRef.current = initial
    setReactState(initial)
  }, [])

  // ── Switch subject without losing progress ───────────────────────────────
  const switchSubject = useCallback((subjectId) => {
    update(prev => {
      if (!prev) return prev
      if (subjectId === prev.currentSubject) return prev

      // Create subject entry if first visit to this subject
      const exam = prev.exam ?? 'ege'
      const existingData = prev.subjects[subjectId]

      // Validate: stored data must have keys matching current exam's sections.
      // If it was saved with wrong exam's IDs (e.g. EGE keys in OGE mode), reset it.
      const isCompatible = (() => {
        if (!existingData) return false
        const expectedSections = getSections(subjectId, exam)
        const storedKeys = Object.keys(existingData.unlockedLevels ?? {})
        return expectedSections.some(s => storedKeys.includes(s.id))
      })()

      const subjectData = isCompatible ? existingData : getSubjectInitialData(subjectId, exam)

      return {
        ...prev,
        currentSubject: subjectId,
        subjects: {
          ...prev.subjects,
          [subjectId]: subjectData,
        },
      }
    })
  }, [update])

  // ── Complete level and unlock next ───────────────────────────────────────
  const completeLevel = useCallback((sectionId, levelIndex) => {
    update(prev => {
      if (!prev) return prev

      const subject = prev.currentSubject
      const subjectData = prev.subjects[subject] ?? getSubjectInitialData(subject, prev.exam ?? 'ege')

      const sections = getSections(subject, prev.exam)
      const sectionIdx = sections.findIndex(s => s.id === sectionId)
      const section = sections[sectionIdx]
      const totalLevels = section?.levels?.length ?? 6

      const completedInSection = [...(subjectData.completedLevels[sectionId] ?? [])]
      if (!completedInSection.includes(levelIndex)) {
        completedInSection.push(levelIndex)
      }

      const unlockedInSection = [...(subjectData.unlockedLevels[sectionId] ?? [])]
      const nextLevel = levelIndex + 1
      if (nextLevel < totalLevels && !unlockedInSection.includes(nextLevel)) {
        unlockedInSection.push(nextLevel)
      }

      let newUnlocked = { ...subjectData.unlockedLevels, [sectionId]: unlockedInSection }
      if (nextLevel >= totalLevels && sectionIdx + 1 < sections.length) {
        const nextSectionId = sections[sectionIdx + 1].id
        const nextSectionUnlocked = subjectData.unlockedLevels[nextSectionId] ?? []
        if (!nextSectionUnlocked.includes(0)) {
          newUnlocked[nextSectionId] = [...nextSectionUnlocked, 0]
        }
      }

      const today = getTodayStr()
      let streak = prev.streak
      if (prev.lastActiveDate !== today) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        streak = prev.lastActiveDate === yesterdayStr ? streak + 1 : 1
      }

      const updatedSubjectData = {
        ...subjectData,
        completedLevels: { ...subjectData.completedLevels, [sectionId]: completedInSection },
        unlockedLevels: newUnlocked,
      }

      return {
        ...prev,
        subjects: { ...prev.subjects, [subject]: updatedSubjectData },
        streak,
        lastActiveDate: today,
        totalXp: prev.totalXp + xpForLevel(levelIndex),
      }
    })
  }, [update])

  // ── Complete level + award XP/streak/energy (victory screen) ───────────
  const completeLevelWithBonus = useCallback((sectionId, levelIndex, hadNoMistakes) => {
    const prev = stateRef.current
    if (!prev) return { xp: 0, streakGain: 0, newStreak: 0, energyBonus: 0 }

    const today = getTodayStr()
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const isNewDay = prev.lastActiveDate !== today
    const streakWouldContinue = prev.lastActiveDate === yesterdayStr
    const newStreak = isNewDay ? (streakWouldContinue ? prev.streak + 1 : 1) : prev.streak
    const streakGain = newStreak - prev.streak
    const xp = xpForLevel(levelIndex)
    const MAX_ENERGY = 30
    const energyBonus = hadNoMistakes ? Math.ceil(MAX_ENERGY * 0.5) : 0

    update(prev => {
      if (!prev) return prev
      const subject = prev.currentSubject
      const subjectData = prev.subjects[subject] ?? getSubjectInitialData(subject, prev.exam ?? 'ege')
      const sections = getSections(subject, prev.exam)
      const sectionIdx = sections.findIndex(s => s.id === sectionId)
      const section = sections[sectionIdx]
      const totalLevels = section?.levels?.length ?? 6

      const completedInSection = [...(subjectData.completedLevels[sectionId] ?? [])]
      if (!completedInSection.includes(levelIndex)) completedInSection.push(levelIndex)

      const unlockedInSection = [...(subjectData.unlockedLevels[sectionId] ?? [])]
      const nextLevel = levelIndex + 1
      if (nextLevel < totalLevels && !unlockedInSection.includes(nextLevel)) unlockedInSection.push(nextLevel)

      let newUnlocked = { ...subjectData.unlockedLevels, [sectionId]: unlockedInSection }
      if (nextLevel >= totalLevels && sectionIdx + 1 < sections.length) {
        const nextSectionId = sections[sectionIdx + 1].id
        const nextSectionUnlocked = subjectData.unlockedLevels[nextSectionId] ?? []
        if (!nextSectionUnlocked.includes(0)) newUnlocked[nextSectionId] = [...nextSectionUnlocked, 0]
      }

      const currentEnergy = subjectData.energy ?? 0
      const newEnergy = Math.min(MAX_ENERGY, currentEnergy + energyBonus)

      return {
        ...prev,
        streak: newStreak,
        lastActiveDate: today,
        totalXp: prev.totalXp + xp,
        subjects: {
          ...prev.subjects,
          [subject]: {
            ...subjectData,
            completedLevels: { ...subjectData.completedLevels, [sectionId]: completedInSection },
            unlockedLevels: newUnlocked,
            energy: newEnergy,
            energyDepletedAt: newEnergy > 0 ? null : subjectData.energyDepletedAt,
          },
        },
      }
    })

    return { xp, streakGain, newStreak, energyBonus }
  }, [update])

  // ── Mark task as solved ──────────────────────────────────────────────────
  const solveTask = useCallback((taskId) => {
    update(prev => {
      if (!prev) return prev
      const subject = prev.currentSubject
      const subjectData = prev.subjects[subject] ?? getSubjectInitialData(subject, prev.exam ?? 'ege')
      if (subjectData.solvedTasks.includes(taskId)) return prev
      return {
        ...prev,
        subjects: {
          ...prev.subjects,
          [subject]: { ...subjectData, solvedTasks: [...subjectData.solvedTasks, taskId] },
        },
      }
    })
  }, [update])

  // ── Save diagnostic result — сохраняем лучшую попытку ───────────────────
  const saveDiagnostic = useCallback((score, weakTopics, strongTopics) => {
    update(prev => {
      if (!prev) return prev
      const subject = prev.currentSubject
      const subjectData = prev.subjects[subject] ?? getSubjectInitialData(subject, prev.exam ?? 'ege')
      const prevBest = subjectData.diagnosticBestScore ?? -1
      const isBest   = score > prevBest
      return {
        ...prev,
        subjects: {
          ...prev.subjects,
          [subject]: {
            ...subjectData,
            diagnosticDone:      true,
            diagnosticScore:     score,       // всегда последняя
            diagnosticBestScore: isBest ? score : prevBest, // только если лучше
            diagnosticAttempts:  (subjectData.diagnosticAttempts ?? 0) + 1,
            // weak/strong topics — от лучшей попытки (она точнее для прогноза)
            weakTopics:   isBest ? weakTopics   : subjectData.weakTopics,
            strongTopics: isBest ? strongTopics : subjectData.strongTopics,
          },
        },
      }
    })
  }, [update])

  // ── Save AI preparation plan ─────────────────────────────────────────────
  const savePlan = useCallback((plan) => {
    update(prev => {
      if (!prev) return prev
      const subject = prev.currentSubject
      const subjectData = prev.subjects[subject] ?? getSubjectInitialData(subject, prev.exam ?? 'ege')
      return {
        ...prev,
        subjects: {
          ...prev.subjects,
          [subject]: { ...subjectData, preparationPlan: { ...plan, createdAt: Date.now(), updatedAt: Date.now() } },
        },
      }
    })
  }, [update])

  // ── Update plan (AI re-analysis) — throttled to once per 3 days ─────────
  const updatePlan = useCallback((plan) => {
    update(prev => {
      if (!prev) return prev
      const subject = prev.currentSubject
      const subjectData = prev.subjects[subject] ?? getSubjectInitialData(subject, prev.exam ?? 'ege')
      return {
        ...prev,
        subjects: {
          ...prev.subjects,
          [subject]: {
            ...subjectData,
            preparationPlan: {
              ...plan,
              createdAt: subjectData.preparationPlan?.createdAt ?? Date.now(),
              updatedAt: Date.now(),
            },
          },
        },
      }
    })
  }, [update])

  // ── Schedule task for spaced repetition review ──────────────────────────
  const scheduleReview = useCallback((taskId, sectionId, levelIndex, sectionLabel, taskNumber, taskData) => {
    update(prev => {
      if (!prev) return prev
      const subject = prev.currentSubject
      const subjectData = prev.subjects[subject] ?? getSubjectInitialData(subject, prev.exam ?? 'ege')
      const queue = subjectData.reviewQueue ?? []
      if (queue.find(e => e.taskId === taskId)) return prev // already scheduled
      const DAY = 24 * 60 * 60 * 1000
      return {
        ...prev,
        subjects: {
          ...prev.subjects,
          [subject]: {
            ...subjectData,
            reviewQueue: [...queue, {
              taskId, sectionId, levelIndex, sectionLabel, taskNumber,
              taskData,
              intervalDays: 0,
              nextReviewAt: Date.now(), // сразу — появится в виджете
            }],
          },
        },
      }
    })
  }, [update])

  // ── Complete a review (advance or reset interval) ────────────────────────
  const completeReview = useCallback((taskId, wasCorrect) => {
    update(prev => {
      if (!prev) return prev
      const subject = prev.currentSubject
      const subjectData = prev.subjects[subject] ?? getSubjectInitialData(subject, prev.exam ?? 'ege')
      const queue = subjectData.reviewQueue ?? []
      const DAY = 24 * 60 * 60 * 1000
      const INTERVALS = [0, 1, 3, 7] // 0=сегодня → 1 → 3 → 7 → выучено
      const updated = queue
        .map(e => {
          if (e.taskId !== taskId) return e
          if (!wasCorrect) return { ...e, intervalDays: 0, nextReviewAt: Date.now() }
          const curIdx = INTERVALS.indexOf(e.intervalDays)
          const nextIdx = curIdx + 1
          if (nextIdx >= INTERVALS.length) return null // выучено — удаляем
          const nextInterval = INTERVALS[nextIdx]
          return { ...e, intervalDays: nextInterval, nextReviewAt: Date.now() + nextInterval * DAY }
        })
        .filter(Boolean)
      return {
        ...prev,
        subjects: {
          ...prev.subjects,
          [subject]: { ...subjectData, reviewQueue: updated },
        },
      }
    })
  }, [update])

  // ── Consume 1 energy (on answer submit) ─────────────────────────────────
  const consumeEnergy = useCallback(() => {
    update(prev => {
      if (!prev) return prev
      const subject = prev.currentSubject
      const subjectData = prev.subjects[subject] ?? getSubjectInitialData(subject, prev.exam ?? 'ege')
      const current = subjectData.energy ?? 30
      if (current <= 0) return prev
      const newEnergy = current - 1
      return {
        ...prev,
        subjects: {
          ...prev.subjects,
          [subject]: {
            ...subjectData,
            energy: newEnergy,
            energyDepletedAt: newEnergy === 0 ? Date.now() : subjectData.energyDepletedAt,
          },
        },
      }
    })
  }, [update])

  // ── Refill energy to 30 (paid or auto) ──────────────────────────────────
  const refillEnergy = useCallback(() => {
    update(prev => {
      if (!prev) return prev
      const subject = prev.currentSubject
      const subjectData = prev.subjects[subject] ?? getSubjectInitialData(subject, prev.exam ?? 'ege')
      return {
        ...prev,
        subjects: {
          ...prev.subjects,
          [subject]: { ...subjectData, energy: 30, energyDepletedAt: null },
        },
      }
    })
  }, [update])

  // ── Auto-refill check on mount (6h timer expired) ────────────────────────
  useEffect(() => {
    if (!state) return
    const subject = state.currentSubject
    const d = state.subjects[subject]
    if (!d) return
    const energy = d.energy ?? 30
    if (energy > 0) return
    const depletedAt = d.energyDepletedAt ?? 0
    const SIX_HOURS = 6 * 60 * 60 * 1000
    if (Date.now() - depletedAt >= SIX_HOURS) {
      update(prev => {
        if (!prev) return prev
        const s = prev.currentSubject
        const sd = prev.subjects[s] ?? getSubjectInitialData(s)
        return {
          ...prev,
          subjects: { ...prev.subjects, [s]: { ...sd, energy: 30, energyDepletedAt: null } },
        }
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Set / update exam date for current subject ───────────────────────────
  const setExamDate = useCallback((dateStr) => {
    update(prev => {
      if (!prev) return prev
      const subject = prev.currentSubject
      const subjectData = prev.subjects[subject] ?? getSubjectInitialData(subject, prev.exam ?? 'ege')
      return {
        ...prev,
        subjects: { ...prev.subjects, [subject]: { ...subjectData, examDate: dateStr } },
      }
    })
  }, [update])

  // ── Save exam simulation result ──────────────────────────────────────────
  const saveExamResult = useCallback((examKey, result) => {
    update(prev => {
      if (!prev) return prev
      const subject = prev.currentSubject
      const subjectData = prev.subjects[subject] ?? getSubjectInitialData(subject, prev.exam ?? 'ege')
      const history = subjectData.examHistory ?? []
      return {
        ...prev,
        subjects: {
          ...prev.subjects,
          [subject]: { ...subjectData, examHistory: [...history, { examKey, ...result }] },
        },
      }
    })
  }, [update])

  // ── Update profile (nickname + avatar) ──────────────────────────────────
  const updateProfile = useCallback((nickname, avatar) => {
    update(prev => {
      if (!prev) return prev
      return { ...prev, nickname: nickname ?? prev.nickname, avatar: avatar ?? prev.avatar }
    })
  }, [update])

  // ── Reset all progress ───────────────────────────────────────────────────
  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    stateRef.current = null
    setReactState(null)
  }, [])

  // ── Section progress % ───────────────────────────────────────────────────
  const getSectionProgress = useCallback((sectionId) => {
    if (!state) return 0
    const subjectData = state.subjects[state.currentSubject]
    const completed = subjectData?.completedLevels[sectionId]?.length ?? 0
    return Math.round((completed / 6) * 100)
  }, [state])

  // ── Total progress % ─────────────────────────────────────────────────────
  const getTotalProgress = useCallback(() => {
    if (!state) return 0
    const subjectData = state.subjects[state.currentSubject]
    if (!subjectData) return 0
    const sections = getSections(state.currentSubject, state.exam)
    const totalLevels = sections.length * 6
    const completedTotal = sections.reduce((sum, s) => {
      return sum + (subjectData.completedLevels[s.id]?.length ?? 0)
    }, 0)
    return Math.round((completedTotal / totalLevels) * 100)
  }, [state])

  // ── Level status ─────────────────────────────────────────────────────────
  const getLevelStatus = useCallback((sectionId, levelIndex) => {
    if (!state) return 'locked'
    const subjectData = state.subjects[state.currentSubject]
    const completed = subjectData?.completedLevels[sectionId] ?? []
    const unlocked = subjectData?.unlockedLevels[sectionId] ?? []
    if (completed.includes(levelIndex)) return 'completed'
    if (unlocked.includes(levelIndex)) return 'available'
    return 'locked'
  }, [state])

  // Build flattened "progress" view — same shape as v3 for all existing components
  const progress = buildProgressView(state)

  // ── Diagnostic data for current subject ─────────────────────────────────
  const diagnosticData = (() => {
    if (!state) return { done: false, score: null, bestScore: null, attempts: 0, weakTopics: [], strongTopics: [] }
    const d = state.subjects[state.currentSubject]
    return {
      done:        d?.diagnosticDone      ?? false,
      score:       d?.diagnosticScore     ?? null,  // последняя
      bestScore:   d?.diagnosticBestScore ?? null,  // лучшая
      attempts:    d?.diagnosticAttempts  ?? 0,
      weakTopics:  d?.weakTopics          ?? [],
      strongTopics:d?.strongTopics        ?? [],
    }
  })()

  // ── Plan data for current subject ────────────────────────────────────────
  const planData = (() => {
    if (!state) return null
    return state.subjects[state.currentSubject]?.preparationPlan ?? null
  })()

  // ── Due reviews for current subject ─────────────────────────────────────
  const dueReviews = (() => {
    if (!state) return []
    const d = state.subjects[state.currentSubject]
    const queue = d?.reviewQueue ?? []
    return queue.filter(e => e.nextReviewAt <= Date.now())
  })()

  // ── OGE: earned points + predicted grade ────────────────────────────────
  const ogeData = (() => {
    if (!state || state.exam !== 'oge') return null
    const subject = state.currentSubject
    const subjectData = state.subjects[subject]
    const sections = getSections(subject, 'oge')
    // Балл за секцию зарабатывается когда пройден хотя бы 1 практический уровень
    const earnedPoints = sections.reduce((sum, section) => {
      const completed = subjectData?.completedLevels[section.id] ?? []
      const hasPractice = completed.some(idx => idx > 0)
      return hasPractice ? sum + (section.pointValue ?? 1) : sum
    }, 0)
    const maxPoints = sections.reduce((sum, s) => sum + (s.pointValue ?? 1), 0)
    const grade = getOgeGrade(earnedPoints, subject)
    const nextGrade = getOgeNextGrade(earnedPoints, subject)
    return { earnedPoints, maxPoints, grade, nextGrade }
  })()

  // ── Days left until exam (per current subject) ───────────────────────────
  const currentExamDate = state?.subjects?.[state?.currentSubject]?.examDate ?? null
  const daysLeft = (() => {
    if (!currentExamDate) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const examDay = new Date(currentExamDate)
    examDay.setHours(0, 0, 0, 0)
    const diff = Math.ceil((examDay - today) / (1000 * 60 * 60 * 24))
    return diff >= 0 ? diff : null
  })()

  // ── Global stats across all subjects ────────────────────────────────────
  const globalStats = (() => {
    if (!state) return { totalLevels: 0 }
    const totalLevels = Object.values(state.subjects).reduce((sum, sd) => {
      return sum + Object.values(sd.completedLevels ?? {}).reduce((s, arr) => s + arr.length, 0)
    }, 0)
    return { totalLevels }
  })()

  // ── Per-subject summary for profile ─────────────────────────────────────
  const subjectsSummary = (() => {
    if (!state) return []
    return Object.entries(state.subjects).map(([id, sd]) => ({
      id,
      levelsCompleted: Object.values(sd.completedLevels ?? {}).reduce((s, arr) => s + arr.length, 0),
      diagnosticDone: sd.diagnosticDone ?? false,
      diagnosticBestScore: sd.diagnosticBestScore ?? null,
    }))
  })()

  // ── Energy data for current subject ─────────────────────────────────────
  const energyData = (() => {
    if (!state) return { energy: 30, isEmpty: false, refillsAt: null }
    const d = state.subjects[state.currentSubject]
    const energy = d?.energy ?? 30
    const depletedAt = d?.energyDepletedAt ?? null
    const SIX_HOURS = 6 * 60 * 60 * 1000
    const refillsAt = energy <= 0 && depletedAt ? depletedAt + SIX_HOURS : null
    return { energy, isEmpty: energy <= 0, refillsAt }
  })()

  return {
    progress,
    init,
    switchSubject,
    completeLevel,
    completeLevelWithBonus,
    solveTask,
    saveDiagnostic,
    savePlan,
    updatePlan,
    reset,
    getSectionProgress,
    getTotalProgress,
    getLevelStatus,
    diagnosticData,
    planData,
    energyData,
    consumeEnergy,
    refillEnergy,
    scheduleReview,
    completeReview,
    dueReviews,
    updateProfile,
    setExamDate,
    saveExamResult,
    globalStats,
    subjectsSummary,
    nickname: state?.nickname ?? 'Ученик',
    avatar: state?.avatar ?? '🎓',
    isInitialized: !!state,
    ogeData,
    examDate: currentExamDate,
    daysLeft,
  }
}

function xpForLevel(levelIndex) {
  const xp = [0, 10, 15, 25, 40, 60]
  return xp[levelIndex] ?? 10
}
