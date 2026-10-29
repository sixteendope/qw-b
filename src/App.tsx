import { useEffect, useState } from "react";
import { usePlanner } from "./hooks/usePlanner";
import { cur } from "./lib/planner";
import { Today } from "./components/Today";
import { TimerScreen, MiniTimer } from "./components/TimerScreen";
import { Videos } from "./components/Videos";
import { History } from "./components/History";
import { Summary } from "./components/Summary";
import { Modals, ModalState } from "./components/Modals";
import { Celebrate } from "./components/Celebrate";
import { Toast, Star } from "./components/ui";

const TABS: { v: "today" | "all" | "sum" | "hist"; label: string }[] = [
  { v: "today", label: "сегодня" },
  { v: "all", label: "видео" },
  { v: "sum", label: "итоги" },
  { v: "hist", label: "история" },
];

export default function App() {
  const { state, api } = usePlanner();
  const [modal, setModal] = useState<ModalState>(null);
  const c = cur(state);

  // вспышка завершённой группы
  useEffect(() => {
    if (state.flash) {
      const t = setTimeout(api.clearFlash, 1600);
      return () => clearTimeout(t);
    }
  }, [state.flash]);

  // пробел = главное действие
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || modal) return;
      e.preventDefault();
      if (state.view === "today" && c) {
        if (state.timer) api.view("timer");
        else if (c.t.y === "t") api.start(c.t.id);
        else api.finish(c.t.id, 0);
      } else if (state.view === "timer" && state.timer) {
        const X = state.timer;
        if (X.fin) { if (X.k === "w") api.tDone(); else api.tDismiss(); }
        else if (X.k === "w") api.tFinish();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [state.view, state.timer, c, modal, api]);

  const immersive = state.view === "timer";

  return (
    <>
      {/* ambient */}
      <div className="amb amb-glow" />
      <div className="amb amb-grain" />
      <div className="amb">
        <span className="amb-star" style={{ top: "12%", left: "8%" }}><Star size={16} /></span>
        <span className="amb-star" style={{ top: "22%", right: "10%", animationDelay: "1.4s" }}><Star size={26} /></span>
        <span className="amb-star" style={{ bottom: "26%", left: "6%", animationDelay: "2.6s" }}><Star size={20} /></span>
        <span className="amb-star" style={{ bottom: "14%", right: "7%", animationDelay: "0.8s" }}><Star size={14} /></span>
      </div>
      <div className="fdt" />
      <div className="fdb" />

      <div className="relative z-10 max-w-[520px] mx-auto px-5 pt-3" style={{ paddingBottom: immersive ? 24 : 110 }}>
        <div key={state.view} className="screen">
          {state.view === "today" && <Today state={state} api={api} openModal={setModal} />}
          {state.view === "timer" && <TimerScreen state={state} api={api} />}
          {state.view === "all" && <Videos state={state} api={api} openModal={setModal} />}
          {state.view === "hist" && <History state={state} api={api} />}
          {state.view === "sum" && <Summary state={state} api={api} />}
        </div>
      </div>

      {!immersive && (
        <nav className="tabbar">
          {TABS.map((t) => (
            <button key={t.v} className={"tab" + (state.view === t.v ? " on" : "")} onClick={() => api.view(t.v)}>
              {t.label}
              {t.v === "today" && c && state.view !== "today" && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "var(--mint)" }} />
              )}
            </button>
          ))}
        </nav>
      )}

      <MiniTimer state={state} api={api} />
      <Modals modal={modal} close={() => setModal(null)} state={state} api={api} />

      {state.notice && (
        <Toast key={state.notice.id} msg={state.notice.msg} undo={state.notice.undo}
          onUndo={() => { api.undo(); }} onDone={api.clearNotice} />
      )}

      {state.celebrate && <Celebrate honor={state.honor} onDone={api.clearCelebrate} />}
    </>
  );
}
