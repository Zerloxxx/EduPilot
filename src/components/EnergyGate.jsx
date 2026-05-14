import React, { useState, useEffect } from 'react'

const SIX_HOURS = 6 * 60 * 60 * 1000

function formatCountdown(ms) {
  if (ms <= 0) return '0:00:00'
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function EnergyGate({ refillsAt, onRefill, onBack }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const msLeft = refillsAt ? Math.max(refillsAt - now, 0) : 0
  const timerDone = !refillsAt || msLeft <= 0

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: '#0d0f14',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
    }}>
      <button
        onClick={onBack}
        style={{
          position: 'absolute', top: '16px', left: '16px',
          width: '36px', height: '36px', borderRadius: '12px',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '18px',
        }}
      >←</button>

      {/* Pulsing icon */}
      <div style={{
        width: '100px', height: '100px', borderRadius: '28px',
        background: 'linear-gradient(135deg, rgba(168,85,247,0.28), rgba(168,85,247,0.08))',
        border: '1.5px solid rgba(168,85,247,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '48px', marginBottom: '28px',
        boxShadow: '0 8px 32px rgba(168,85,247,0.22)',
        animation: 'pulseGlow 2s ease-in-out infinite',
      }}>⚡</div>

      <div style={{ fontSize: '26px', fontWeight: '900', color: '#f0f0ff', marginBottom: '10px', textAlign: 'center' }}>
        Энергия закончилась
      </div>
      <div style={{
        fontSize: '14px', color: 'rgba(255,255,255,0.42)', textAlign: 'center',
        lineHeight: 1.6, marginBottom: '32px', maxWidth: '290px',
      }}>
        30 ⚡ в день — по одной за каждый ответ. Восполнится через 6 часов или прямо сейчас.
      </div>

      {/* Countdown timer */}
      {!timerDone && (
        <div style={{
          padding: '14px 32px', borderRadius: '18px',
          background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.22)',
          marginBottom: '20px', textAlign: 'center',
        }}>
          <div style={{
            fontSize: '11px', color: 'rgba(255,255,255,0.38)', marginBottom: '6px',
            fontWeight: '700', letterSpacing: '0.08em',
          }}>
            ПОПОЛНЕНИЕ ЧЕРЕЗ
          </div>
          <div style={{ fontSize: '30px', fontWeight: '900', color: '#a855f7', fontFamily: 'monospace' }}>
            {formatCountdown(msLeft)}
          </div>
        </div>
      )}

      {timerDone && (
        <div style={{
          padding: '12px 24px', borderRadius: '16px',
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
          marginBottom: '20px', fontSize: '13px', color: '#10b981', fontWeight: '700',
        }}>
          ✓ Бесплатное пополнение готово
        </div>
      )}

      {/* Primary CTA */}
      <button
        onClick={onRefill}
        style={{
          width: '100%', maxWidth: '320px',
          padding: '16px', borderRadius: '16px',
          background: timerDone
            ? 'linear-gradient(135deg, #10b981, #059669)'
            : 'linear-gradient(135deg, #a855f7, #7c3aed)',
          border: 'none', color: '#fff',
          fontSize: '16px', fontWeight: '800', cursor: 'pointer',
          boxShadow: timerDone
            ? '0 6px 24px rgba(16,185,129,0.35)'
            : '0 6px 24px rgba(168,85,247,0.35)',
          marginBottom: '12px',
        }}
      >
        {timerDone ? '⚡ Получить бесплатно' : '⚡ Пополнить сейчас · Pro'}
      </button>

      {!timerDone && (
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.22)', textAlign: 'center' }}>
          или подожди бесплатного пополнения
        </div>
      )}
    </div>
  )
}
