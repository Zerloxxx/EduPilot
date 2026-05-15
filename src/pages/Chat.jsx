import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY
const MODEL = 'gpt-4o-mini'

// ─── Storage ──────────────────────────────────────────────────────────────────
// Ключ namespace = "${exam}_${subject}" — ege_math и oge_math хранятся отдельно
const CHATS_KEY       = 'edupilot_chats_v2'
const LAST_THREAD_KEY = 'edupilot_last_thread_v2'

function readAll()       { try { return JSON.parse(localStorage.getItem(CHATS_KEY) ?? '{}') } catch { return {} } }
function writeAll(d)     { try { localStorage.setItem(CHATS_KEY, JSON.stringify(d)) } catch {} }

function readLastThread(ns) {
  try { return (JSON.parse(localStorage.getItem(LAST_THREAD_KEY) ?? '{}'))[ns] ?? 'general' } catch { return 'general' }
}
function writeLastThread(ns, id) {
  try {
    const d = JSON.parse(localStorage.getItem(LAST_THREAD_KEY) ?? '{}')
    localStorage.setItem(LAST_THREAD_KEY, JSON.stringify({ ...d, [ns]: id }))
  } catch {}
}

function readMessages(ns, threadId) {
  return readAll()[ns]?.[threadId]?.messages ?? []
}

function writeMessages(ns, threadId, messages) {
  const all = readAll()
  if (!all[ns]) all[ns] = {}
  if (!all[ns][threadId]) return
  all[ns][threadId].messages = messages
  all[ns][threadId].lastMessageAt = Date.now()
  writeAll(all)
}

function ensureThread(ns, threadId, title, emoji, context) {
  const all = readAll()
  if (!all[ns]) all[ns] = {}
  if (!all[ns][threadId]) {
    all[ns][threadId] = { title, emoji, context: context ?? null, messages: [], createdAt: Date.now() }
    writeAll(all)
  } else if (context != null) {
    all[ns][threadId].context = context
    writeAll(all)
  }
  return all[ns][threadId]
}

