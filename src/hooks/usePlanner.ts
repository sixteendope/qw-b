import { useEffect, useMemo, useReducer } from "react";
import {
  State, Task, Video, day, addD, id, mkVideo, sched, cur, findTask, wdCount,
} from "../lib/planner";

const KEY = "planer_yt_v2";
const OLD = "planer_yt_v1";

/** json-клон вместо structuredClone — работает на любом iOS */
function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

function defaults(): State {
  return {
    theme: "dark",
    honor: 50,
    streak: 0,
    videos: [],
    hist: [],
    ideas: [],
    log: {},
    view: "today",
    timer: null,
    last: day(),
    pen: "",
    notice: null,
    celebrate: false,
    flash: null,
  };
}

function migrate(o: any): Partial<State> | null {
  if (!o || !Array.isArray(o.videos)) return null;
  const fix = (groups: any[]) =>
    (groups || []).map((g: any) => ({
      id: g.id || id(),
      n: g.n,
      tasks: (g.tasks || []).map((t: any) => ({
        id: t.id || id(), n: t.n, y: t.y, m: t.m, done: !!t.done, a: t.a, dt: t.dt, dd: t.dd,
      })),
    }));
  return {
    theme: o.theme === "light" ? "light" : "dark",
    honor: typeof o.honor === "number" ? o.honor : 50,
    streak: 0,
    videos: o.videos.map((v: any) => ({ id: v.id || id(), n: v.n, date: v.date || "", groups: fix(v.groups) })),
    hist: (o.hist || []).map((v: any) => ({ n: v.n, date: v.date, end: v.end, groups: fix(v.groups) })),
    ideas: o.ideas || [],
    log: o.log || {},
    view: ["today", "all", "hist", "sum"].includes(o.view) ? o.view : "today",
    timer: o.timer && o.timer.start ? o.timer : null,
    last: o.last || day(),
    pen: "",
  };
}

function load(): State {
  const base = defaults();
  let raw: any = null;
  try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { /* noop */ }
  if (!raw) {
    try {
      const o = JSON.parse(localStorage.getItem(OLD) || "null");
      const m = o && migrate(o);
      if (m) {
        raw = m;
        try { localStorage.setItem(KEY, JSON.stringify({ ...base, ...m })); } catch { /* noop */ }
      }
    } catch { /* noop */ }
  }
  const s: State = raw ? { ...base, ...raw } : base;
  s.timer = s.timer && s.timer.start ? s.timer : null;
  if (s.view === "timer" && !s.timer) s.view = "today";
  s.notice = null;
  s.celebrate = false;
  s.flash = null;
  // штраф за пропущенные рабочие дни + сброс серии
  if (s.pen !== day()) {
    if (cur(s) && s.last) {
      const missed = wdCount(s.last, day()) - (new Date().getDay() % 6 ? 1 : 0);
      if (missed > 0) {
        s.honor = Math.max(0, s.honor - Math.min(10, missed * 2));
        s.streak = 0;
      }
    }
    s.pen = day();
  }
  return s;
}

function lg(s: State, k: string) {
  if (!s.log[k]) s.log[k] = { d: 0, m: 0, t: [] };
  return s.log[k];
}

function finishTask(s: State, f: { v: Video; g: any; t: Task }, minutes: number, ts: number) {
  const today = day(new Date(ts));
  f.t.done = true;
  f.t.a = minutes;
  f.t.dd = today;
  // честь как в rdr2: успел в срок — +2, опоздал — +1 (растёт до 70 на шагах)
  if (s.honor < 70) {
    const onTime = !f.t.dt || today <= f.t.dt;
    s.honor = Math.min(70, s.honor + (onTime ? 2 : 1));
  }
  if (s.last !== today) s.streak = s.last === addD(-1, today) ? s.streak + 1 : 1;
  s.last = today;
  const L = lg(s, today);
  L.d++;
  L.m += minutes;
  L.t.push({ n: f.t.n, m: minutes, g: f.g.n });
  if (f.g.tasks.every((x: Task) => x.done)) s.flash = f.g.id;
  if (f.v.id !== "own" && f.v.groups.every((g) => g.tasks.length && g.tasks.every((t) => t.done))) {
    s.videos.splice(s.videos.indexOf(f.v), 1);
    s.hist.unshift({ n: f.v.n, date: f.v.date, end: today, groups: f.v.groups });
    s.honor = Math.min(100, s.honor + (f.v.date && today <= f.v.date ? 15 : 3));
    s.celebrate = true;
    s.view = "today";
  }
}

