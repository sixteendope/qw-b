import { useEffect, useState } from "react";
import { Api } from "../hooks/usePlanner";
import { State, hc, mmss } from "../lib/planner";
import { Star } from "./ui";

function Digits({ s, size = 76 }: { s: string; size?: number }) {
  return (
    <div className="font-disp font-medium tabular-nums tracking-[-2px] leading-none" style={{ fontSize: size }}>
      {s.split("").map((ch, i) => (
        <span key={i + ch} className="digit">{ch}</span>
      ))}
    </div>
  );
}

export function TimerScreen({ state, api }: { state: State; api: Api }) {
  const X = state.timer;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, []);

  // wake lock пока идёт рабочий таймер
  useEffect(() => {
    let lock: any = null;
    if (X && X.k === "w" && !X.fin) {
      try { navigator.wakeLock?.request("screen").then((l: any) => (lock = l)).catch(() => {}); } catch { /* noop */ }
    }
    return () => { try { lock?.release?.(); } catch { /* noop */ } };
  }, [X?.k, X?.fin]);

  // авто-отметка истечения
  useEffect(() => {
    if (X && X.end - now <= 0 && !X.fin) {
      const t = setTimeout(api.tCheck, 80);
      return () => clearTimeout(t);
    }
  }, [now, X, api]);

  if (!X) return null;
  const work = X.k === "w";
  const remain = Math.max(0, X.end - now);
  const total = Math.max(1, X.end - X.start);
  const p = remain / total;
  const R = 122, C = 2 * Math.PI * R;
  const col = work ? (X.fin ? hc(state.honor) : "var(--tx)") : "#ffb234";

  const btnRow = X.fin ? (
    work ? (
      <>
        <button className="btn btn-soft h-12 px-6" onClick={api.tBreak}>перерыв</button>
        <button className="btn btn-solid h-12 px-6" onClick={api.tDone}>выполнено</button>
        <button className="btn btn-ghost h-12 px-5" onClick={api.tSkip}>не сегодня</button>
      </>
    ) : (
      <button className="btn btn-solid h-12 px-8" onClick={api.tDismiss}>продолжить</button>
    )
  ) : (
    <>
      <button className="btn btn-soft h-12 px-6" onClick={api.tAdd5}>+ 5 мин</button>
      {work && <button className="btn btn-solid h-12 px-6" onClick={api.tFinish}>завершить</button>}
      <button className="btn btn-ghost h-12 px-5" onClick={api.tDismiss}>{work ? "свернуть" : "на главную"}</button>
    </>
  );

  return (
    <div className="screen timer-col flex flex-col items-center pt-6">
      <div className="font-disp text-[22px] font-semibold tracking-tight">{work ? "таймер" : "перерыв"}</div>
      <div className="text-[14px] mt-2 mb-8 max-w-[300px] text-center truncate" style={{ color: "var(--mu)" }}>
        {X.fin ? (work ? "время вышло" : "перерыв закончился") : work ? X.taskName || "" : "выдохни · 10 минут"}
      </div>

      <div className="relative flex items-center justify-center my-4">
        <svg width="280" height="280" className="absolute" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="140" cy="140" r={R} fill="none" stroke="var(--c2)" strokeWidth="2.5" />
          <circle cx="140" cy="140" r={R} fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - p)}
            style={{ transition: "stroke-dashoffset 0.3s linear, stroke 0.6s", filter: "drop-shadow(0 0 7px " + (work ? "rgba(var(--tx-rgb),0.45)" : "rgba(255,178,52,0.55)") + ")" }} />
        </svg>
        {X.fin ? (
          <Star size={54} className="celeb-star" />
        ) : (
          <Digits s={mmss(remain)} />
        )}
      </div>

      {!X.fin && (
        <div className="text-[12.5px] tracking-[0.1em] mb-8" style={{ color: "var(--mu)" }}>
          {work ? "из " + X.m + " мин" : "отдых — часть работы"}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2.5 mt-auto pb-6">{btnRow}</div>
    </div>
  );
}

export function MiniTimer({ state, api }: { state: State; api: Api }) {
  const X = state.timer;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!X) return;
    const iv = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(iv);
  }, [X]);
  if (!X || state.view === "timer") return null;
  const fin = X.end <= now;
  return (
    <button
      onClick={() => api.view("timer")}
      className="fixed z-40 left-1/2 -translate-x-1/2 flex items-center gap-2.5 h-11 pl-4 pr-5 rounded-full border-0 cursor-pointer text-[14px] font-semibold"
      style={{
        bottom: "calc(76px + env(safe-area-inset-bottom, 0px))",
        background: "var(--inv)", color: "var(--it)",
        boxShadow: "0 8px 30px -8px rgba(0,0,0,.5), 0 0 22px var(--gl)",
        animation: "rise .5s cubic-bezier(.3,.8,.3,1) both",
      }}
    >
      <Star size={13} className={fin ? "" : "spin-slow"} />
      {X.k === "b" ? "перерыв" : (X.taskName || "таймер")}
      <span className="font-disp text-[13px] font-medium tabular-nums">{fin ? "готово" : mmss(X.end - now)}</span>
    </button>
  );
}