function readThreadIndex(ns) {
  const threads = readAll()[ns] ?? {}
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
const SUBJECT_NAMES = { math: 'Математика', cs: 'Информатика', russian: 'Русский язык' }
const EXAM_NAMES    = { ege: 'ЕГЭ (11 класс)', oge: 'ОГЭ (9 класс)' }

function buildSystemPrompt(ctx, exam, subject) {
  const examName    = EXAM_NAMES[exam]    ?? 'ЕГЭ'
  const subjectName = SUBJECT_NAMES[subject] ?? subject

  const base = `Ты — AI-репетитор приложения EduPilot. Помогаешь российским школьникам готовиться к ${examName} по предмету ${subjectName}.

Текущий контекст: ${examName}, ${subjectName}.

Правила общения:
- Отвечай ТОЛЬКО на русском языке
- Говори дружелюбно, как живой репетитор для подростка ${exam === 'oge' ? '13–15' : '15–17'} лет
- Объясняй простым языком, без лишней воды
- НЕ задавай встречных вопросов — ученик пришёл за объяснением, а не за диалогом
- Сразу давай ответ и объяснение: что правильно, почему, как решать
- Ориентируйся на уровень сложности ${examName} — не усложняй и не упрощай сверх нужного
- Используй эмодзи умеренно
- Ответы держи компактными: 3–5 предложений обычно достаточно
- Для математических формул используй LaTeX: inline — $формула$, блочный — $$формула$$
- Примеры: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$, $\\sqrt{16} = 4$, $$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$
- Обычный текст пиши без LaTeX, формулы — с LaTeX`

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

// ─── Math-aware message renderer ─────────────────────────────────────────────
const MD_COMPONENTS = {
  p:      ({ children }) => <p style={{ margin: '0 0 6px', lineHeight: 1.65 }}>{children}</p>,
  strong: ({ children }) => <strong style={{ color: 'var(--text-1)', fontWeight: '800' }}>{children}</strong>,
  em:     ({ children }) => <em style={{ color: '#c4b5fd' }}>{children}</em>,
  code:   ({ children, className }) => {
    const isBlock = className?.startsWith('language-')
    return isBlock
      ? <pre style={{ background: 'var(--bg-card-2)', borderRadius: '10px', padding: '10px 13px', overflowX: 'auto', fontSize: '12px', margin: '6px 0' }}><code>{children}</code></pre>
      : <code style={{ background: 'var(--border)', borderRadius: '5px', padding: '1px 5px', fontFamily: 'monospace', fontSize: '13px' }}>{children}</code>
  },
  ul: ({ children }) => <ul style={{ paddingLeft: '18px', margin: '4px 0' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: '18px', margin: '4px 0' }}>{children}</ol>,
  li: ({ children }) => <li style={{ margin: '2px 0', lineHeight: 1.55 }}>{children}</li>,
}

function MathMessage({ text }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={MD_COMPONENTS}
    >
      {text}
    </ReactMarkdown>
  )
}

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
        background: 'var(--bg)', borderRadius: '24px 24px 0 0',
        border: '1px solid var(--border)', borderBottom: 'none',
        padding: '0 0 32px', maxHeight: '70%', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--border-2)' }} />
        </div>
        <div style={{ padding: '8px 18px 14px', fontSize: '13px', fontWeight: '700', color: 'var(--text-2)', letterSpacing: '0.06em' }}>
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
                  background: isActive ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'var(--bg-card)',
                  border: isActive ? 'none' : '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                }}>{t.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: isActive ? '#c4b5fd' : 'var(--text-1)', marginBottom: '2px' }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
        <p style={{ fontSize: '13px', color: 'var(--text-1)', lineHeight: 1.55, marginBottom: '10px' }}>
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
        <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '10px' }}>
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
  const exam    = progress?.exam    ?? 'ege'
  const ns      = `${exam}_${subject}` // e.g. ege_math, oge_cs

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
    ensureThread(ns, 'general', 'Общий чат', '💬', null)

    if (incomingCtx?.threadId) {
      // Create / update section thread
      ensureThread(ns, incomingCtx.threadId, incomingCtx.threadTitle ?? 'Разбор задания', incomingCtx.threadEmoji ?? '📝', incomingCtx)
      writeLastThread(ns, incomingCtx.threadId)
      return incomingCtx.threadId
    }
    return readLastThread(ns)
  })

  // ── Active thread meta (for header) ─────────────────────────────────────
  const [threadIndex, setThreadIndex] = useState(() => readThreadIndex(ns))

  const activeMeta = threadIndex[activeThreadId] ?? threadIndex.general ?? { title: 'AI-репетитор', emoji: '✨', context: null }

  // ── Messages — ONLY for the active thread ───────────────────────────────
  const [messages, setMessages] = useState(() => {
    const stored = readMessages(ns, activeThreadId)

    if (incomingCtx?.threadId === activeThreadId) {
      // Append context bubble and persist
      const updated = [...stored, makeContextBubble(incomingCtx)]
      writeMessages(ns, activeThreadId, updated)
      return updated
    }

    if (stored.length === 0) {
      const welcome = [makeWelcome()]
      writeMessages(ns, activeThreadId, welcome)
      return welcome
    }

    return stored
  })

  // ── API state ────────────────────────────────────────────────────────────
  const apiHistory    = useRef(buildApiHistory(messages))
  const systemPromptRef = useRef(buildSystemPrompt(activeMeta.context ?? null, exam, subject))

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
      writeMessages(ns, activeThreadId, updated)
      // Refresh thread index so picker preview updates
      setThreadIndex(readThreadIndex(ns))
      return updated
    })
  }, [ns, activeThreadId])

  // ── Switch thread ─────────────────────────────────────────────────────────
  const switchThread = useCallback((threadId) => {
    if (threadId === activeThreadId) { setShowPicker(false); return }

    // Load messages fresh from localStorage (no stale React state involved)
    let msgs = readMessages(ns, threadId)

    if (msgs.length === 0) {
      msgs = [makeWelcome()]
      writeMessages(ns, threadId, msgs)
    }

    // Update API context for new thread
    const meta = readAll()[ns]?.[threadId]
    apiHistory.current = buildApiHistory(msgs)
    systemPromptRef.current = buildSystemPrompt(meta?.context ?? null, exam, subject)

    writeLastThread(ns, threadId)
    setActiveThreadIdRaw(threadId)
    setMessages(msgs)
    setThreadIndex(readThreadIndex(ns))
    setShowPicker(false)
    setError(null)
  }, [ns, exam, subject, activeThreadId])

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative', background: 'var(--bg)', color: 'var(--text-1)' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        padding: '10px 16px 12px', borderBottom: '1px solid var(--border)',
        flexShrink: 0, background: 'var(--nav-bg)',
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
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-1)' }}>
                {activeMeta.emoji} {activeMeta.title}
              </span>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.45 }}>
                <path d="M4 6l4 4 4-4" stroke="var(--text-1)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              GPT-4o-mini · онлайн
            </div>
          </button>

          <button onClick={() => setShowPicker(true)} className="tap-scale" style={{
            width: '36px', height: '36px', borderRadius: '12px', flexShrink: 0,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            position: 'relative',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {threadCount > 1 && (
              <div style={{
                position: 'absolute', top: '-4px', right: '-4px',
                width: '16px', height: '16px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                fontSize: '9px', fontWeight: '800', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid var(--bg)',
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
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'var(--bg-card)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                  fontSize: '14px', lineHeight: '1.6', color: msg.role === 'user' ? '#fff' : 'var(--text-1)',
                  boxShadow: msg.role === 'user' ? '0 4px 16px rgba(124,58,237,0.25)' : 'none',
                }}>
                  {msg.role === 'user'
                    ? <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                    : <MathMessage text={msg.text} />
                  }
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
              background: 'var(--bg-card)', border: '1px solid var(--border)',
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
          background: 'var(--bg-card)', border: '1px solid var(--border)',
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
              fontSize: '14px', color: 'var(--text-1)', fontFamily: 'inherit',
            }}
          />
        </div>
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || typing}
          className={input.trim() && !typing ? 'tap-scale' : ''}
          style={{
            width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
            background: input.trim() && !typing ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'var(--bg-card-2)',
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
          subject={`${EXAM_NAMES[exam] ?? exam} · ${SUBJECT_NAMES[subject] ?? subject}`}
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
