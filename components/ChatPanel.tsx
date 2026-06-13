"use client";

import { useEffect, useRef, useState } from "react";
import { PROCEDURES, matchProcedureOrOptions, matchProcedureFromFilename, ProcedureOption } from "@/lib/procedures";

interface Message {
  role: "user" | "ai";
  text: string;
  imagePreview?: string;
  options?: { id: string; label: string }[]; // disambiguation chips
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

interface Props {
  procedureId: string;
  onProcedureChange: (id: string) => void;
}

const CHIPS = [
  "MRI Scan", "Blood Test", "CT Scan", "X-Ray",
  "Ultrasound", "ECG", "Colonoscopy", "Mammogram", "Echocardiogram",
];

const SESSIONS_KEY = "hl-sessions";
const ACTIVE_KEY   = "hl-active-id";

const WELCOME: Message = {
  role: "ai",
  text: "Tell me what test your doctor ordered and I'll find the best price near you. Type it, tap a quick option below, or use voice.",
};

function makeId() {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (raw) return JSON.parse(raw) as ChatSession[];
  } catch { /* ignore */ }
  return [];
}

function saveSessions(s: ChatSession[]) {
  try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

function sessionTitle(msgs: Message[]): string {
  const first = msgs.find((m) => m.role === "user");
  if (!first) return "New Chat";
  return first.text.length > 42 ? first.text.slice(0, 42) + "…" : first.text;
}

function relTime(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ChatPanel({ procedureId, onProcedureChange }: Props) {
  const currentProc = PROCEDURES.find((p) => p.id === procedureId);

  // Start with WELCOME — load localStorage in useEffect to avoid SSR hydration mismatch
  const [messages,     setMessages]     = useState<Message[]>([WELCOME]);
  const [sessionId,    setSessionId]    = useState<string>("");
  const [sessions,     setSessions]     = useState<ChatSession[]>([]);
  const [showHistory,  setShowHistory]  = useState(false);
  const [inputText,    setInputText]    = useState("");
  const [isTyping,     setIsTyping]     = useState(false);
  const [isListening,  setIsListening]  = useState(false);
  const [mounted,      setMounted]      = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  // Load or create the active session after mount
  useEffect(() => {
    setMounted(true);
    const all      = loadSessions();
    const activeId = localStorage.getItem(ACTIVE_KEY);
    const active   = all.find((s) => s.id === activeId);

    if (active) {
      setSessions(all);
      setSessionId(active.id);
      setMessages(active.messages);
    } else {
      const id   = makeId();
      const newS: ChatSession = { id, title: "New Chat", messages: [WELCOME], timestamp: Date.now() };
      const updated = [newS, ...all];
      saveSessions(updated);
      localStorage.setItem(ACTIVE_KEY, id);
      setSessions(updated);
      setSessionId(id);
      setMessages([WELCOME]);
    }
  }, []);

  // Persist messages whenever they change
  useEffect(() => {
    if (!mounted || !sessionId) return;
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === sessionId
          ? { ...s, messages, title: sessionTitle(messages), timestamp: Date.now() }
          : s
      );
      saveSessions(updated);
      return updated;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, mounted, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const startNewChat = () => {
    const id   = makeId();
    const newS: ChatSession = { id, title: "New Chat", messages: [WELCOME], timestamp: Date.now() };
    setSessions((prev) => {
      const updated = [newS, ...prev];
      saveSessions(updated);
      return updated;
    });
    localStorage.setItem(ACTIVE_KEY, id);
    setSessionId(id);
    setMessages([WELCOME]);
    setShowHistory(false);
    onProcedureChange("");
  };

  const switchSession = (s: ChatSession) => {
    localStorage.setItem(ACTIVE_KEY, s.id);
    setSessionId(s.id);
    setMessages(s.messages);
    setShowHistory(false);
  };

  const addAiMsg = (text: string, options?: { id: string; label: string }[]) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: "ai", text, options }]);
    }, 480);
  };

  const selectProcedure = (proc: ProcedureOption) => {
    onProcedureChange(proc.id);
    setMessages((prev) => [...prev, { role: "user", text: proc.label }]);
    addAiMsg(
      `Showing hospitals for ${proc.label} (CPT ${proc.cptCode}). Click any pin on the map to see your exact out-of-pocket cost.`
    );
  };

  const respond = (userText: string) => {
    const result = matchProcedureOrOptions(userText);
    if (result.type === "single") {
      onProcedureChange(result.match.id);
      addAiMsg(
        `Showing hospitals for ${result.match.label} (CPT ${result.match.cptCode}). Click any pin on the map to see your exact out-of-pocket cost.`
      );
    } else if (result.type === "multiple") {
      addAiMsg(
        `I found ${result.options.length} types of ${result.category}. Which one do you need?`,
        result.options.map((o) => ({ id: o.id, label: o.label.split("–")[1]?.trim() ?? o.label }))
      );
    } else {
      addAiMsg(
        `I couldn't find "${userText}". Try one of these:\n${PROCEDURES.slice(0, 8)
          .map((p) => `• ${p.label}`)
          .join("\n")}`
      );
    }
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInputText("");
    respond(text);
  };

  const handleChip = (chip: string) => {
    setMessages((prev) => [...prev, { role: "user", text: chip }]);
    respond(chip);
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const preview = ev.target?.result as string;
      setMessages((prev) => [
        ...prev,
        { role: "user", text: `📎 ${file.name}`, imagePreview: preview },
      ]);
      const matched = matchProcedureFromFilename(file.name);
      if (matched) {
        onProcedureChange(matched.id);
        addAiMsg(`Detected ${matched.label} from your document. The map has been updated — click any pin to see your cost.`);
      } else {
        addAiMsg("I received your document. What test is this for? Type the name or tap a chip below.");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      addAiMsg("Voice input isn't supported in this browser. Please use Chrome or type your request.");
      return;
    }
    if (isListening) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new SR() as any;
    rec.lang = "en-US";
    rec.interimResults = false;
    setIsListening(true);
    rec.start();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (ev: any) => { setInputText(ev.results[0][0].transcript); setIsListening(false); };
    rec.onerror  = () => setIsListening(false);
    rec.onend    = () => setIsListening(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff", position: "relative", overflow: "hidden" }}>

      {/* ── Header ── */}
      <div style={{
        flexShrink: 0, padding: "12px 16px",
        background: "#fff", borderBottom: "1px solid #e5e7eb",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        {/* HL avatar — click to toggle history */}
        <button
          onClick={() => setShowHistory((h) => !h)}
          title="Chat history"
          style={{
            width: 34, height: 34, borderRadius: "50%",
            background: showHistory ? "#15803d" : "#16a34a",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0,
            border: "none", cursor: "pointer",
            boxShadow: showHistory ? "0 0 0 3px #bbf7d0" : "none",
            transition: "box-shadow 0.15s",
          }}
        >
          HL
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>
            HealthLedger Assistant
          </p>
          {currentProc && (
            <p style={{ margin: 0, fontSize: 12, color: "#16a34a" }}>
              Showing: {currentProc.label}
            </p>
          )}
        </div>
        <button
          onClick={startNewChat}
          title="Start a new chat"
          style={{
            padding: "5px 12px", borderRadius: 20,
            border: "1.5px solid #bbf7d0", background: "#f0fdf4",
            color: "#15803d", fontSize: 12, fontWeight: 600,
            cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
          }}
        >
          + New
        </button>
      </div>

      {/* ── Chat History Overlay ── */}
      {showHistory && (
        <div style={{
          position: "absolute", top: 57, left: 0, right: 0, bottom: 0,
          background: "#fff", zIndex: 20,
          display: "flex", flexDirection: "column",
        }}>
          {/* History header */}
          <div style={{
            padding: "14px 16px 10px", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid #f3f4f6",
          }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Chat History</span>
            <button
              onClick={() => setShowHistory(false)}
              style={{
                border: "none", background: "#f3f4f6",
                borderRadius: 8, width: 30, height: 30,
                cursor: "pointer", fontSize: 14, color: "#6b7280",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>

          {/* New chat button */}
          <div style={{ padding: "12px 16px 8px", flexShrink: 0 }}>
            <button
              onClick={startNewChat}
              style={{
                width: "100%", padding: "11px 0",
                borderRadius: 10, border: "none",
                background: "#16a34a", color: "#fff",
                fontWeight: 700, fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Chat
            </button>
          </div>

          {/* Session list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 12px 16px" }}>
            {sessions.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: 24 }}>
                No chats yet
              </p>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => switchSession(s)}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "10px 14px", borderRadius: 10,
                    border: `1.5px solid ${s.id === sessionId ? "#bbf7d0" : "#f3f4f6"}`,
                    background: s.id === sessionId ? "#f0fdf4" : "#fff",
                    marginBottom: 6, cursor: "pointer", display: "block",
                  }}
                >
                  <p style={{
                    margin: "0 0 3px", fontSize: 13, fontWeight: 600,
                    color: "#111827", overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {s.title}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
                    {relTime(s.timestamp)}
                    {s.messages.length > 1 && ` · ${s.messages.length - 1} message${s.messages.length !== 2 ? "s" : ""}`}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              alignItems: "flex-end",
              gap: 8, marginBottom: 12,
            }}
          >
            {msg.role === "ai" && (
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "#16a34a",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>
                HL
              </div>
            )}
            <div style={{
              maxWidth: "80%", padding: "10px 14px",
              borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: msg.role === "user" ? "#16a34a" : "#f0fdf4",
              color: msg.role === "user" ? "#fff" : "#111827",
              fontSize: 14, lineHeight: 1.55,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {msg.imagePreview && (
                <img
                  src={msg.imagePreview} alt="uploaded"
                  style={{ maxWidth: "100%", maxHeight: 70, borderRadius: 8, display: "block", marginBottom: 6 }}
                />
              )}
              {msg.text}
              {/* Disambiguation option chips */}
              {msg.options && msg.options.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {msg.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        const proc = PROCEDURES.find((p) => p.id === opt.id);
                        if (proc) selectProcedure(proc);
                      }}
                      style={{
                        textAlign: "left", padding: "8px 12px",
                        borderRadius: 10, border: "1.5px solid #bbf7d0",
                        background: "#fff", color: "#15803d",
                        fontSize: 13, fontWeight: 600,
                        cursor: "pointer", lineHeight: 1.3,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", background: "#16a34a",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              HL
            </div>
            <div style={{
              padding: "10px 14px", borderRadius: "14px 14px 14px 4px",
              background: "#f0fdf4", display: "flex", gap: 4, alignItems: "center",
            }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{
                  width: 7, height: 7, borderRadius: "50%", background: "#86efac",
                  display: "block",
                  animation: `dotBounce 1s ease-in-out ${i * 0.18}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <div style={{
        flexShrink: 0, borderTop: "1px solid #e5e7eb",
        background: "#fff", padding: "10px 14px 14px",
      }}>
        <div className="no-scrollbar" style={{
          display: "flex", gap: 6, overflowX: "auto",
          paddingBottom: 10, marginBottom: 4,
        }}>
          {CHIPS.map((chip) => (
            <button key={chip} onClick={() => handleChip(chip)} style={{
              flexShrink: 0, padding: "5px 12px", borderRadius: 20,
              border: "1.5px solid #bbf7d0", background: "#f0fdf4",
              color: "#15803d", fontSize: 12, fontWeight: 500,
              cursor: "pointer", whiteSpace: "nowrap",
            }}>
              {chip}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => fileRef.current?.click()} title="Upload a medical document" style={{
            width: 36, height: 36, borderRadius: 9,
            border: "1.5px solid #e5e7eb", background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 16, color: "#6b7280", flexShrink: 0,
          }}>
            📎
          </button>
          <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={handleImage} />

          <button onClick={handleVoice} title="Voice input" style={{
            width: 36, height: 36, borderRadius: 9,
            border: `1.5px solid ${isListening ? "#dc2626" : "#e5e7eb"}`,
            background: isListening ? "#fee2e2" : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 16, flexShrink: 0,
          }}>
            {isListening ? "⏹" : "🎤"}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a test name (e.g. MRI, blood test…)"
            style={{
              flex: 1, height: 36,
              border: "1.5px solid #e5e7eb", borderRadius: 9,
              padding: "0 12px", fontSize: 14, fontFamily: "inherit",
              color: "#111827", background: "#f9fafb", outline: "none", minWidth: 0,
            }}
            onFocus={(e) => { e.target.style.borderColor = "#16a34a"; e.target.style.background = "#fff"; }}
            onBlur={(e)  => { e.target.style.borderColor = "#e5e7eb"; e.target.style.background = "#f9fafb"; }}
          />

          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            style={{
              width: 36, height: 36, borderRadius: 9, border: "none",
              background: inputText.trim() ? "#16a34a" : "#e5e7eb",
              cursor: inputText.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke={inputText.trim() ? "#fff" : "#9ca3af"}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        {isListening && (
          <p style={{ textAlign: "center", fontSize: 12, color: "#dc2626", marginTop: 6, marginBottom: 0 }}>
            Listening… speak now
          </p>
        )}
      </div>
    </div>
  );
}
