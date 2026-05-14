import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'

const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY
const MODEL = 'gpt-4o-mini'

// ─── Storage ──────────────────────────────────────────────────────────────────
const CHATS_KEY       = 'edupilot_chats_v1'
const LAST_THREAD_KEY = 'edupilot_last_thread_v1'

function readAll()       { try { return JSON.parse(localStorage.getItem(CHATS_KEY) ?? '{}') } catch { return {} } }
function writeAll(d)     { try { localStorage.setItem(CHATS_KEY, JSON.stringify(d)) } catch {} }

function readLastThread(subject) {
  try { return (JSON.parse(localStorage.getItem(LAST_THREAD_KEY) ?? '{}'))[subject] ?? 'general' } catch { return 'general' }
}
function writeLastThread(subject, id) {
  try {
    const d = JSON.parse(localStorage.getItem(LAST_THREAD_KEY) ?? '{}')
    localStorage.setItem(LAST_THREAD_KEY, JSON.stringify({ ...d, [subject]: id }))
  } catch {}
}

// Read messages for one thread (pure localStorage, no React state)
function readMessages(subject, threadId) {
  return readAll()[subject]?.[threadId]?.messages ?? []
}

// Persist messages for one thread without touching other threads
function writeMessages(subject, threadId, messages) {
  const all = readAll()
  if (!all[subject]) all[subject] = {}
  if (!all[subject][threadId]) return // thread must exist
  all[subject][threadId].messages = messages
  all[subject][threadId].lastMessageAt = Date.now()
  writeAll(all)
}

// Ensure a thread object exists in storage; returns current thread meta
function ensureThread(subject, threadId, title, emoji, context) {
  const all = readAll()
  if (!all[subject]) all[subject] = {}
  if (!all[subject][threadId]) {
    all[subject][threadId] = { title, emoji, context: context ?? null, messages: [], createdAt: Date.now() }
    writeAll(all)
  } else if (context != null) {
    all[subject][threadId].context = context
    writeAll(all)
  }
  return all[subject][threadId]
}

// Full thread meta map for the picker (no messages, just header info)
function readThreadIndex(subject) {
  const threads = readAll()[subject] ?? {}
  return Object.fromEntries(
    Object.entries(threads).map(([id, t]) => {
      const lastReal = (t.messages ?? []).filter(m => m.role !== 'context-card').slice(-1)[0]
      return [id, {
        title:           t.title,
        emoji:           t.emoji ?? '💬',
        context:         t.context ?? null,
        lastMessageAt:   t.lastMessageAt ?? t.createdAt ?? 0,
        lastMessageText: lastReal?.text ?? null,
      }]
    })
  )
}

// ─── System prompt ────────────────────────────────────────────────────────────
function buildSystemPrompt(ctx) {
  const base = `Ты — AI-репетитор приложения EduPilot. Помогаешь российским школьникам готовиться к ОГЭ и ЕГЭ.

Правила общения:
- Отвечай ТОЛЬКО на русском языке
- Говори дружелюбно, как живой репетитор для подростка 14–17 лет
- Объясняй простым языком, без лишней воды
- НЕ задавай встречных вопросов — ученик пришёл за объяснением, а не за диалогом
- Сразу давай ответ и объяснение: что правильно, почему, как решать
- Используй эмодзи умеренно
- Ответы держи компактными: 3–5 предложений обычно достаточно
- НИКОГДА не используй LaTeX-разметку (\\(...\\), \\[...\\], $$...$$). Пиши математику простым текстом: 2^6, n^2, sqrt(n), и т.д.`

  if (!ctx) return base

  return `${base}

─── КОНТЕКСТ ЗАДАНИЯ ───
Тема: Задание №${ctx.taskNumber} — ${ctx.sectionLabel}
Задание: «${ctx.taskText}»
Ученик ответил: «${ctx.userAnswer}» — это неверно.
${ctx.explanation?.error ? `Типичная ошибка: ${ctx.explanation.error}` : ''}

Стиль ответа: объясняй решение ПРЯМО и по шагам. Не задавай встречных вопросов — просто расскажи как решается и почему ответ ученика неверен. Коротко и по делу.`
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────
async function callOpenAI(messages, systemPrompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 400, temperature: 0.7,
    }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message ?? `API error ${res.status}`) }
  return (await res.json()).choices[0].message.content.trim()
}

