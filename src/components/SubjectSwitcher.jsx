import React from 'react'
import { SUBJECTS } from '../data/curriculum'

// Bottom-sheet modal for switching subjects without losing progress
export default function SubjectSwitcher({ exam, currentSubject, onSelect, onClose }) {
  const subjects = SUBJECTS.filter(s => s.exams.includes(exam))

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 100, backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '430px',
        background: 'var(--bg)', borderRadius: '24px 24px 0 0',
        border: '1px solid var(--border)',
        padding: '12px 20px 36px',
        zIndex: 101,
        boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Handle */}
        <div style={{
          width: '36px', height: '4px', borderRadius: '2px',
          background: 'var(--border-2)',
          margin: '0 auto 20px',
        }} />

        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-1)', marginBottom: '4px' }}>
          Сменить предмет
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '16px' }}>
          Прогресс по каждому предмету сохраняется отдельно
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {subjects.map(s => {
            const active = s.id === currentSubject
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 16px', borderRadius: '16px', cursor: 'pointer',
                  background: active ? 'rgba(59,130,246,0.15)' : 'var(--bg-card)',
                  border: active ? '1.5px solid rgba(59,130,246,0.4)' : '1px solid var(--border)',
                  textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '26px' }}>{s.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: active ? '#3b82f6' : 'var(--text-1)' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                    {active ? 'Текущий предмет' : 'Переключить'}
                  </div>
                </div>
                {active && <span style={{ color: '#3b82f6', fontSize: '18px' }}>✓</span>}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
