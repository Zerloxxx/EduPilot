import React, { useState, useEffect, useRef } from 'react'

const PHONE_W = 393
const PHONE_H = 852

function StatusBar() {
  const [time, setTime] = useState(() => {
    const now = new Date()
    return now.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
  })

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }))
    }, 10000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      height: '50px',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      padding: '0 28px 8px',
      flexShrink: 0,
      position: 'relative',
      zIndex: 50,
    }}>
      <span style={{ fontSize: '15px', fontWeight: '700', color: '#f0f0ff', letterSpacing: '-0.3px' }}>
        {time}
      </span>

      {/* Dynamic Island */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '12px',
        transform: 'translateX(-50%)',
        width: '126px',
        height: '37px',
        borderRadius: '20px',
        background: '#000',
        zIndex: 60,
        boxShadow: '0 0 0 1px rgba(255,255,255,0.04)',
      }} />

      {/* Status icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        {/* Signal bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '11px' }}>
          {[4, 7, 9, 11].map((h, i) => (
            <div key={i} style={{
              width: '3px', height: `${h}px`, borderRadius: '1px',
              background: i < 3 ? '#f0f0ff' : 'rgba(240,240,255,0.35)',
            }} />
          ))}
        </div>
        {/* WiFi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
          <path d="M7.5 8.5a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z" fill="#f0f0ff"/>
          <path d="M3.2 5.8C4.5 4.4 5.9 3.7 7.5 3.7s3 .7 4.3 2.1" stroke="#f0f0ff" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
          <path d="M.6 3C2.7 1 5 0 7.5 0s4.8 1 6.9 3" stroke="#f0f0ff" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
        </svg>
        {/* Battery */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
          <div style={{
            width: '24px', height: '12px', borderRadius: '3.5px',
            border: '1px solid rgba(240,240,255,0.45)',
            padding: '2px 2.5px',
            display: 'flex', alignItems: 'center',
          }}>
            <div style={{ width: '65%', height: '100%', borderRadius: '1.5px', background: '#f0f0ff' }} />
          </div>
          <div style={{ width: '2px', height: '5px', borderRadius: '0 1px 1px 0', background: 'rgba(240,240,255,0.35)' }} />
        </div>
      </div>
    </div>
  )
}

function HomeIndicator() {
  return (
    <div style={{
      height: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        width: '130px',
        height: '5px',
        borderRadius: '3px',
        background: 'rgba(255,255,255,0.22)',
      }} />
    </div>
  )
}

export default function PhoneFrame({ children, bottomNav }) {
  const [scale, setScale] = useState(1)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700)
  const containerRef = useRef(null)

  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      setIsMobile(vw < 700)
      if (vw >= 700) {
        const availH = vh - 32
        const availW = vw - 40
        const scaleByH = availH / PHONE_H
        const scaleByW = availW / PHONE_W
        setScale(Math.min(1, scaleByH, scaleByW))
      }
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  // ─── Mobile: full-screen, no frame ───────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#08080f' }}>
        <StatusBar />
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, position: 'relative' }}>
          {children}
        </div>
        {bottomNav}
        <HomeIndicator />
      </div>
    )
  }

  // ─── Desktop: phone mockup ────────────────────────────────────────────────
  const scaledH = Math.round(PHONE_H * scale)

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#04040a',
      padding: '16px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Desktop ambient background */}
      <DesktopBg />

      {/* Scaled phone wrapper — preserves layout space */}
      <div
        ref={containerRef}
        style={{
          width: `${Math.round(PHONE_W * scale)}px`,
          height: `${scaledH}px`,
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Actual phone at natural size, scaled down via transform */}
        <div style={{
          width: `${PHONE_W}px`,
          height: `${PHONE_H}px`,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
          position: 'absolute',
          top: 0,
          left: 0,
        }}>
          <PhoneShell>
            <StatusBar />
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, position: 'relative' }}>
              {children}
            </div>
            {bottomNav}
            <HomeIndicator />
          </PhoneShell>
        </div>
      </div>

      {/* Glow reflection under phone */}
      <div style={{
        position: 'absolute',
        bottom: '0px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${Math.round(280 * scale)}px`,
        height: '50px',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(124,58,237,0.22) 0%, transparent 70%)',
        filter: 'blur(20px)',
        zIndex: 5,
      }} />
    </div>
  )
}

function PhoneShell({ children }) {
  return (
    <div style={{
      width: `${PHONE_W}px`,
      height: `${PHONE_H}px`,
      borderRadius: '55px',
      background: 'linear-gradient(160deg, #242428 0%, #141418 40%, #0e0e12 100%)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: `
        0 0 0 1px rgba(255,255,255,0.13),
        0 0 0 2.5px rgba(0,0,0,0.9),
        0 30px 80px rgba(0,0,0,0.85),
        0 60px 120px rgba(0,0,0,0.5),
        inset 0 1px 0 rgba(255,255,255,0.08),
        inset 0 -1px 0 rgba(0,0,0,0.6)
      `,
    }}>
      {/* Screen border highlight */}
      <div style={{
        position: 'absolute',
        inset: '0',
        borderRadius: '55px',
        background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, transparent 35%, transparent 65%, rgba(0,0,0,0.2) 100%)',
        pointerEvents: 'none',
        zIndex: 400,
      }} />

      {/* Side buttons — left */}
      <SideButton side="left" top={130} height={34} />
      <SideButton side="left" top={182} height={66} />
      <SideButton side="left" top={264} height={66} />
      {/* Side button — right */}
      <SideButton side="right" top={194} height={100} />

      {/* Screen content area */}
      <div style={{
        position: 'absolute',
        inset: '2px',
        borderRadius: '53px',
        background: '#08080f',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {children}
      </div>
    </div>
  )
}

function SideButton({ side, top, height }) {
  const isLeft = side === 'left'
  return (
    <div style={{
      position: 'absolute',
      [isLeft ? 'left' : 'right']: '-4px',
      top: `${top}px`,
      width: '4px',
      height: `${height}px`,
      borderRadius: isLeft ? '3px 0 0 3px' : '0 3px 3px 0',
      background: 'linear-gradient(180deg, #2e2e32 0%, #1a1a1e 50%, #222226 100%)',
      boxShadow: isLeft
        ? '-2px 0 6px rgba(0,0,0,0.6), inset 1px 0 0 rgba(255,255,255,0.06)'
        : '2px 0 6px rgba(0,0,0,0.6), inset -1px 0 0 rgba(255,255,255,0.06)',
      zIndex: 500,
    }} />
  )
}

function DesktopBg() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', width: '700px', height: '700px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(109,40,217,0.13) 0%, transparent 65%)',
        top: '-250px', left: '50%', transform: 'translateX(-50%)',
      }} />
      <div style={{
        position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.09) 0%, transparent 65%)',
        bottom: '-80px', left: '28%',
      }} />
      <div style={{
        position: 'absolute', width: '350px', height: '350px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(147,51,234,0.07) 0%, transparent 65%)',
        top: '35%', right: '18%',
      }} />
      {/* Subtle dot grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />
    </div>
  )
}
