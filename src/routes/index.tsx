import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Moon, Sun, Trash2, Plus, Bold, Italic, Underline, Strikethrough, Highlighter, Type } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/")({
  component: Index,
});

const DICE_VALUES = [4, 6, 10, 20] as const;
type DiceValue = (typeof DICE_VALUES)[number];

type Task = {
  id: string;
  text: string;
  date: Date | null;
};

function dicePoints(v: DiceValue) {
  // 4=triangle, 6=square, 10=rhombus, 20=hexagon
  if (v === 4) return "50,8 92,88 8,88";
  if (v === 6) return "10,10 90,10 90,90 10,90";
  if (v === 10) return "50,8 92,50 50,92 8,50";
  return "28,10 72,10 94,50 72,90 28,90 6,50";
}

// 6-pointed star path centered at (50,50)
function sixStarPath() {
  const cx = 50, cy = 50;
  const outer = 44, inner = 20;
  const pts: string[] = [];
  for (let i = 0; i < 12; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 6) * i - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(" ");
}

function HoverBox({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

function Index() {
  const [dark, setDark] = useState(false);
  const notesRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(16);
  const exec = (cmd: string, val?: string) => {
    notesRef.current?.focus();
    document.execCommand(cmd, false, val);
  };
  const [highlightOn, setHighlightOn] = useState(false);
  const toggleHighlight = () => {
    notesRef.current?.focus();
    const next = !highlightOn;
    setHighlightOn(next);
    document.execCommand("hiliteColor", false, next ? "rgba(255,235,120,0.55)" : "transparent");
  };
  const [tasks, setTasks] = useState<Task[]>([
    { id: crypto.randomUUID(), text: "", date: null },
  ]);

  const [diceIdx, setDiceIdx] = useState(1); // index in DICE_VALUES
  const diceVal = DICE_VALUES[diceIdx];
  const [rolled, setRolled] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);

  const [clicks, setClicks] = useState(0);

  // fidget spinner physics
  const [angle, setAngle] = useState(0);
  const velocityRef = useRef(0);
  const lastTRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    const tick = (t: number) => {
      if (lastTRef.current == null) lastTRef.current = t;
      const dt = (t - lastTRef.current) / 1000;
      lastTRef.current = t;
      // friction: slow decay
      velocityRef.current *= Math.pow(0.5, dt * 0.4);
      if (Math.abs(velocityRef.current) < 0.01) velocityRef.current = 0;
      setAngle((a) => a + velocityRef.current * dt);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const spin = () => {
    // speeds up fast: jump velocity quickly
    velocityRef.current = Math.min(velocityRef.current + 900, 1800);
  };

  const rollDice = () => {
    setRolling(true);
    let i = 0;
    const id = setInterval(() => {
      setRolled(Math.floor(Math.random() * diceVal) + 1);
      i++;
      if (i > 8) {
        clearInterval(id);
        setRolling(false);
      }
    }, 70);
  };

  const addTask = () =>
    setTasks((t) => [...t, { id: crypto.randomUUID(), text: "", date: null }]);
  const updateTask = (id: string, patch: Partial<Task>) =>
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeTask = (id: string) =>
    setTasks((t) => (t.length === 1 ? t : t.filter((x) => x.id !== id)));

  return (
    <div
      className="relative h-screen w-screen overflow-hidden p-4 sm:p-6"
      style={{ background: "var(--app-bg-base)" }}
    >
      {/* animated blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-blob" style={{ width: "55vw", height: "55vw", left: "-10vw", top: "-15vw", background: "var(--blob-1)", animation: "blob-a 22s ease-in-out infinite" }} />
        <div className="bg-blob" style={{ width: "50vw", height: "50vw", right: "-12vw", top: "-10vw", background: "var(--blob-2)", animation: "blob-b 28s ease-in-out infinite" }} />
        <div className="bg-blob" style={{ width: "45vw", height: "45vw", left: "20vw", bottom: "-15vw", background: "var(--blob-3)", animation: "blob-c 26s ease-in-out infinite" }} />
        <div className="bg-blob" style={{ width: "40vw", height: "40vw", right: "5vw", bottom: "-10vw", background: "var(--blob-4)", animation: "blob-d 30s ease-in-out infinite" }} />
        <div className="bg-blob" style={{ width: "35vw", height: "35vw", left: "30vw", top: "20vw", background: "var(--blob-5)", animation: "blob-e 24s ease-in-out infinite", opacity: 0.7 }} />
      </div>
      <div className="relative mx-auto grid h-full max-w-7xl grid-cols-1 gap-4 sm:gap-6 md:grid-cols-5">
        {/* Notes box */}
        <HoverBox
          className="hover-box relative col-span-1 flex h-full min-h-0 flex-col overflow-hidden rounded-3xl p-5 md:col-span-3"
          style={{ boxShadow: "var(--box-shadow-soft)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium text-primary">notes</div>
            <div className="flex items-center gap-1">
              {[
                { k: "bold", cmd: "bold", icon: Bold },
                { k: "italic", cmd: "italic", icon: Italic },
                { k: "underline", cmd: "underline", icon: Underline },
                { k: "strike", cmd: "strikeThrough", icon: Strikethrough },
              ].map(({ k, cmd, icon: Icon }) => (
                <button
                  key={k}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => exec(cmd)}
                  className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border-2 border-border text-primary transition-all hover:scale-110 hover:border-primary"
                  aria-label={k}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={toggleHighlight}
                className={`grid h-8 w-8 cursor-pointer place-items-center rounded-lg border-2 transition-all hover:scale-110 hover:border-primary ${highlightOn ? "border-primary bg-primary/15 text-primary" : "border-border text-primary"}`}
                aria-label="highlight"
              >
                <Highlighter className="h-3.5 w-3.5" />
              </button>
              <div className="ml-1 flex items-center gap-1 rounded-lg border-2 border-border px-1.5">
                <Type className="h-3 w-3 text-primary" />
                <input
                  type="number"
                  min={10}
                  max={48}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value) || 16)}
                  className="h-7 w-10 bg-transparent text-xs outline-none"
                />
              </div>
            </div>
          </div>
          <div className="relative flex-1 min-h-0 overflow-y-auto">
            <div
              ref={notesRef}
              contentEditable
              suppressContentEditableWarning
              data-placeholder="click here to type..."
              className="notes-editor relative min-h-full w-full bg-transparent text-foreground outline-none"
              style={{
                color: "var(--foreground)",
                fontSize: `${fontSize}px`,
                lineHeight: `${Math.round(fontSize * 1.75)}px`,
                backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${Math.round(fontSize * 1.75) - 1}px, var(--note-line) ${Math.round(fontSize * 1.75) - 1}px, var(--note-line) ${Math.round(fontSize * 1.75)}px)`,
                textShadow: "var(--text-shadow)",
              }}
            />
          </div>
        </HoverBox>

        {/* Right column */}
        <div className="col-span-1 flex h-full min-h-0 flex-col gap-4 sm:gap-6 md:col-span-2">
          {/* Toys box */}
          <HoverBox
            className="hover-box relative flex flex-[0.55] min-h-0 flex-col rounded-3xl p-5"
            style={{ boxShadow: "var(--box-shadow-soft)" }}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium text-primary">toys</div>
              <button
                onClick={() => setDark((d) => !d)}
                aria-label="toggle theme"
                className="blur-btn grid h-11 w-11 cursor-pointer place-items-center rounded-xl border-2 border-border text-primary transition-transform hover:scale-110"
                style={{ boxShadow: "var(--box-shadow-soft)" }}
              >
                {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex flex-1 min-h-0 items-center justify-around gap-3">
            {/* Dice */}
            <div className="relative flex flex-1 flex-col items-center justify-center">
              <div className="grid h-24 w-24 place-items-center">
              <button
                onClick={rollDice}
                aria-label="roll dice"
                className="relative grid h-20 w-20 cursor-pointer place-items-center transition-transform hover:scale-110 active:scale-95"
                style={{
                  transform: rolling ? "scale(0.85)" : "scale(1)",
                  transition: "transform 0.1s",
                  filter: dark ? "drop-shadow(var(--box-shadow-dice))" : "none",
                }}
              >
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                  <defs>
                    <linearGradient id="diceg" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.18 350)" />
                      <stop offset="100%" stopColor="oklch(0.6 0.2 350)" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points={dicePoints(diceVal)}
                    fill="url(#diceg)"
                    stroke="url(#diceg)"
                    strokeWidth={14}
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="relative text-xl font-bold text-primary-foreground" style={{ textShadow: "var(--text-shadow)" }}>
                  {rolled ?? "?"}
                </span>
              </button>
              </div>
              <div className="absolute left-1/2 top-full -translate-x-1/2 flex flex-col items-center gap-1 pt-2">
                <Slider
                  value={[diceIdx]}
                  onValueChange={(v) => { setDiceIdx(v[0]); setRolled(null); }}
                  min={0}
                  max={3}
                  step={1}
                  className="w-16"
                />
                <div className="text-xs text-muted-foreground">{diceVal}</div>
              </div>
            </div>

            {/* Fidget spinner */}
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="grid h-24 w-24 place-items-center">
              <button
                onClick={spin}
                aria-label="spin"
                className="grid h-24 w-24 cursor-pointer place-items-center transition-transform hover:scale-110 active:scale-90"
              >
                <svg
                  viewBox="0 0 100 100"
                  className="h-24 w-24"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: "50% 50%",
                    filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.25))",
                  }}
                >
                  <defs>
                    <linearGradient id="starg" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.18 350)" />
                      <stop offset="100%" stopColor="oklch(0.6 0.2 350)" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points={sixStarPath()}
                    fill="url(#starg)"
                    stroke="url(#starg)"
                    strokeWidth={10}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              </div>
            </div>

            {/* Click counter */}
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="grid h-24 w-24 place-items-center">
              <button
                onClick={() => setClicks((c) => c + 1)}
                className="grid h-20 w-20 cursor-pointer place-items-center rounded-full text-2xl font-bold text-primary-foreground transition-transform hover:scale-110 active:scale-95"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.78 0.18 350), oklch(0.6 0.2 350))",
                  boxShadow: "var(--box-shadow-soft)",
                  textShadow: "var(--text-shadow)",
                }}
              >
                {clicks}
              </button>
              </div>
            </div>
            </div>
          </HoverBox>

          {/* Tasks box */}
          <HoverBox
            className="hover-box flex flex-[1.45] min-h-0 flex-col rounded-3xl p-5"
            style={{ boxShadow: "var(--box-shadow-soft)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-medium text-primary">tasks</div>
              <button
                onClick={addTask}
                className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg text-primary transition-all hover:scale-110 hover:bg-accent"
                aria-label="add task"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <ul>
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="group flex items-start gap-2 border-b py-3"
                    style={{ borderColor: "var(--note-line)" }}
                  >
                    <textarea
                      rows={1}
                      value={task.text}
                      onChange={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                        updateTask(task.id, { text: e.target.value });
                      }}
                      placeholder="click here to type a task..."
                      className="flex-1 resize-none bg-transparent text-sm leading-6 text-foreground outline-none"
                    />
                    <DateButton
                      value={task.date}
                      onChange={(d) => updateTask(task.id, { date: d })}
                    />
                    <button
                      onClick={() => removeTask(task.id)}
                      aria-label="remove"
                      className="cursor-pointer opacity-0 transition-all hover:scale-110 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </HoverBox>
        </div>
      </div>

      <style>{`
        textarea::placeholder { color: var(--placeholder); opacity: 1; text-transform: lowercase; }
        input::placeholder { color: var(--placeholder); opacity: 1; }
        button { cursor: pointer; }
        .notes-editor:empty::before {
          content: attr(data-placeholder);
          color: var(--placeholder);
          pointer-events: none;
          text-transform: lowercase;
        }
        .notes-editor { white-space: pre-wrap; word-wrap: break-word; }
        .blur-btn {
          background: var(--card-tint);
          backdrop-filter: blur(18px) saturate(1.1);
          -webkit-backdrop-filter: blur(18px) saturate(1.1);
        }
        .hover-box {
          background: var(--card-tint);
          backdrop-filter: blur(18px) saturate(1.1);
          -webkit-backdrop-filter: blur(18px) saturate(1.1);
          border: 2px solid var(--border);
          transition: border-color 0.6s ease, background 0.6s ease;
        }
        :root .hover-box:hover { border-color: oklch(0.4 0.08 350); }
        .dark .hover-box:hover { border-color: oklch(0.95 0.02 350); }
      `}</style>
    </div>
  );
}

function DateButton({
  value,
  onChange,
}: {
  value: Date | null;
  onChange: (d: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("12:00");
  const [period, setPeriod] = useState<"AM" | "PM">("PM");

  const apply = (d: Date | undefined) => {
    if (!d) return;
    const [h, m] = time.split(":").map(Number);
    const hour24 = (h % 12) + (period === "PM" ? 12 : 0);
    const out = new Date(d);
    out.setHours(hour24, m || 0, 0, 0);
    onChange(out);
  };

  const label = value
    ? `${format(value, "MM/dd/yy")} ${format(value, "hh:mm")} ${format(value, "a").toLowerCase()}`
    : "date";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="blur-btn shrink-0 cursor-pointer rounded-lg border-2 border-primary/40 px-3 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:border-primary hover:text-primary lowercase"
          style={{
            minWidth: 80,
            background: "linear-gradient(135deg, oklch(0.78 0.18 350 / 0.75), oklch(0.6 0.2 350 / 0.75))",
            backdropFilter: "blur(18px) saturate(1.1)",
            WebkitBackdropFilter: "blur(18px) saturate(1.1)",
            transform: "scale(1)",
            transformOrigin: "center",
            textShadow: "var(--text-shadow)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 pointer-events-auto" align="end">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={apply}
          initialFocus
          className="p-3 pointer-events-auto"
        />
        <div className="flex items-center gap-2 border-t p-3">
          <Input
            type="time"
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
              if (value) {
                const [h, m] = e.target.value.split(":").map(Number);
                const hour24 = (h % 12) + (period === "PM" ? 12 : 0);
                const out = new Date(value);
                out.setHours(hour24, m || 0, 0, 0);
                onChange(out);
              }
            }}
            className="h-8 lowercase"
          />
          <div className="flex rounded-md border">
            {(["AM", "PM"] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p);
                  if (value) {
                    const [h, m] = time.split(":").map(Number);
                    const hour24 = (h % 12) + (p === "PM" ? 12 : 0);
                    const out = new Date(value);
                    out.setHours(hour24, m || 0, 0, 0);
                    onChange(out);
                  }
                }}
                className={`px-2 py-1 text-xs lowercase ${period === p ? "bg-primary text-primary-foreground" : ""}`}
              >
                {p.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