// ─── Message helpers ──────────────────────────────────────────────────────────
let msgId = 100
function makeContextBubble(ctx) {
  return { id: `ctx_${Date.now()}`, role: 'context-card', taskContext: ctx, time: now() }
}
function makeWelcome() {
  return { id: 'welcome', role: 'ai', text: 'Привет! 👋 Я твой AI-репетитор. Спроси про любую тему или задание — объясню простым языком.', time: now() }
}
function now() { return new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) }

function buildApiHistory(messages) {
  return messages
    .filter(m => m.role === 'user' || m.role === 'ai')
    .slice(-12)
    .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }))
}

const QUICK_DEFAULT = ['Объясни проще 🙏', 'Дай похожее задание', 'Как решать такие задачи?', 'Что надо знать для ЕГЭ?']
const QUICK_TASK    = ['Объясни ход решения', 'Покажи похожий пример', 'Что я сделал не так?', 'Как запомнить правило?']

// ─── Thread Picker ────────────────────────────────────────────────────────────
function ThreadPicker({ threadIndex, activeId, onSelect, onClose, subject }) {
  const sorted = Object.entries(threadIndex).sort(([aId, a], [bId, b]) => {
    if (aId === 'general') return -1
    if (bId === 'general') return 1
    return (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0)
  })

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <div onClick={e => e.stopPropagation()} className="anim-slide-up" style={{
        background: '#12121e', borderRadius: '24px 24px 0 0',
        border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none',
        padding: '0 0 32px', maxHeight: '70%', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)' }} />
        </div>
        <div style={{ padding: '8px 18px 14px', fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
          ТРЕДЫ · {subject?.toUpperCase()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 12px' }}>
          {sorted.map(([threadId, t]) => {
            const isActive = threadId === activeId
            return (
              <button key={threadId} className="tap-scale" onClick={() => onSelect(threadId)} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '16px', textAlign: 'left',
                background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                border: isActive ? '1.5px solid rgba(124,58,237,0.35)' : '1.5px solid transparent',
                cursor: 'pointer', width: '100%', transition: 'all 0.15s',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '13px', flexShrink: 0,
                  background: isActive ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'rgba(255,255,255,0.06)',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                }}>{t.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: isActive ? '#c4b5fd' : '#f0f0ff', marginBottom: '2px' }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.lastMessageText?.slice(0, 45) ?? 'Нет сообщений'}{(t.lastMessageText?.length ?? 0) > 45 ? '…' : ''}
                  </div>
                </div>
                {isActive && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7', flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Context Card bubble ──────────────────────────────────────────────────────
function ContextCard({ taskContext }) {
  return (
    <div style={{
      borderRadius: '18px', overflow: 'hidden',
      border: '1px solid rgba(124,58,237,0.3)',
      background: 'linear-gradient(135deg, rgba(124,58,237,0.14), rgba(59,130,246,0.08))',
      maxWidth: '85%',
    }}>
      <div style={{
        padding: '10px 14px', background: 'rgba(124,58,237,0.18)',
        borderBottom: '1px solid rgba(124,58,237,0.2)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ fontSize: '13px' }}>📋</span>
        <span style={{ fontSize: '11px', fontWeight: '800', color: '#a78bfa', letterSpacing: '0.04em' }}>
          ЗАДАНИЕ №{taskContext.taskNumber} · {taskContext.sectionLabel}
        </span>
      </div>
      <div style={{ padding: '12px 14px 10px' }}>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, marginBottom: '10px' }}>
          {taskContext.taskText}
        </p>
        {taskContext.userAnswer && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 10px', borderRadius: '20px',
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
            fontSize: '12px', color: '#fca5a5',
          }}>
            ❌ Твой ответ: «{taskContext.userAnswer}»
          </div>
        )}
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '10px' }}>
          Задай свой вопрос ↓
        </p>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Chat() {
  const { progress } = useProgress()
  const subject = progress?.subject ?? 'cs'

  // Read incoming context once (clears localStorage entry)
  const [incomingCtx] = useState(() => {
    try {
      const raw = localStorage.getItem('edupilot_chat_context')
      if (raw) { localStorage.removeItem('edupilot_chat_context'); return JSON.parse(raw) }
    } catch {}
    return null
  })

  // ── Determine initial active thread & init storage ───────────────────────
  const [activeThreadId, setActiveThreadIdRaw] = useState(() => {
    // Ensure general thread exists
    ensureThread(subject, 'general', 'Общий чат', '💬', null)

    if (incomingCtx?.threadId) {
      // Create / update section thread
      ensureThread(subject, incomingCtx.threadId, incomingCtx.threadTitle ?? 'Разбор задания', incomingCtx.threadEmoji ?? '📝', incomingCtx)
      writeLastThread(subject, incomingCtx.threadId)
      return incomingCtx.threadId
    }
    return readLastThread(subject)
  })

  // ── Active thread meta (for header) ─────────────────────────────────────
  const [threadIndex, setThreadIndex] = useState(() => readThreadIndex(subject))

  const activeMeta = threadIndex[activeThreadId] ?? threadIndex.general ?? { title: 'AI-репетитор', emoji: '✨', context: null }

  // ── Messages — ONLY for the active thread ───────────────────────────────
  const [messages, setMessages] = useState(() => {
    const stored = readMessages(subject, activeThreadId)

    if (incomingCtx?.threadId === activeThreadId) {
      // Append context bubble and persist
      const updated = [...stored, makeContextBubble(incomingCtx)]
      writeMessages(subject, activeThreadId, updated)
      return updated
    }

    if (stored.length === 0) {
      const welcome = [makeWelcome()]
      writeMessages(subject, activeThreadId, welcome)
      return welcome
    }

    return stored
  })

  // ── API state ────────────────────────────────────────────────────────────
  const apiHistory    = useRef(buildApiHistory(messages))
  const systemPromptRef = useRef(buildSystemPrompt(activeMeta.context ?? null))

  // ── UI state ─────────────────────────────────────────────────────────────
  const [input, setInput]       = useState('')
  const [typing, setTyping]     = useState(false)
  const [error, setError]       = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const bottomRef = useRef(null)

  // ── Scroll to bottom ─────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, typing])

  // ── Append a message to active thread ────────────────────────────────────
  const appendMessage = useCallback((msg) => {
    setMessages(prev => {
      const updated = [...prev, msg]
      writeMessages(subject, activeThreadId, updated)
      // Refresh thread index so picker preview updates
      setThreadIndex(readThreadIndex(subject))
      return updated
    })
  }, [subject, activeThreadId])

  // ── Switch thread ─────────────────────────────────────────────────────────
  const switchThread = useCallback((threadId) => {
    if (threadId === activeThreadId) { setShowPicker(false); return }

    // Load messages fresh from localStorage (no stale React state involved)
    let msgs = readMessages(subject, threadId)

    if (msgs.length === 0) {
      msgs = [makeWelcome()]
      writeMessages(subject, threadId, msgs)
    }

    // Update API context for new thread
    const meta = readAll()[subject]?.[threadId]
    apiHistory.current = buildApiHistory(msgs)
    systemPromptRef.current = buildSystemPrompt(meta?.context ?? null)

    writeLastThread(subject, threadId)
    setActiveThreadIdRaw(threadId)
    setMessages(msgs)
    setThreadIndex(readThreadIndex(subject))
    setShowPicker(false)
    setError(null)
  }, [subject, activeThreadId])

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const trimmed = text.trim()
    if (!trimmed || typing) return

    const t = now()
    const userMsg = { id: msgId++, role: 'user', text: trimmed, time: t }
    appendMessage(userMsg)
    setInput('')
    setTyping(true)
    setError(null)

    apiHistory.current = [...apiHistory.current, { role: 'user', content: trimmed }]

    try {
      const reply = await callOpenAI(apiHistory.current, systemPromptRef.current)
      apiHistory.current = [...apiHistory.current, { role: 'assistant', content: reply }]
      appendMessage({ id: msgId++, role: 'ai', text: reply, time: t })
    } catch (e) {
      setError('Не удалось отправить — проверь интернет или ключ API')
      apiHistory.current = apiHistory.current.slice(0, -1)
    } finally {
      setTyping(false)
    }
  }

  const hasTaskContext = activeMeta.context != null
  const quickPrompts  = hasTaskContext ? QUICK_TASK : QUICK_DEFAULT
  const threadCount   = Object.keys(threadIndex).length

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        padding: '10px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0, background: 'rgba(8,8,15,0.7)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '13px', flexShrink: 0,
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
            boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
          }}>✨</div>

          <button onClick={() => setShowPicker(true)} className="tap-scale" style={{
            flex: 1, background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left', padding: 0, minWidth: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#f0f0ff' }}>
                {activeMeta.emoji} {activeMeta.title}
              </span>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.45 }}>
                <path d="M4 6l4 4 4-4" stroke="#f0f0ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              GPT-4o-mini · онлайн
            </div>
          </button>

          <button onClick={() => setShowPicker(true)} className="tap-scale" style={{
            width: '36px', height: '36px', borderRadius: '12px', flexShrink: 0,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            position: 'relative',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {threadCount > 1 && (
              <div style={{
                position: 'absolute', top: '-4px', right: '-4px',
                width: '16px', height: '16px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                fontSize: '9px', fontWeight: '800', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid #08080f',
              }}>{threadCount}</div>
            )}
          </button>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0,
      }}>
        {messages.map((msg, idx) => {
          if (msg.role === 'context-card') {
            return (
              <div key={msg.id ?? idx} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', maxWidth: '88%' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '10px', flexShrink: 0, marginTop: '2px',
                    background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                  }}>📋</div>
                  <ContextCard taskContext={msg.taskContext} />
                </div>
              </div>
            )
          }

          return (
            <div key={msg.id ?? idx} className="anim-slide-up"
              style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
            >
              {msg.role === 'ai' && (
                <div style={{
                  width: '28px', height: '28px', borderRadius: '10px', flexShrink: 0,
                  marginRight: '8px', marginTop: '2px',
                  background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                }}>✨</div>
              )}
              <div style={{ maxWidth: '78%' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'rgba(255,255,255,0.05)',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  fontSize: '14px', lineHeight: '1.6', color: '#f0f0ff', whiteSpace: 'pre-wrap',
                  boxShadow: msg.role === 'user' ? '0 4px 16px rgba(124,58,237,0.25)' : 'none',
                }}>
                  {msg.text}
                </div>
                <p style={{
                  fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px',
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                  paddingLeft: msg.role === 'ai' ? '4px' : 0,
                }}>{msg.time}</p>
              </div>
            </div>
          )
        })}

        {typing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
            }}>✨</div>
            <div style={{
              padding: '12px 16px', borderRadius: '18px 18px 18px 4px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', gap: '4px', alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7',
                  animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  display: 'inline-block',
                }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: '12px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            fontSize: '12px', color: '#f87171', textAlign: 'center',
          }}>⚠️ {error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Quick prompts ─────────────────────────────────────────────────── */}
      <div style={{
        padding: '0 16px 10px', display: 'flex', gap: '8px', overflowX: 'auto', flexShrink: 0,
        msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
      }}>
        {quickPrompts.map(p => (
          <button key={p} onClick={() => sendMessage(p)} disabled={typing} className="tap-scale" style={{
            flexShrink: 0, padding: '7px 14px', borderRadius: '20px',
            background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(168,85,247,0.2)',
            color: '#c084fc', fontSize: '12px', fontWeight: '500', cursor: 'pointer',
            whiteSpace: 'nowrap', opacity: typing ? 0.5 : 1,
          }}>{p}</button>
        ))}
      </div>

      {/* ── Input ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '8px 16px 24px', display: 'flex', gap: '10px', alignItems: 'flex-end', flexShrink: 0 }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '20px', padding: '10px 16px',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
            placeholder="Задай свой вопрос..."
            disabled={typing}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: '14px', color: '#f0f0ff', fontFamily: 'inherit',
            }}
          />
        </div>
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || typing}
          className={input.trim() && !typing ? 'tap-scale' : ''}
          style={{
            width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
            background: input.trim() && !typing ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'rgba(255,255,255,0.06)',
            border: 'none', cursor: input.trim() && !typing ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', transition: 'all 0.2s',
            boxShadow: input.trim() && !typing ? '0 4px 16px rgba(124,58,237,0.3)' : 'none',
          }}
        >↑</button>
      </div>

      {/* ── Thread Picker ─────────────────────────────────────────────────── */}
      {showPicker && (
        <ThreadPicker
          threadIndex={threadIndex}
          activeId={activeThreadId}
          onSelect={switchThread}
          onClose={() => setShowPicker(false)}
          subject={subject}
        />
      )}

      <style>{`
        @keyframes dotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
