import { useState, useEffect, useRef, useCallback } from "react";

const FONTS_LINK = "https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Indie+Flower&display=swap";

// --- Color Palette ---
const palette = {
  wall: "#d4a574",
  wallDark: "#b8895a",
  cork: "#c4956a",
  corkLight: "#dbb896",
  cream: "#faf3e8",
  espresso: "#3e2723",
  amber: "#d4890e",
  warmBrown: "#6d4c2a",
  softWhite: "#fef9f0",
  pin: "#c0392b",
  pinAlt: "#2980b9",
  pinGreen: "#27ae60",
  pinYellow: "#f1c40f",
  tape: "rgba(255, 245, 220, 0.6)",
  shadow: "rgba(62, 39, 35, 0.25)",
};

// --- Ambient Sound Synth (Web Audio API oscillators for cozy vibes) ---
function createAmbientEngine() {
  let ctx = null;
  const active = {};

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function startRain() {
    const c = getCtx();
    const bufferSize = 2 * c.sampleRate;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;
    const gain = c.createGain();
    gain.gain.value = 0.15;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    noise.start();
    active.rain = { noise, gain, filter };
  }

  function startCafe() {
    const c = getCtx();
    const bufferSize = 2 * c.sampleRate;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 600;
    bp.Q.value = 0.5;
    const gain = c.createGain();
    gain.gain.value = 0.08;
    noise.connect(bp);
    bp.connect(gain);
    gain.connect(c.destination);
    noise.start();
    active.cafe = { noise, gain };
  }

  function startFireplace() {
    const c = getCtx();
    const bufferSize = 2 * c.sampleRate;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (0.5 + 0.5 * Math.sin(i / 1000));
    }
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    const gain = c.createGain();
    gain.gain.value = 0.12;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    noise.start();
    active.fireplace = { noise, gain, filter };
  }

  function startLofi() {
    const c = getCtx();
    const osc1 = c.createOscillator();
    const osc2 = c.createOscillator();
    osc1.type = "sine";
    osc2.type = "triangle";
    osc1.frequency.value = 220;
    osc2.frequency.value = 330;
    const gain = c.createGain();
    gain.gain.value = 0.04;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500;
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(filter);
    filter.connect(c.destination);
    osc1.start();
    osc2.start();
    // Gentle frequency drift
    const interval = setInterval(() => {
      const base = 220 + Math.sin(Date.now() / 4000) * 30;
      osc1.frequency.setTargetAtTime(base, c.currentTime, 0.5);
      osc2.frequency.setTargetAtTime(base * 1.5, c.currentTime, 0.5);
    }, 500);
    active.lofi = { osc1, osc2, gain, filter, interval };
  }

  function stop(key) {
    if (!active[key]) return;
    const nodes = active[key];
    if (nodes.interval) clearInterval(nodes.interval);
    Object.values(nodes).forEach((n) => {
      if (n && typeof n.stop === "function") try { n.stop(); } catch (_) {}
      if (n && typeof n.disconnect === "function") try { n.disconnect(); } catch (_) {}
    });
    delete active[key];
  }

  return {
    toggle(key) {
      if (active[key]) { stop(key); return false; }
      if (key === "rain") startRain();
      if (key === "cafe") startCafe();
      if (key === "fireplace") startFireplace();
      if (key === "lofi") startLofi();
      return true;
    },
    isPlaying(key) { return !!active[key]; },
    stopAll() { Object.keys(active).forEach(stop); },
  };
}

