import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { SUBJECTS, EXAMS } from '../data/curriculum'

const AVATAR_OPTIONS = [
  '🎓','🚀','🧠','⚡','🔥','🎯','🦁','🐉',
  '🌟','💎','🏆','👾','🤖','🦊','🎮','🐺',
]

const XP_LEVELS = [
  { min: 0,   label: 'Новичок'    },
  { min: 50,  label: 'Стажёр'     },
  { min: 150, label: 'Практикант' },
  { min: 350, label: 'Знаток'     },
  { min: 700, label: 'Эксперт'    },
  { min: 1200,label: 'Мастер'     },
]

function getXpRank(xp) {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].min) return { rank: XP_LEVELS[i].label, index: i + 1 }
  }
  return { rank: 'Новичок', index: 1 }
}

// ─── Avatar picker bottom sheet ───────────────────────────────────────────
function AvatarPicker({ current, onSelect, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        zIndex: 100, backdropFilter: 'blur(4px)',
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px',
        background: '#141620', borderRadius: '24px 24px 0 0',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '20px 20px 36px',
        zIndex: 101,
      }}>
        <div style={{
          width: '36px', height: '4px', borderRadius: '2px',
          background: 'rgba(255,255,255,0.15)', margin: '0 auto 20px',
        }} />
        <div style={{ fontSize: '15px', fontWeight: '800', color: '#f0f0ff', marginBottom: '16px', textAlign: 'center' }}>
          Выбери аватар
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px',
        }}>
          {AVATAR_OPTIONS.map(emoji => (
            <button
              key={emoji}
              className="tap-scale"
              onClick={() => { onSelect(emoji); onClose() }}
              style={{
                height: '64px', borderRadius: '18px', fontSize: '28px',
                background: current === emoji
                  ? 'rgba(124,58,237,0.2)'
                  : 'rgba(255,255,255,0.04)',
                border: current === emoji
                  ? '2px solid rgba(124,58,237,0.7)'
                  : '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: current === emoji ? '0 4px 16px rgba(124,58,237,0.25)' : 'none',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Confirm reset modal ──────────────────────────────────────────────────
function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <>
      <div onClick={onCancel} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        zIndex: 100, backdropFilter: 'blur(4px)',
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'calc(100% - 48px)', maxWidth: '340px',
        background: '#141620', borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '28px 24px', zIndex: 101,
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '16px' }}>⚠️</div>
        <div style={{ fontSize: '17px', fontWeight: '700', color: '#f0f0ff', textAlign: 'center', marginBottom: '8px' }}>
          Сбросить прогресс?
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: '1.6', marginBottom: '24px' }}>
          Весь прогресс, XP и streak будут удалены. Это нельзя отменить.
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '13px', borderRadius: '14px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#f0f0ff', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
          }}>Отмена</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '13px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: 'none', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
          }}>Сбросить</button>
        </div>
      </div>
    </>
  )
}

