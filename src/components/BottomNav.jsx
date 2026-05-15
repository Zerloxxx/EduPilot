import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  {
    path: '/home',
    label: 'Главная',
    icon: (active) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1v-9.5z"
          stroke={active ? 'var(--nav-active)' : 'var(--nav-inactive)'} strokeWidth="1.6" strokeLinejoin="round"
          fill={active ? 'color-mix(in srgb, var(--nav-active) 15%, transparent)' : 'none'} />
        <path d="M9.5 21v-7h5v7"
          stroke={active ? 'var(--nav-active)' : 'var(--nav-inactive)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    path: '/chat',
    label: 'AI-чат',
    icon: (active) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M20 13a2 2 0 01-2 2H7.5L4 18.5V5a2 2 0 012-2h12a2 2 0 012 2v8z"
          stroke={active ? 'var(--nav-active)' : 'var(--nav-inactive)'} strokeWidth="1.6" strokeLinejoin="round"
          fill={active ? 'color-mix(in srgb, var(--nav-active) 15%, transparent)' : 'none'} />
        <path d="M8 9.5h8M8 12.5h5"
          stroke={active ? 'var(--nav-active)' : 'var(--nav-inactive)'} strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    path: '/progress',
    label: 'Прогресс',
    icon: (active) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M18 20V10M12 20V4M6 20v-6"
          stroke={active ? 'var(--nav-active)' : 'var(--nav-inactive)'} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    path: '/profile',
    label: 'Профиль',
    icon: (active) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="3.5"
          stroke={active ? 'var(--nav-active)' : 'var(--nav-inactive)'} strokeWidth="1.6"
          fill={active ? 'color-mix(in srgb, var(--nav-active) 15%, transparent)' : 'none'} />
        <path d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6"
          stroke={active ? 'var(--nav-active)' : 'var(--nav-inactive)'} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav style={{
      width: '100%', flexShrink: 0,
      padding: '8px 4px 6px',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
      borderTop: '1px solid var(--nav-border)',
    }}>
      {tabs.map((tab) => {
        const active = pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="tap-scale"
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: active ? 'color-mix(in srgb, var(--nav-active) 12%, transparent)' : 'none',
              border: 'none', cursor: 'pointer',
              padding: '7px 16px', borderRadius: 14,
              WebkitTapHighlightColor: 'transparent',
              flex: 1, position: 'relative',
              transition: 'background 0.2s ease',
            }}
          >
            {active && (
              <div style={{
                position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                width: 20, height: 3, borderRadius: 2,
                background: 'var(--nav-active)',
                animation: 'scaleIn 0.2s ease-out forwards',
              }} />
            )}
            <div style={{ transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)', transform: active ? 'scale(1.1)' : 'scale(1)' }}>
              {tab.icon(active)}
            </div>
            <span style={{
              fontSize: 10, fontWeight: active ? 700 : 400,
              color: active ? 'var(--nav-active)' : 'var(--nav-inactive)',
              transition: 'color 0.15s',
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
