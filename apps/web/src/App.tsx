import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
function getGuestId() {
  const key = "persona_demo_guest";
  let value = localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID() + crypto.randomUUID();
    localStorage.setItem(key, value);
  }
  return value;
}
const headers = () => ({ "x-demo-guest": getGuestId() });

type Persona = { _id?: string; personaId?: string; displayName: string; profile?: any };
type Message = { role: "user" | "assistant"; content: string };

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [speakers, setSpeakers] = useState<string[]>([]);
  const [target, setTarget] = useState("");
  const [consent, setConsent] = useState(false);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refreshPersonas() {
    try {
      const r = await fetch(`${API}/api/personas`, { headers: headers() });
      if (r.ok) setPersonas(await r.json());
    } catch { /* API may not be running yet */ }
  }
  useEffect(() => { void refreshPersonas(); }, []);

  async function analyze() {
    if (!file || !consent) return;
    setBusy(true); setError(""); setSpeakers([]); setTarget("");
    try {
      const form = new FormData();
      form.append("chatFile", file);
      form.append("consent", "true");
      // First pass discovers speakers locally in the browser; server validates them.
      const text = await file.text();
      const detected = [...new Set(text.split(/\r?\n/).map(line => {
        const m = line.match(/^\u200e?(?:\[\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm|AM|PM)?\]\s+|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm|AM|PM)?\s+-\s+)([^:]+):\s/);
        return m?.[1]?.trim();
      }).filter((x): x is string => Boolean(x)))];
      if (!detected.length) {
        setError("Participants couldn't be detected in this export. Try a standard WhatsApp TXT export.");
        return;
      }
      setSpeakers(detected);
      setTarget(detected[0]);
      setStatus("Choose the target participant, then click Analyze.");
    } catch { setError("Could not read the file."); }
    finally { setBusy(false); }
  }
  const [status, setStatus] = useState("");

  async function createPersona() {
    if (!file || !target || !consent) return;
    setBusy(true); setError(""); setStatus("");
    try {
      const form = new FormData();
      form.append("chatFile", file);
      form.append("targetSpeaker", target);
      form.append("consent", "true");
      const r = await fetch(`${API}/api/personas/analyze`, { method: "POST", headers: headers(), body: form });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Analysis failed");
      const p = { ...data.profile, _id: data.personaId };
      setPersona(p); setMessages([]);
      await refreshPersonas();
      setStatus("Persona created. This is an AI simulation, not the actual person.");
    } catch (e) { setError(e instanceof Error ? e.message : "Analysis failed"); }
    finally { setBusy(false); }
  }

  async function selectPersona(p: Persona) {
    const id = p._id || p.personaId;
    if (!id) return;
    setPersona(p); setError(""); setMessages([]);
    const r = await fetch(`${API}/api/chat/${id}/history`, { headers: headers() });
    if (r.ok) setMessages((await r.json()).map((m: any) => ({ role: m.role, content: m.content })));
  }

  async function send() {
    const text = input.trim();
    const id = persona?._id || persona?.personaId;
    if (!text || !id || busy) return;
    setInput(""); setBusy(true); setError("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    try {
      const r = await fetch(`${API}/api/chat/${id}`, {
        method: "POST", headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Chat failed");
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e) { setError(e instanceof Error ? e.message : "Chat failed"); }
    finally { setBusy(false); }
  }

  async function forget() {
    const id = persona?._id || persona?.personaId;
    if (!id || !confirm("Delete this persona and its saved chat history?")) return;
    const r = await fetch(`${API}/api/personas/${id}`, { method: "DELETE", headers: headers() });
    if (r.ok) {
      setPersona(null); setMessages([]); await refreshPersonas();
    } else setError("Could not delete persona.");
  }

  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="mark">P</span><div><strong>Persona</strong><small>Chat Studio</small></div></div>
      <button className="primary full" onClick={() => { setPersona(null); setMessages([]); setError(""); }}>+ New persona</button>
      <p className="eyebrow">SAVED PERSONAS</p>
      {personas.map(p => <button className={`persona-item ${(persona?._id || persona?.personaId) === p._id ? "selected" : ""}`} key={p._id} onClick={() => void selectPersona(p)}><span className="avatar">{p.displayName.slice(0,1).toUpperCase()}</span><span>{p.displayName}</span></button>)}
      <div className="privacy-note"><strong>Privacy first</strong><p>Uploaded TXT content is parsed in memory and not saved as a raw file by this starter.</p></div>
    </aside>
    <section className="main">
      <header><div><p className="eyebrow">PERSONALITY SIMULATION</p><h1>{persona?.displayName || "Build a conversation persona"}</h1></div><span className="status"><i /> AI simulation</span></header>
      {!persona ? <div className="setup">
        <div className="hero"><div className="hero-icon">✳</div><h2>Make conversations feel familiar.</h2><p>Upload a chat export, choose a speaker, and create a private AI simulation of their communication style.</p></div>
        <div className="panel">
          <label className="upload"><input type="file" accept=".txt,text/plain" onChange={e => { setFile(e.target.files?.[0] || null); setSpeakers([]); setStatus(""); }} /><span className="upload-icon">↑</span><strong>{file ? file.name : "Choose WhatsApp TXT export"}</strong><small>{file ? `${(file.size / 1024).toFixed(1)} KB` : "TXT only · Max 2 MB"}</small></label>
          <label className="check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /> I have permission to use this conversation and understand this creates an AI simulation, not the real person.</label>
          <button className="primary" disabled={!file || !consent || busy} onClick={() => void analyze()}>{busy ? "Reading file…" : "Read chat & detect participants"}</button>
          {speakers.length > 0 && <div className="target"><label>Whose style should the AI simulate?</label><select value={target} onChange={e => setTarget(e.target.value)}>{speakers.map(s => <option key={s}>{s}</option>)}</select><button className="primary" disabled={busy} onClick={() => void createPersona()}>{busy ? "Analyzing…" : "Analyze & create persona"}</button></div>}
          {status && <p className="success">{status}</p>}{error && <p className="error">{error}</p>}
        </div>
        <div className="three"><div><b>01</b><strong>Analyze style</strong><p>Language, tone, emojis and phrases.</p></div><div><b>02</b><strong>Keep context</strong><p>Saved conversation memory.</p></div><div><b>03</b><strong>Chat naturally</strong><p>Short, familiar replies.</p></div></div>
      </div> : <div className="chat-layout">
        <div className="chat-messages">{messages.length === 0 && <div className="empty"><div className="hero-icon">✳</div><h2>Say hello</h2><p>Your AI simulation is ready.</p></div>}
          {messages.map((m, i) => <div className={`message ${m.role}`} key={i}><small>{m.role === "user" ? "You" : `${persona.displayName} · AI simulation`}</small><p>{m.content}</p></div>)}
          {busy && <div className="typing">Thinking…</div>}
        </div>
        <div className="composer"><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} placeholder="Write a message… (Enter to send)" rows={2}/><button className="primary" disabled={busy || !input.trim()} onClick={() => void send()}>Send ↑</button></div>
        {error && <p className="error">{error}</p>}
        <div className="chat-actions"><span>AI simulation, not the actual person.</span><button className="danger" onClick={() => void forget()}>Delete persona & history</button></div>
      </div>}
    </section>
  </main>;
}