// ─── Action row ───────────────────────────────────────────────────────────
function ActionRow({ icon, iconBg, iconBorder, label, sub, labelColor, subColor, chevronColor, onClick }) {
  return (
    <button
      className="tap-scale"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '15px 16px', borderRadius: '16px',
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
        cursor: 'pointer', textAlign: 'left', width: '100%',
      }}
    >
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px',
        background: iconBg, border: iconBorder,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: labelColor ?? '#f0f0ff' }}>{label}</div>
        {sub && <div style={{ fontSize: '11px', color: subColor ?? 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{sub}</div>}
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M9 18l6-6-6-6" stroke={chevronColor ?? 'rgba(255,255,255,0.3)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate()
  const {
    progress, reset,
    nickname, avatar, updateProfile,
    globalStats, subjectsSummary,
    switchSubject,
  } = useProgress()

  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [editingNick, setEditingNick] = useState(false)
  const [nickDraft, setNickDraft] = useState(nickname)
  const nickInputRef = useRef(null)

  if (!progress) { navigate('/onboarding'); return null }

  const examInfo = EXAMS.find(e => e.id === progress.exam)
  const { rank } = getXpRank(progress.totalXp)

  const saveNick = () => {
    const trimmed = nickDraft.trim()
    if (trimmed) updateProfile(trimmed, null)
    setEditingNick(false)
  }

  const handleReset = () => { reset(); navigate('/onboarding') }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#0d0f14', color: '#f0f0ff', overflowY: 'auto',
    }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 18px 0' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '2px' }}>Профиль</h1>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Твои достижения</div>
      </div>

      {/* ── Avatar card ─────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 18px 0' }}>
        <div style={{
          borderRadius: '22px', padding: '20px',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(59,130,246,0.08))',
          border: '1px solid rgba(124,58,237,0.28)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

            {/* Avatar tap to change */}
            <button
              className="tap-scale"
              onClick={() => setShowAvatarPicker(true)}
              style={{
                position: 'relative', flexShrink: 0,
                width: '68px', height: '68px', borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(59,130,246,0.35))',
                border: '2px solid rgba(124,58,237,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(124,58,237,0.3)',
              }}
            >
              {avatar}
              <div style={{
                position: 'absolute', bottom: '-4px', right: '-4px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: '#7c3aed', border: '2px solid #0d0f14',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px',
              }}>✏️</div>
            </button>

            {/* Name + rank */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {editingNick ? (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                  <input
                    ref={nickInputRef}
                    autoFocus
                    value={nickDraft}
                    onChange={e => setNickDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveNick(); if (e.key === 'Escape') setEditingNick(false) }}
                    maxLength={20}
                    style={{
                      flex: 1, minWidth: 0,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1.5px solid rgba(124,58,237,0.6)',
                      borderRadius: '10px', padding: '7px 10px',
                      color: '#f0f0ff', fontSize: '15px', fontWeight: '700',
                      outline: 'none',
                    }}
                  />
                  <button onClick={saveNick} style={{
                    flexShrink: 0,
                    width: '34px', height: '34px', borderRadius: '10px', border: 'none',
                    background: '#7c3aed', color: '#fff', fontSize: '18px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>✓</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#f0f0ff' }}>
                    {nickname}
                  </span>
                  <button
                    onClick={() => { setNickDraft(nickname); setEditingNick(true) }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '14px', opacity: 0.5, padding: '2px',
                    }}
                  >✏️</button>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{
                  padding: '3px 10px', borderRadius: '8px',
                  background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.4)',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#a78bfa' }}>
                    {rank}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                  {examInfo?.label} {examInfo?.desc}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Global stats ─────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 18px 0' }}>
        <div style={{
          borderRadius: '18px', overflow: 'hidden',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
        }}>
          {[
            { icon: '🔥', value: progress.streak,           label: 'дней в ударе', color: '#f97316' },
            { icon: '💠', value: progress.totalXp,          label: 'всего XP',     color: '#3b82f6' },
            { icon: '✅', value: globalStats.totalLevels,   label: 'уровней',      color: '#10b981' },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, padding: '14px 8px', textAlign: 'center',
              borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{ fontSize: '19px', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '3px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── My subjects ──────────────────────────────────────────────────── */}
      {subjectsSummary.length > 0 && (
        <div style={{ padding: '16px 18px 0' }}>
          <div style={{
            fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.07em', marginBottom: '10px',
          }}>
            МОИ ПРЕДМЕТЫ
          </div>
          <div style={{
            borderRadius: '18px', overflow: 'hidden',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            {subjectsSummary.map((entry, i) => {
              const info = SUBJECTS.find(s => s.id === entry.id)
              if (!info) return null
              const isCurrent = entry.id === progress.subject
              const accent = { cs: '#3b82f6', math: '#7c3aed', russian: '#8b5cf6' }[entry.id] ?? '#7c3aed'
              return (
                <button
                  key={entry.id}
                  className="tap-scale"
                  onClick={() => { switchSubject(entry.id); navigate('/home') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px', width: '100%', cursor: 'pointer',
                    background: isCurrent ? `rgba(${accent === '#3b82f6' ? '59,130,246' : '124,58,237'},0.07)` : 'transparent',
                    border: 'none',
                    borderBottom: i < subjectsSummary.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
                    background: `linear-gradient(135deg, ${accent}cc, ${accent}55)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px',
                    boxShadow: `0 4px 12px ${accent}33`,
                  }}>
                    {info.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#f0f0ff', marginBottom: '2px' }}>
                      {info.label}
                      {isCurrent && (
                        <span style={{
                          marginLeft: '8px', fontSize: '10px', fontWeight: '700',
                          color: accent, background: `${accent}22`,
                          padding: '2px 7px', borderRadius: '6px',
                          border: `1px solid ${accent}44`,
                        }}>сейчас</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                      {entry.levelsCompleted > 0
                        ? `${entry.levelsCompleted} ${plural(entry.levelsCompleted, 'уровень', 'уровня', 'уровней')} пройдено`
                        : 'Ещё не начат'}
                      {entry.diagnosticDone && entry.diagnosticBestScore !== null
                        ? ` · Диагностика ${entry.diagnosticBestScore}%`
                        : ''}
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Settings ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 18px 36px' }}>
        <div style={{
          fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.07em', marginBottom: '10px',
        }}>
          НАСТРОЙКИ
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <ActionRow
            icon="📚"
            iconBg="rgba(124,58,237,0.15)"
            iconBorder="1px solid rgba(124,58,237,0.3)"
            label="Сменить экзамен"
            sub="Пройти онбординг заново"
            onClick={() => navigate('/onboarding')}
          />
          <ActionRow
            icon="🗑️"
            iconBg="rgba(239,68,68,0.12)"
            iconBorder="1px solid rgba(239,68,68,0.2)"
            label="Сбросить прогресс"
            sub="Удалить всё и начать заново"
            labelColor="#f87171"
            subColor="rgba(239,68,68,0.45)"
            chevronColor="rgba(239,68,68,0.35)"
            onClick={() => setShowConfirm(true)}
          />
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {showAvatarPicker && (
        <AvatarPicker
          current={avatar}
          onSelect={a => updateProfile(null, a)}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
      {showConfirm && (
        <ConfirmModal onConfirm={handleReset} onCancel={() => setShowConfirm(false)} />
      )}
    </div>
  )
}

function plural(n, one, few, many) {
  if (n % 10 === 1 && n % 100 !== 11) return one
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return few
  return many
}