export type Action =
  | { type: "theme" }
  | { type: "view"; view: State["view"] }
  | { type: "finish"; id: string; minutes: number; ts: number }
  | { type: "uncheck"; id: string }
  | { type: "start"; id: string; ts: number }
  | { type: "t_add5" }
  | { type: "t_finish"; ts: number }
  | { type: "t_done" }
  | { type: "t_break"; ts: number }
  | { type: "t_dismiss" }
  | { type: "t_skip" }
  | { type: "t_check"; ts: number }
  | { type: "add_video"; n: string; date: string }
  | { type: "rebuild"; id: string; date: string }
  | { type: "add_task"; n: string; y: Task["y"]; m: number; vid: string }
  | { type: "del_task"; id: string }
  | { type: "undo" }
  | { type: "add_idea"; text: string }
  | { type: "del_idea"; i: number }
  | { type: "idea_video"; i: number; date: string }
  | { type: "reset" }
  | { type: "clear_notice" }
  | { type: "clear_celebrate" }
  | { type: "clear_flash" };

let nid = 1;

function reducer(state: State, a: Action): State {
  const s: State = clone(state);
  switch (a.type) {
    case "theme":
      s.theme = s.theme === "dark" ? "light" : "dark";
      return s;
    case "view":
      s.view = a.view;
      return s;
    case "finish": {
      const f = findTask(s, a.id);
      if (f && !f.t.done) finishTask(s, f, a.minutes, a.ts);
      return s;
    }
    case "uncheck": {
      const f = findTask(s, a.id);
      if (f && f.t.done) {
        f.t.done = false;
        if (f.t.dd === day()) {
          const L = lg(s, f.t.dd);
          L.d = Math.max(0, L.d - 1);
          L.m = Math.max(0, L.m - (f.t.a || 0));
        }
        delete f.t.a;
        delete f.t.dd;
        sched(f.v);
      }
      return s;
    }
    case "start": {
      const f = findTask(s, a.id);
      if (!f) return s;
      s.timer = { k: "w", start: a.ts, end: a.ts + f.t.m * 60000, m: f.t.m, taskId: f.t.id, taskName: f.t.n };
      s.view = "timer";
      return s;
    }
    case "t_add5":
      if (s.timer && !s.timer.fin) { s.timer.end += 300000; s.timer.m += 5; }
      return s;
    case "t_finish": {
      const X = s.timer;
      if (!X || X.k !== "w") return s;
      const f = X.taskId ? findTask(s, X.taskId) : cur(s);
      if (f) finishTask(s, f, Math.max(0, (Math.min(a.ts, X.end) - X.start) / 60000), a.ts);
      s.timer = null;
      s.view = "today";
      return s;
    }
    case "t_done": {
      const X = s.timer;
      if (!X || X.k !== "w") return s;
      const f = X.taskId ? findTask(s, X.taskId) : cur(s);
      if (f) finishTask(s, f, X.m, Date.now());
      s.timer = null;
      s.view = "today";
      return s;
    }
    case "t_break":
      s.timer = { k: "b", start: a.ts, end: a.ts + 600000, m: 10 };
      return s;
    case "t_dismiss":
      s.timer = null;
      s.view = "today";
      return s;
    case "t_skip": {
      const X = s.timer;
      const f = X && X.taskId ? findTask(s, X.taskId) : cur(s);
      s.honor = Math.max(0, s.honor - 3);
      if (f) {
        const i = f.g.tasks.indexOf(f.t);
        f.g.tasks.splice(i, 1);
        f.t.dt = undefined;
        f.g.tasks.push(f.t);
        sched(f.v);
      }
      s.timer = null;
      s.view = "today";
      return s;
    }
    case "t_check":
      if (s.timer && !s.timer.fin && s.timer.end <= a.ts) s.timer.fin = true;
      return s;
    case "add_video":
      s.videos.push(mkVideo(a.n, a.date));
      s.view = "today";
      return s;
    case "rebuild": {
      const v = s.videos.find((x) => x.id === a.id);
      if (v) { v.date = a.date; sched(v); }
      return s;
    }
    case "add_task": {
      let o = s.videos.find((x) => x.id === a.vid);
      if (!o) {
        o = { id: "own", n: "свои задачи", date: "", groups: [{ id: id(), n: "задачи", tasks: [] }] };
        s.videos.unshift(o);
      }
      o.groups[0].tasks.push({ id: id(), n: a.n, y: a.y, m: a.y === "d" ? 330 : a.m, done: false, dt: day() });
      return s;
    }
    case "del_task": {
      const f = findTask(s, a.id);
      if (!f) return s;
      s.prev = { videos: clone(state.videos), hist: clone(state.hist), ideas: clone(state.ideas) };
      f.g.tasks.splice(f.g.tasks.indexOf(f.t), 1);
      if (!f.g.tasks.length && f.v.id === "own") s.videos.splice(s.videos.indexOf(f.v), 1);
      s.notice = { msg: "задача удалена", undo: true, id: nid++ };
      return s;
    }
    case "undo": {
      if (!s.prev) return s;
      s.videos = s.prev.videos;
      s.hist = s.prev.hist;
      s.ideas = s.prev.ideas;
      s.prev = null;
      s.notice = { msg: "возвращено", id: nid++ };
      return s;
    }
    case "add_idea":
      s.ideas.unshift(a.text);
      return s;
    case "del_idea":
      s.ideas.splice(a.i, 1);
      return s;
    case "idea_video": {
      const text = s.ideas[a.i];
      if (text) {
        s.videos.push(mkVideo(text, a.date));
        s.ideas.splice(a.i, 1);
        s.view = "today";
      }
      return s;
    }
    case "reset": {
      const theme = s.theme;
      s.prev = { videos: clone(state.videos), hist: clone(state.hist), ideas: clone(state.ideas) };
      Object.assign(s, defaults(), { theme, prev: s.prev });
      s.notice = { msg: "всё сброшено", undo: true, id: nid++ };
      return s;
    }
    case "clear_notice":
      s.notice = null;
      return s;
    case "clear_celebrate":
      s.celebrate = false;
      return s;
    case "clear_flash":
      s.flash = null;
      return s;
  }
}