// --- Pin Component ---
function PushPin({ color = palette.pin, style = {} }) {
  return (
    <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", zIndex: 2, ...style }}>
      <svg width="22" height="28" viewBox="0 0 22 28">
        <circle cx="11" cy="9" r="8" fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        <circle cx="9" cy="7" r="2.5" fill="rgba(255,255,255,0.35)" />
        <line x1="11" y1="17" x2="11" y2="27" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// --- Polaroid Card ---
const cardPositions = [
  { top: "6%", left: "8%", rotate: -4 },
  { top: "8%", left: "55%", rotate: 3 },
  { top: "52%", left: "12%", rotate: -2 },
  { top: "50%", left: "58%", rotate: 5 },
];

const pinColors = [palette.pin, palette.pinAlt, palette.pinGreen, palette.pinYellow];

const cardLabels = ["About Me", "Projects", "Study Corner", "Find Me"];
const cardEmojis = ["✍️", "💼", "📚", "☕"];
const cardSubtitles = [
  "hello, nice to meet you!",
  "things i've built",
  "let's get cozy & focus",
  "say hi!",
];

function PolaroidCard({ index, label, emoji, subtitle, onClick, isAnyOpen }) {
  const [hovered, setHovered] = useState(false);
  const pos = cardPositions[index];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        width: "min(35%, 280px)",
        cursor: "pointer",
        transform: `rotate(${pos.rotate}deg) scale(${hovered ? 1.06 : 1})`,
        transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease",
        zIndex: hovered ? 10 : 1,
        opacity: isAnyOpen ? 0.3 : 1,
        pointerEvents: isAnyOpen ? "none" : "auto",
      }}
    >
      <div
        style={{
          background: palette.softWhite,
          borderRadius: 6,
          padding: "12px 12px 20px",
          boxShadow: hovered
            ? `0 12px 35px ${palette.shadow}, 0 4px 12px rgba(0,0,0,0.1)`
            : `0 4px 15px ${palette.shadow}`,
          position: "relative",
        }}
      >
        <PushPin color={pinColors[index]} />
        <div
          style={{
            background: `linear-gradient(135deg, ${palette.corkLight}, ${palette.cork})`,
            borderRadius: 4,
            height: "min(28vw, 180px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            marginTop: 8,
          }}
        >
          <span style={{ fontSize: "clamp(28px, 5vw, 48px)" }}>{emoji}</span>
          <span
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: "clamp(14px, 3vw, 22px)",
              color: palette.espresso,
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            {label}
          </span>
        </div>
        <p
          style={{
            fontFamily: "'Indie Flower', cursive",
            fontSize: "clamp(11px, 2vw, 15px)",
            color: palette.warmBrown,
            textAlign: "center",
            margin: "10px 0 0",
            lineHeight: 1.3,
          }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}

// --- Modal Overlay ---
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(30, 18, 10, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        animation: "fadeIn 0.3s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: palette.softWhite,
          borderRadius: 12,
          width: "min(92vw, 800px)",
          maxHeight: "88vh",
          overflow: "auto",
          boxShadow: `0 20px 60px rgba(30,18,10,0.4)`,
          animation: "scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            background: palette.softWhite,
            borderBottom: `2px solid ${palette.corkLight}`,
            padding: "18px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 2,
            borderRadius: "12px 12px 0 0",
          }}
        >
          <h2
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: "clamp(22px, 4vw, 32px)",
              color: palette.espresso,
              margin: 0,
              fontWeight: 700,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: palette.corkLight,
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              cursor: "pointer",
              fontSize: 18,
              color: palette.espresso,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.background = palette.cork)}
            onMouseLeave={(e) => (e.target.style.background = palette.corkLight)}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "24px" }}>{children}</div>
      </div>
    </div>
  );
}

