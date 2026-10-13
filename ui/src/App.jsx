import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { runLater, extractDashboard } from "./laterClient";

const Icon = ({ name, ...p }) => <span className="material-symbols-rounded" {...p}>{name}</span>;

const TEAM = [
  { key: "QuickWins", name: "Quick Wins", icon: "bolt" },
  { key: "Learn", name: "Learn", icon: "school" },
  { key: "Body", name: "Body", icon: "fitness_center" },
  { key: "Admin", name: "Life Admin", icon: "inbox" },
  { key: "Composer", name: "The Coach", icon: "dashboard" },
];
const ENERGY = [
  { v: "low", icon: "battery_low", label: "Low" },
  { v: "medium", icon: "battery_horiz_050", label: "Medium" },
  { v: "high", icon: "bolt", label: "High" },
];
const SAMPLES = ["writing my quarterly report", "my tax return", "studying for the exam", "replying to 40 emails", "the big presentation"];

export default function App() {
  const [task, setTask] = useState("");
  const [minutes, setMinutes] = useState(25);
  const [energy, setEnergy] = useState("medium");
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState({});
  const [dash, setDash] = useState(null);
  const [done, setDone] = useState({});
  const [err, setErr] = useState(null);

  async function go(q) {
    const t = (q ?? task).trim();
    if (!t || running) return;
    setRunning(true); setErr(null); setMessages([]); setDash(null); setDone({});
    setStatus({ QuickWins: "on", Learn: "on", Body: "on", Admin: "on" });
    const msg = `Task I'm avoiding: ${t}. Time available: ${minutes} minutes. Energy level: ${energy}.`;
    try {
      await runLater(msg, {
        onEvent: (ev) => {
          const { author, text } = ev;
          setStatus((p) => {
            const n = { ...p, [author]: "done" };
            if (author !== "Composer" && !n.Composer) n.Composer = "on";
            return n;
          });
          if (author === "Composer") {
            const d = extractDashboard(text);
            if (d) setDash(d);
          } else if (text) {
            setMessages((m) => [...m, { id: m.length + author, author, text }]);
          }
        },
      });
    } catch (e) { setErr(e.message || "Something broke — try again."); }
    finally { setRunning(false); }
  }

  const totals = useMemo(() => {
    const ts = dash?.tasks || [];
    return {
      n: ts.length,
      min: ts.reduce((s, t) => s + (+t.minutes || 0), 0),
      worth: ts.length ? (ts.reduce((s, t) => s + (+t.worth || 0), 0) / ts.length).toFixed(1) : "—",
    };
  }, [dash]);

  return (
    <>
      <div className="bg-fx" />
      <header className="topbar"><div className="shell topbar-in">
        <div className="brand"><span className="m"><Icon name="schedule" /></span> Later<span style={{ opacity: .4 }}>.</span></div>
        <span className="tagtop">Built with Google Antigravity</span>
      </div></header>

      <main className="shell">
        <section className="hero">
          <div className="eyebrow">The Productive Procrastination Assistant</div>
          <h1>Don't want to do it?<br /><span className="o">Do something useful instead.</span></h1>
          <p className="sub">Tell Later the task you're avoiding. A team of agents brainstorms genuinely productive detours — and builds you a dashboard you'll actually enjoy doing. Structured procrastination, automated.</p>
        </section>

        <div className="card pad panel">
          <div className="field"><label>What are you avoiding?</label>
            <input className="input" placeholder="e.g. writing my quarterly report"
              value={task} onChange={(e) => setTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} />
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <span className="faint" style={{ fontSize: ".82rem", color: "var(--faint)" }}>Or:</span>
            {SAMPLES.map((s) => <button key={s} className="chip" disabled={running} onClick={() => { setTask(s); }}>{s}</button>)}
          </div>
          <div className="row" style={{ marginTop: 20, alignItems: "flex-end", gap: 24 }}>
            <div className="field" style={{ flex: 1, minWidth: 220 }}>
              <label>Time I'm willing to "waste" · {minutes} min</label>
              <input className="range" type="range" min="5" max="120" step="5" value={minutes} onChange={(e) => setMinutes(+e.target.value)} />
            </div>
            <div className="field">
              <label>Energy</label>
              <div className="row">
                {ENERGY.map((e) => <button key={e.v} className={"chip" + (energy === e.v ? " on" : "")} onClick={() => setEnergy(e.v)}><Icon name={e.icon} />{e.label}</button>)}
              </div>
            </div>
          </div>
          <div className="row" style={{ marginTop: 22 }}>
            <motion.button className="btn" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} disabled={running} onClick={() => go()}>
              <Icon name={running ? "autorenew" : "auto_awesome"} /> {running ? "Brainstorming…" : "Help me procrastinate"}
            </motion.button>
            {dash && !running && <button className="chip" onClick={() => go()}><Icon name="refresh" /> Re-roll</button>}
          </div>
        </div>

        {(running || messages.length > 0 || dash) && (
          <div className="card pad panel">
            <div className="eyebrow" style={{ marginBottom: 12 }}>The agent team</div>
            <div className="team">
              {TEAM.map((a) => {
                const st = status[a.key] || "idle";
                return (
                  <div key={a.key} className={"agent " + st}>
                    <span className="ic"><Icon name={a.icon} /></span>
                    <div><div className="nm">{a.name}</div><div className="st">{st === "on" ? "working…" : st === "done" ? "done" : "idle"}</div></div>
                    {st === "on" && <span className="blip" />}
                  </div>
                );
              })}
            </div>
            {err && <p className="err" style={{ marginTop: 14 }}>⚠ {err}</p>}
          </div>
        )}

        {/* live stream before the dashboard lands */}
        {!dash && messages.length > 0 && (
          <div className="card pad panel stream">
            {messages.map((m) => {
              const a = TEAM.find((x) => x.key === m.author) || { name: m.author, icon: "psychology" };
              return (
                <motion.div key={m.id} className="line" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <span className="ic" style={{ width: 28, height: 28, borderRadius: 8, background: "#fff", color: "#000", display: "grid", placeItems: "center" }}><Icon name={a.icon} style={{ fontSize: 16 }} /></span>
                  <div><div className="who">{a.name}</div><div className="bd">{m.text}</div></div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* the dashboard */}
        <AnimatePresence>
          {dash && (
            <motion.div className="panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              {dash.pep && <div className="card pad"><div className="row" style={{ alignItems: "flex-start", gap: 14 }}><span className="ic" style={{ width: 40, height: 40, borderRadius: 11, background: "#fff", color: "#000", display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name="emoji_objects" /></span><p className="pep">{dash.pep}</p></div></div>}
              <div className="stats">
                <div className="card pad stat"><div className="n">{totals.n}</div><div className="l">Useful detours</div></div>
                <div className="card pad stat"><div className="n">{totals.min}<span style={{ fontSize: ".9rem", color: "var(--faint)" }}>m</span></div><div className="l">Total time</div></div>
                <div className="card pad stat"><div className="n">{totals.worth}<span style={{ fontSize: ".9rem", color: "var(--faint)" }}>/5</span></div><div className="l">Avg worth-it</div></div>
              </div>
              <div className="grid">
                {(dash.tasks || []).map((t, i) => (
                  <motion.div key={i} className="task" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}>
                    <div className="top">
                      <span className="ic"><Icon name={t.icon || "task_alt"} /></span>
                      <span className="cat">{t.category}</span>
                    </div>
                    <h3>{t.title}</h3>
                    <div className="why">{t.why}</div>
                    <div className="meta">
                      <span className="min"><Icon name="timer" />{t.minutes} min</span>
                      <span className="stars" title={`worth ${t.worth}/5`}>{"★".repeat(Math.max(0, Math.min(5, +t.worth || 0)))}<span style={{ color: "var(--faint)" }}>{"★".repeat(5 - Math.max(0, Math.min(5, +t.worth || 0)))}</span></span>
                    </div>
                    {done[i] && <div className="check">✓ dodged productively</div>}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="shell">Later · structured procrastination, automated · Built with Google Antigravity + ADK · Gemini on Vertex AI · Cloud Run</footer>
    </>
  );
}