export function vib(p: number | number[]) {
  try { navigator.vibrate?.(p); } catch { /* noop */ }
}

export function usePlanner() {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      const { notice, celebrate, flash, prev, ...rest } = state;
      localStorage.setItem(KEY, JSON.stringify(rest));
    } catch { /* noop */ }
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", state.theme === "dark" ? "#0b0b0d" : "#f0eee8");
  }, [state.theme]);

  // проверка истечения таймера (в фоне)
  useEffect(() => {
    const check = () => dispatch({ type: "t_check", ts: Date.now() });
    const iv = setInterval(check, 5000);
    document.addEventListener("visibilitychange", check);
    return () => { clearInterval(iv); document.removeEventListener("visibilitychange", check); };
  }, []);

  const api = useMemo(() => {
    const ts = () => ({ ts: Date.now() });
    return {
      theme: () => dispatch({ type: "theme" }),
      view: (view: State["view"]) => dispatch({ type: "view", view }),
      finish: (id: string, minutes = 0) => { vib(12); dispatch({ type: "finish", id, minutes, ...ts() }); },
      uncheck: (id: string) => dispatch({ type: "uncheck", id }),
      start: (id: string) => dispatch({ type: "start", id, ...ts() }),
      tAdd5: () => dispatch({ type: "t_add5" }),
      tFinish: () => { vib(12); dispatch({ type: "t_finish", ...ts() }); },
      tDone: () => { vib(12); dispatch({ type: "t_done" }); },
      tBreak: () => dispatch({ type: "t_break", ...ts() }),
      tDismiss: () => dispatch({ type: "t_dismiss" }),
      tSkip: () => dispatch({ type: "t_skip" }),
      tCheck: () => dispatch({ type: "t_check", ...ts() }),
      addVideo: (n: string, date: string) => { vib([10, 40, 10]); dispatch({ type: "add_video", n, date }); },
      rebuild: (id: string, date: string) => dispatch({ type: "rebuild", id, date }),
      addTask: (n: string, y: "t" | "s" | "d", m: number, vid: string) => dispatch({ type: "add_task", n, y, m, vid }),
      delTask: (id: string) => dispatch({ type: "del_task", id }),
      undo: () => dispatch({ type: "undo" }),
      addIdea: (text: string) => dispatch({ type: "add_idea", text }),
      delIdea: (i: number) => dispatch({ type: "del_idea", i }),
      ideaVideo: (i: number, date: string) => { vib([10, 40, 10]); dispatch({ type: "idea_video", i, date }); },
      reset: () => dispatch({ type: "reset" }),
      clearNotice: () => dispatch({ type: "clear_notice" }),
      clearCelebrate: () => dispatch({ type: "clear_celebrate" }),
      clearFlash: () => dispatch({ type: "clear_flash" }),
    };
  }, []);

  return { state, api };
}

export type Api = ReturnType<typeof usePlanner>["api"];
