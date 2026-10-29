export type TaskType = "t" | "s" | "d"; // t = с таймером, s = одним тапом, d = на день
export type View = "today" | "all" | "sum" | "hist" | "timer";

export interface Task {
  id: string;
  n: string;
  y: TaskType;
  m: number;
  done: boolean;
  a?: number; // фактические минуты
  dt?: string; // запланированная дата
  dd?: string; // дата выполнения
}
export interface Group {
  id: string;
  n: string;
  tasks: Task[];
}
export interface Video {
  id: string;
  n: string;
  date: string; // planned release
  groups: Group[];
}
export interface HistItem {
  n: string;
  date: string;
  end: string;
  groups: Group[];
}
export interface DayLog {
  d: number;
  m: number;
  t: { n: string; m: number; g: string }[];
}
export interface Timer {
  k: "w" | "b";
  start: number;
  end: number;
  m: number;
  fin?: boolean;
  taskId?: string;
  taskName?: string;
}
export interface State {
  theme: "dark" | "light";
  honor: number;
  streak: number;
  videos: Video[];
  hist: HistItem[];
  ideas: string[];
  log: Record<string, DayLog>;
  view: View;
  timer: Timer | null;
  last: string;
  pen: string;
  // transient
  notice?: { msg: string; undo?: boolean; id: number } | null;
  celebrate?: boolean;
  flash?: string | null;
  prev?: { videos: Video[]; hist: HistItem[]; ideas: string[] } | null;
}

export const WD = 330; // рабочий день, минут (5,5 ч)

export const MG = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
export const MN = ["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"];
export const WDN = ["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота"];
export const WDS = ["вс","пн","вт","ср","чт","пт","сб"];

export function id() {
  return Math.random().toString(36).slice(2, 9);
}
export function pd(s: string) {
  const a = s.split("-");
  return new Date(+a[0], +a[1] - 1, +a[2]);
}
export function day(d = new Date()) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
export function addD(n: number, from?: string) {
  const x = from ? pd(from) : new Date();
  x.setDate(x.getDate() + n);
  return day(x);
}
export function fd(s: string) {
  const d = pd(s);
  return d.getDate() + " " + MG[d.getMonth()] + " " + d.getFullYear();
}
export function fs(s: string) {
  const d = pd(s);
  return d.getDate() + " " + MG[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? " " + d.getFullYear() : "");
}
export function fshort(s: string) {
  const d = pd(s);
  return d.getDate() + " " + MG[d.getMonth()].slice(0, 3);
}
export function dl(s: string) {
  return s === day() ? "сегодня" : s === addD(1) ? "завтра" : fs(s);
}
/** рабочие дни между датами (a exclusive, b inclusive) */
export function wdCount(a: string, b: string) {
  let n = 0;
  const x = pd(a);
  const e = pd(b);
  x.setDate(x.getDate() + 1);
  while (x <= e) {
    if (x.getDay() % 6) n++;
    x.setDate(x.getDate() + 1);
  }
  return n;
}
function nextWorkday(d: Date) {
  while (d.getDay() % 6 === 0) d.setDate(d.getDate() + 1);
  return d;
}
/** расставить даты неотмеченным задачам от ближайшего рабочего дня */
export function sched(v: Video) {
  const d = nextWorkday(new Date());
  let cap = WD;
  v.groups.forEach((g) =>
    g.tasks.forEach((t) => {
      if (t.done) return;
      const m = t.m || (t.y === "d" ? WD : 60);
      if (m > cap && cap < WD) {
        d.setDate(d.getDate() + 1);
        nextWorkday(d);
        cap = WD;
      }
      t.dt = day(d);
      cap -= m;
      if (cap <= 0) {
        d.setDate(d.getDate() + 1);
        nextWorkday(d);
        cap = WD;
      }
    })
  );
}

export const T: [string, [string, TaskType, number][]][] = [
  ["подготовка", [["сценарий", "t", 90], ["список бироллов", "t", 30], ["сюжет и сценки", "t", 40]]],
  ["съёмка", [["говорящая голова", "s", 60], ["домашние бироллы", "s", 60], ["уличные бироллы", "s", 90]]],
  ["монтаж", [["сброс на комп", "s", 20], ["нарезка головы", "t", 40], ["сюжетные вставки", "t", 50], ["переходы", "t", 45], ["саунддизайн", "t", 90], ["вставка бироллов", "t", 30], ["музыка", "t", 40], ["цветокоррекция", "t", 70]]],
  ["финал", [["рендер", "d", WD], ["превью", "d", WD], ["выкладка", "d", 30]]],
];
export const TPL = T.reduce((s, g) => s + g[1].reduce((x, t) => x + t[2], 0), 0);
export const TPL_DAYS = Math.ceil(TPL / WD);

export function mkVideo(n: string, dt: string): Video {
  const v: Video = {
    id: id(),
    n,
    date: dt,
    groups: T.map((g) => ({
      id: id(),
      n: g[0],
      tasks: g[1].map((t) => ({ id: id(), n: t[0], y: t[1], m: t[2], done: false })),
    })),
  };
  sched(v);
  return v;
}

export function cur(s: State): { v: Video; g: Group; t: Task } | null {
  for (const v of s.videos)
    for (const g of v.groups)
      for (const t of g.tasks) if (!t.done) return { v, g, t };
  return null;
}
export function findTask(s: State, tid: string) {
  for (const v of s.videos)
    for (const g of v.groups)
      for (const t of g.tasks) if (t.id === tid) return { v, g, t };
  return null;
}
export function vleft(v: Video) {
  let n = 0, m = 0;
  v.groups.forEach((g) => g.tasks.forEach((t) => { if (!t.done) { n++; m += t.m || 0; } }));
  return { n, m };
}
export function vsteps(v: Video) {
  let all = 0, done = 0;
  v.groups.forEach((g) => g.tasks.forEach((t) => { all++; if (t.done) done++; }));
  return { all, done };
}
export function plan(v: Video): string {
  const dates: string[] = [];
  v.groups.forEach((g) => g.tasks.forEach((t) => { if (!t.done && t.dt) dates.push(t.dt); }));
  const l = dates.length ? dates[dates.length - 1] : null;
  if (!l || !v.date) return "";
  const sl = l <= v.date ? wdCount(l, v.date) : -wdCount(v.date, l);
  if (sl > 0) return "по плану закончишь " + fs(l) + " · запас " + sl + " раб. дн";
  if (sl === 0) return "по плану закончишь " + fs(l) + " · без запаса";
  return "не успеваешь · нужно ещё " + -sl + " раб. дн";
}
export function lab(t: Task) {
  return t.y === "t" ? "начать" : t.n === "сброс на комп" ? "выполнено" : t.y === "s" ? "снято" : "готово";
}
export function fm(m: number) {
  return m > 0 && m < 1 ? "<1" : String(Math.round(m));
}
/** цвет звезды по уровню дисциплины: красный → янтарный → мятный */
export function hc(h: number) {
  const stops: [number, number, number][] = [[255, 84, 104], [255, 178, 52], [69, 224, 154]];
  const p = Math.max(0, Math.min(100, h)) / 50;
  const i = p < 1 ? 0 : 1;
  const f = p < 1 ? p : p - 1;
  const a = stops[i], b = stops[i + 1];
  return "rgb(" + a.map((c, j) => Math.round(c + (b[j] - c) * f)).join(",") + ")";
}
export function mmss(ms: number) {
  const t = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(t / 60), s = t % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}
