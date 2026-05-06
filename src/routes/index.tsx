import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Moon, Sun, Trash2, Plus } from "lucide-react";
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

function diceShape(v: DiceValue) {
  // 4=triangle, 6=square, 10=rhombus, 20=hexagon — all 2d
  if (v === 4) return "polygon(50% 6%, 96% 92%, 4% 92%)";
  if (v === 6) return "polygon(6% 6%, 94% 6%, 94% 94%, 6% 94%)";
  if (v === 10) return "polygon(50% 4%, 96% 50%, 50% 96%, 4% 50%)";
  return "polygon(25% 6%, 75% 6%, 98% 50%, 75% 94%, 25% 94%, 2% 50%)";
}

function Index() {
  const [dark, setDark] = useState(false);
  const [notes, setNotes] = useState("");
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
      className="h-screen w-screen overflow-hidden p-4 sm:p-6 lowercase"
      style={{ background: "var(--app-bg-gradient)" }}
    >
      {/* theme toggle */}
      <button
        onClick={() => setDark((d) => !d)}
        aria-label="toggle theme"
        className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-xl bg-card text-primary transition-all hover:scale-105"
        style={{ boxShadow: "var(--box-shadow-soft)" }}
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="mx-auto grid h-full max-w-7xl grid-cols-1 gap-4 sm:gap-6 md:grid-cols-5">
        {/* Notes box */}
        <div
          className="relative col-span-1 flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-card p-5 md:col-span-3"
          style={{ boxShadow: "var(--box-shadow-soft)" }}
        >
          <div className="mb-3 text-sm font-medium text-primary">notes</div>
          <div className="relative flex-1 min-h-0">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(transparent 0, transparent 27px, var(--note-line) 27px, var(--note-line) 28px)",
              }}
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="click here to type..."
              className="relative h-full w-full resize-none overflow-y-auto bg-transparent leading-7 text-foreground outline-none lowercase"
              style={{ color: "var(--foreground)" }}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-1 flex h-full min-h-0 flex-col gap-4 sm:gap-6 md:col-span-2">
          {/* Toys box */}
          <div
            className="flex flex-[0.9] min-h-0 items-center justify-around gap-3 rounded-3xl bg-card p-5"
            style={{ boxShadow: "var(--box-shadow-soft)" }}
          >
            {/* Dice */}
            <div className="flex flex-1 flex-col items-center gap-3">
              <button
                onClick={rollDice}
                aria-label="roll dice"
                className="relative grid h-20 w-20 place-items-center transition-transform active:scale-95"
                style={{
                  clipPath: diceShape(diceVal),
                  background:
                    "linear-gradient(135deg, oklch(0.65 0.22 295), oklch(0.5 0.22 295))",
                  boxShadow: "var(--box-shadow-soft)",
                  transform: rolling ? "rotate(15deg)" : "rotate(0)",
                  transition: "transform 0.1s",
                }}
              >
                <span className="text-xl font-bold text-primary-foreground">
                  {rolled ?? "?"}
                </span>
              </button>
              <Slider
                value={[diceIdx]}
                onValueChange={(v) => setDiceIdx(v[0])}
                min={0}
                max={3}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">d{diceVal}</div>
            </div>

            {/* Fidget spinner */}
            <div className="flex flex-1 items-center justify-center">
              <button
                onClick={spin}
                aria-label="spin"
                className="relative h-24 w-24"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                {[0, 120, 240].map((deg) => (
                  <span
                    key={deg}
                    className="absolute left-1/2 top-1/2 block h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.65 0.22 295), oklch(0.45 0.22 295))",
                      transform: `translate(-50%,-50%) rotate(${deg}deg) translateY(-30px)`,
                      boxShadow: "var(--box-shadow-soft)",
                    }}
                  />
                ))}
                <span
                  className="absolute left-1/2 top-1/2 block h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card"
                  style={{ boxShadow: "inset 0 0 0 3px var(--primary)" }}
                />
              </button>
            </div>

            {/* Click counter */}
            <div className="flex flex-1 items-center justify-center">
              <button
                onClick={() => setClicks((c) => c + 1)}
                className="grid h-20 w-20 place-items-center rounded-full text-2xl font-bold text-primary-foreground transition-transform active:scale-95"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.65 0.22 295), oklch(0.5 0.22 295))",
                  boxShadow: "var(--box-shadow-soft)",
                }}
              >
                {clicks}
              </button>
            </div>
          </div>

          {/* Tasks box */}
          <div
            className="flex flex-[1.1] min-h-0 flex-col rounded-3xl bg-card p-5"
            style={{ boxShadow: "var(--box-shadow-soft)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-medium text-primary">tasks</div>
              <button
                onClick={addTask}
                className="grid h-7 w-7 place-items-center rounded-lg text-primary transition-colors hover:bg-accent"
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
                      className="flex-1 resize-none bg-transparent text-sm leading-6 text-foreground outline-none lowercase"
                    />
                    <DateButton
                      value={task.date}
                      onChange={(d) => updateTask(task.id, { date: d })}
                    />
                    <button
                      onClick={() => removeTask(task.id)}
                      aria-label="remove"
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        textarea::placeholder { color: var(--placeholder); opacity: 1; text-transform: lowercase; }
        input::placeholder { color: var(--placeholder); opacity: 1; }
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
          className="shrink-0 rounded-lg border border-transparent bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground transition-all hover:border-primary hover:bg-card hover:text-primary lowercase"
          style={{ minWidth: 56 }}
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