// --- About Me Section ---
function AboutMe() {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${palette.corkLight}, ${palette.amber})`,
          margin: "0 auto 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 48,
          boxShadow: `0 4px 15px ${palette.shadow}`,
        }}
      >
        🧑‍💻
      </div>
      <h3
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 28,
          color: palette.espresso,
          margin: "0 0 6px",
        }}
      >
        Your Name Here
      </h3>
      <p
        style={{
          fontFamily: "'Indie Flower', cursive",
          color: palette.warmBrown,
          fontSize: 16,
          margin: "0 0 20px",
        }}
      >
        developer · learner · coffee enthusiast
      </p>
      <div
        style={{
          background: `linear-gradient(135deg, ${palette.cream}, ${palette.softWhite})`,
          borderRadius: 10,
          padding: 24,
          textAlign: "left",
          border: `2px dashed ${palette.corkLight}`,
          maxWidth: 500,
          margin: "0 auto",
        }}
      >
        <p
          style={{
            fontFamily: "'Lora', serif",
            fontSize: 15,
            color: palette.espresso,
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          Hey there! 👋 Welcome to my little corner of the internet. I'm a passionate
          developer who loves building things that matter. When I'm not coding, you'll
          find me at a coffee shop with my nose in a book, or figuring out how to make
          the perfect pour-over.
          <br /><br />
          This website is my cozy digital space — part portfolio, part study nook, and
          entirely me. Feel free to look around!
        </p>
      </div>
    </div>
  );
}

// --- Projects Section ---
const projects = [
  {
    title: "Coffee Tracker App",
    desc: "A cozy app to track your daily brews, favorite beans, and caffeine intake.",
    tags: ["React", "Firebase", "Tailwind"],
    link: "#",
  },
  {
    title: "Study Buddy Bot",
    desc: "An AI-powered study companion that helps with flashcards and spaced repetition.",
    tags: ["Python", "OpenAI", "Flask"],
    link: "#",
  },
  {
    title: "Portfolio v2",
    desc: "This very website! A corkboard-themed personal site built with love.",
    tags: ["React", "CSS", "Web Audio"],
    link: "#",
  },
  {
    title: "Lo-fi Generator",
    desc: "Procedurally generated lo-fi beats using the Web Audio API.",
    tags: ["JavaScript", "Web Audio", "SVG"],
    link: "#",
  },
];

function Projects() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
      {projects.map((p, i) => (
        <div
          key={i}
          style={{
            background: palette.cream,
            borderRadius: 10,
            padding: 18,
            border: `2px solid ${palette.corkLight}`,
            transition: "transform 0.2s, box-shadow 0.2s",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = `0 6px 20px ${palette.shadow}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <h4
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 20,
              color: palette.espresso,
              margin: "0 0 8px",
            }}
          >
            {p.title}
          </h4>
          <p
            style={{
              fontFamily: "'Lora', serif",
              fontSize: 13,
              color: palette.warmBrown,
              lineHeight: 1.6,
              margin: "0 0 12px",
            }}
          >
            {p.desc}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {p.tags.map((t) => (
              <span
                key={t}
                style={{
                  background: palette.corkLight,
                  color: palette.espresso,
                  fontFamily: "'Indie Flower', cursive",
                  fontSize: 12,
                  padding: "3px 10px",
                  borderRadius: 20,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Study Corner ---
function StudyCorner() {
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const intervalRef = useRef(null);

  const [todos, setTodos] = useState([
    { id: 1, text: "Review chapter 3 notes", done: false },
    { id: 2, text: "Practice coding problems", done: true },
  ]);
  const [newTodo, setNewTodo] = useState("");

  const [notes, setNotes] = useState("Start jotting down your thoughts here...");

  const [sounds, setSounds] = useState({ rain: false, cafe: false, fireplace: false, lofi: false });
  const ambientRef = useRef(null);

  useEffect(() => {
    ambientRef.current = createAmbientEngine();
    return () => ambientRef.current?.stopAll();
  }, []);

  useEffect(() => {
    if (isRunning && pomodoroTime > 0) {
      intervalRef.current = setInterval(() => setPomodoroTime((t) => t - 1), 1000);
    } else if (pomodoroTime === 0) {
      setIsRunning(false);
      if (!isBreak) {
        setIsBreak(true);
        setPomodoroTime(5 * 60);
      } else {
        setIsBreak(false);
        setPomodoroTime(25 * 60);
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, pomodoroTime, isBreak]);

  const totalTime = isBreak ? 5 * 60 : 25 * 60;
  const progress = ((totalTime - pomodoroTime) / totalTime) * 100;
  const minutes = Math.floor(pomodoroTime / 60);
  const seconds = pomodoroTime % 60;

  const toggleSound = (key) => {
    const playing = ambientRef.current?.toggle(key);
    setSounds((s) => ({ ...s, [key]: playing }));
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodos((t) => [...t, { id: Date.now(), text: newTodo, done: false }]);
    setNewTodo("");
  };

  const sectionStyle = {
    background: palette.cream,
    borderRadius: 10,
    padding: 18,
    border: `2px solid ${palette.corkLight}`,
  };

  const labelStyle = {
    fontFamily: "'Caveat', cursive",
    fontSize: 20,
    color: palette.espresso,
    margin: "0 0 12px",
    fontWeight: 700,
  };

  const soundIcons = { rain: "🌧️", cafe: "☕", fireplace: "🔥", lofi: "🎵" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
      {/* Pomodoro */}
      <div style={sectionStyle}>
        <h4 style={labelStyle}>🍅 Pomodoro Timer</h4>
        <div style={{ textAlign: "center" }}>
          <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 14px" }}>
            <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="70" cy="70" r="60" fill="none" stroke={palette.corkLight} strokeWidth="8" />
              <circle
                cx="70" cy="70" r="60" fill="none"
                stroke={isBreak ? palette.pinGreen : palette.amber}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - progress / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 32,
                  color: palette.espresso,
                  fontWeight: 700,
                }}
              >
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
              <span
                style={{
                  fontFamily: "'Indie Flower', cursive",
                  fontSize: 13,
                  color: palette.warmBrown,
                }}
              >
                {isBreak ? "break time ☕" : "focus time"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {[
              { label: isRunning ? "Pause" : "Start", action: () => setIsRunning(!isRunning) },
              {
                label: "Reset",
                action: () => { setIsRunning(false); setIsBreak(false); setPomodoroTime(25 * 60); },
              },
            ].map((b) => (
              <button
                key={b.label}
                onClick={b.action}
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 16,
                  padding: "6px 18px",
                  borderRadius: 20,
                  border: `2px solid ${palette.cork}`,
                  background: palette.softWhite,
                  color: palette.espresso,
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.background = palette.corkLight)}
                onMouseLeave={(e) => (e.target.style.background = palette.softWhite)}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* To-Do */}
      <div style={sectionStyle}>
        <h4 style={labelStyle}>✅ To-Do List</h4>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="Add a task..."
            style={{
              flex: 1,
              fontFamily: "'Lora', serif",
              fontSize: 14,
              padding: "8px 12px",
              borderRadius: 8,
              border: `2px solid ${palette.corkLight}`,
              background: palette.softWhite,
              color: palette.espresso,
              outline: "none",
            }}
          />
          <button
            onClick={addTodo}
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 18,
              padding: "6px 14px",
              borderRadius: 8,
              border: `2px solid ${palette.cork}`,
              background: palette.amber,
              color: palette.softWhite,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            +
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
          {todos.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 10px",
                borderRadius: 8,
                background: t.done ? "rgba(39,174,96,0.08)" : "transparent",
                transition: "background 0.2s",
              }}
            >
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => setTodos((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                style={{ accentColor: palette.amber, width: 18, height: 18, cursor: "pointer" }}
              />
              <span
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: 14,
                  color: palette.espresso,
                  textDecoration: t.done ? "line-through" : "none",
                  opacity: t.done ? 0.5 : 1,
                  flex: 1,
                }}
              >
                {t.text}
              </span>
              <button
                onClick={() => setTodos((ts) => ts.filter((x) => x.id !== t.id))}
                style={{
                  background: "none",
                  border: "none",
                  color: palette.pin,
                  cursor: "pointer",
                  fontSize: 16,
                  padding: 2,
                  opacity: 0.5,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.opacity = 1)}
                onMouseLeave={(e) => (e.target.style.opacity = 0.5)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={sectionStyle}>
        <h4 style={labelStyle}>📝 Notes & Journal</h4>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{
            width: "100%",
            minHeight: 180,
            fontFamily: "'Lora', serif",
            fontSize: 14,
            lineHeight: 1.7,
            color: palette.espresso,
            background: `repeating-linear-gradient(transparent, transparent 27px, ${palette.corkLight}44 28px)`,
            border: `2px solid ${palette.corkLight}`,
            borderRadius: 8,
            padding: "10px 12px",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Ambient Sounds */}
      <div style={sectionStyle}>
        <h4 style={labelStyle}>🎧 Ambient Sounds</h4>
        <p style={{ fontFamily: "'Indie Flower', cursive", fontSize: 13, color: palette.warmBrown, margin: "0 0 14px" }}>
          tap to toggle cozy vibes~
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {Object.entries(soundIcons).map(([key, icon]) => (
            <button
              key={key}
              onClick={() => toggleSound(key)}
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 16,
                padding: "12px 10px",
                borderRadius: 10,
                border: `2px solid ${sounds[key] ? palette.amber : palette.corkLight}`,
                background: sounds[key] ? `${palette.amber}22` : palette.softWhite,
                color: palette.espresso,
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 0.25s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 22 }}>{icon}</span>
              <span style={{ textTransform: "capitalize" }}>{key}</span>
              {sounds[key] && (
                <span style={{ fontSize: 10, animation: "pulse 1.5s infinite" }}>●</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Contact Section ---
function Contact() {
  const links = [
    { icon: "🐙", label: "GitHub", url: "https://github.com", color: "#333" },
    { icon: "💼", label: "LinkedIn", url: "https://linkedin.com", color: "#0077b5" },
    { icon: "📧", label: "Email", url: "mailto:hello@example.com", color: palette.pin },
    { icon: "🐦", label: "Twitter/X", url: "https://x.com", color: "#1da1f2" },
  ];

  return (
    <div style={{ textAlign: "center" }}>
      <p
        style={{
          fontFamily: "'Indie Flower', cursive",
          fontSize: 18,
          color: palette.warmBrown,
          marginBottom: 24,
        }}
      >
        Let's grab a coffee sometime! ☕
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
        {links.map((l) => (
          <a
            key={l.label}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: "none",
              background: palette.cream,
              border: `2px solid ${palette.corkLight}`,
              borderRadius: 10,
              padding: "16px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              transition: "transform 0.2s, box-shadow 0.2s",
              minWidth: 100,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px) rotate(-2deg)";
              e.currentTarget.style.boxShadow = `0 6px 20px ${palette.shadow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) rotate(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span style={{ fontSize: 32 }}>{l.icon}</span>
            <span
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 17,
                color: palette.espresso,
                fontWeight: 600,
              }}
            >
              {l.label}
            </span>
          </a>
        ))}
      </div>
      <div
        style={{
          marginTop: 30,
          padding: 20,
          background: `${palette.amber}15`,
          borderRadius: 10,
          border: `2px dashed ${palette.amber}`,
          maxWidth: 400,
          margin: "30px auto 0",
        }}
      >
        <p
          style={{
            fontFamily: "'Indie Flower', cursive",
            fontSize: 15,
            color: palette.warmBrown,
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          "The best ideas start over a good cup of coffee and an honest conversation."
          <br />— probably someone wise ☕✨
        </p>
      </div>
    </div>
  );
}

// --- Main App ---
export default function App() {
  const [openSection, setOpenSection] = useState(null);

  const sectionContent = {
    0: <AboutMe />,
    1: <Projects />,
    2: <StudyCorner />,
    3: <Contact />,
  };

  return (
    <>
      <link href={FONTS_LINK} rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.85) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: ${palette.cream}; border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: ${palette.corkLight}; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: ${palette.cork}; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(196, 149, 106, 0.3) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 30%, rgba(212, 137, 14, 0.15) 0%, transparent 50%),
            repeating-conic-gradient(${palette.wall}08 0% 25%, transparent 0% 50%) 0 0 / 60px 60px,
            linear-gradient(160deg, ${palette.wall}, ${palette.wallDark})
          `,
          position: "relative",
          padding: "20px",
        }}
      >
        {/* Title */}
        <div style={{ textAlign: "center", padding: "20px 0 10px", position: "relative", zIndex: 5 }}>
          <h1
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: "clamp(28px, 6vw, 48px)",
              color: palette.espresso,
              fontWeight: 700,
              textShadow: `1px 1px 0 ${palette.corkLight}`,
              margin: 0,
            }}
          >
            ☕ my cozy corner
          </h1>
          <p
            style={{
              fontFamily: "'Indie Flower', cursive",
              fontSize: "clamp(13px, 2.5vw, 17px)",
              color: palette.warmBrown,
              marginTop: 4,
            }}
          >
            pin a card to explore ~
          </p>
        </div>

        {/* Corkboard Area */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 900,
            margin: "10px auto",
            minHeight: "max(75vh, 500px)",
            background: `
              radial-gradient(circle at 30% 40%, rgba(219, 184, 150, 0.4) 0%, transparent 50%),
              radial-gradient(circle at 70% 60%, rgba(196, 149, 106, 0.3) 0%, transparent 50%),
              linear-gradient(135deg, #c9a06c, #b8895a, #c4956a)
            `,
            borderRadius: 16,
            boxShadow: `
              inset 0 2px 10px rgba(0,0,0,0.15),
              0 8px 30px rgba(30,18,10,0.3),
              0 0 0 6px ${palette.warmBrown}
            `,
            border: `3px solid ${palette.warmBrown}88`,
          }}
        >
          {/* Cork texture dots */}
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 2 + Math.random() * 3,
                height: 2 + Math.random() * 3,
                borderRadius: "50%",
                background: `rgba(139, 90, 43, ${0.1 + Math.random() * 0.15})`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Polaroid Cards */}
          {cardLabels.map((label, i) => (
            <PolaroidCard
              key={label}
              index={i}
              label={label}
              emoji={cardEmojis[i]}
              subtitle={cardSubtitles[i]}
              onClick={() => setOpenSection(i)}
              isAnyOpen={openSection !== null}
            />
          ))}

          {/* Decorative tape strips */}
          <div style={{ position: "absolute", top: "38%", right: "6%", width: 60, height: 18, background: palette.tape, transform: "rotate(25deg)", borderRadius: 3, opacity: 0.7, pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "15%", left: "45%", width: 50, height: 16, background: palette.tape, transform: "rotate(-15deg)", borderRadius: 3, opacity: 0.6, pointerEvents: "none" }} />

          {/* Small doodles */}
          <div style={{ position: "absolute", bottom: "8%", right: "8%", fontFamily: "'Indie Flower', cursive", fontSize: 13, color: `${palette.warmBrown}88`, transform: "rotate(3deg)", pointerEvents: "none" }}>
            ✨ dream big ✨
          </div>
          <div style={{ position: "absolute", top: "42%", left: "42%", fontFamily: "'Indie Flower', cursive", fontSize: 12, color: `${palette.warmBrown}66`, transform: "rotate(-5deg)", pointerEvents: "none" }}>
            ♪ ♫ ♪
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "20px 0 10px", marginTop: 10 }}>
          <p
            style={{
              fontFamily: "'Indie Flower', cursive",
              fontSize: 14,
              color: `${palette.warmBrown}cc`,
            }}
          >
            made with ☕ & love
          </p>
        </div>
      </div>

      {/* Modals */}
      {cardLabels.map((label, i) => (
        <Modal key={label} isOpen={openSection === i} onClose={() => setOpenSection(null)} title={`${cardEmojis[i]} ${label}`}>
          {sectionContent[i]}
        </Modal>
      ))}
    </>
  );
}
