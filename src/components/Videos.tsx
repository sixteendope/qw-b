import { useEffect, useRef, useState } from "react";
import { Api } from "../hooks/usePlanner";
import { State, Group, Task, dl, fs, vleft } from "../lib/planner";
import { Header, Half, Plus, Star } from "./ui";

function TaskRow({ g, t, api, onGroupDone }: { g: Group; t: Task; api: Api; onGroupDone: (gid: string) => void }) {
  const [pop, setPop] = useState(false);
  const toggle = () => {
    if (t.done) {
      api.uncheck(t.id);
    } else {
      api.finish(t.id, 0);
      setPop(true);
      setTimeout(() => setPop(false), 1100);
      if (g.tasks.every((x) => x.done || x.id === t.id)) onGroupDone(g.id);
    }
  };
  return (
    <div className={"row" + (t.done ? " x" : "") + (pop ? " pop" : "")} onClick={toggle} role="checkbox" aria-checked={t.done} tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggle())}>
      <i className="ck not-italic"><Star size={26} /></i>
      <span className="flex-1 min-w-0 text-[15.5px]"><em className="tt">{t.n}</em></span>
      <small className="whitespace-nowrap text-[12.5px]" style={{ color: "var(--mu)" }}>
        {t.done ? (t.dd ? dl(t.dd) : "") : (t.dt ? dl(t.dt) : "") + (t.y === "t" ? " · " + t.m + "м" : "")}
      </small>
      <b className="del" style={{ color: "var(--mu)", fontWeight: 400, fontSize: 19, lineHeight: 1 }}
        onClick={(e) => { e.stopPropagation(); api.delTask(t.id); }} aria-label="удалить">×</b>
    </div>
  );
}

function GroupBlock({ g, api, n, flash }: { g: Group; api: Api; n: number; flash: boolean }) {
  const allDone = g.tasks.every((t) => t.done);
  const [open, setOpen] = useState(!allDone);
  const doneN = g.tasks.filter((t) => t.done).length;
  const tm = useRef<number | undefined>(undefined);

  const onGroupDone = () => {
    tm.current = window.setTimeout(() => setOpen(false), 1300);
  };
  useEffect(() => {
    if (flash && allDone) setOpen(true);
    return () => clearTimeout(tm.current);
  }, [flash]);
  useEffect(() => { if (!allDone) setOpen(true); }, [allDone]);

  return (
    <div className={"card px-4 pt-1 pb-3 mb-2.5 transition-opacity duration-700" + (allDone && !open ? " opacity-55" : "")}
      style={{ animation: `rise .6s cubic-bezier(.3,.8,.3,1) ${Math.min(n, 10) * 65 + 90}ms both` }}>
      <div className="h-[46px] flex justify-between items-center gap-2.5 cursor-pointer" onClick={() => setOpen(!open)}>
        <span className="text-[15.5px] font-semibold">{g.n}</span>
        <span className="text-[13px]" style={{ color: allDone ? "var(--mint)" : "var(--mu)" }}>
          {allDone ? "готово ✦" : doneN + "/" + g.tasks.length}
        </span>
      </div>
      <div className={"gbody" + (open ? "" : " shut")}>
        <div>
          <div className="-mx-1 px-1">
            {g.tasks.map((t) => (
              <TaskRow key={t.id} g={g} t={t} api={api} onGroupDone={onGroupDone} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Videos({ state, api, openModal }: { state: State; api: Api; openModal: (m: any) => void }) {
  let n = 1;
  return (
    <div className="pb-4">
      <Header title="видео" sub={state.videos.length ? state.videos.length + " в работе" : undefined} n={0}
        right={
          <>
            <button className="rb" aria-label="новая задача" title="новая задача" onClick={() => openModal({ type: "addt" })}>
              <Plus />
            </button>
            <button className="rb" aria-label="новое видео" title="новое видео" onClick={() => openModal({ type: "new" })}>
              <Star size={16} />
            </button>
            <button className="rb" aria-label="тема" onClick={api.theme}><Half /></button>
          </>
        }
      />
      {!state.videos.length && (
        <p className="sg px-1 py-6 text-[14px]" style={{ "--n": 1, color: "var(--mu)" } as any}>
          пока пусто · нажми <Star size={11} className="inline" /> чтобы задумать ролик
        </p>
      )}
      {state.videos.map((v) => {
        const l = vleft(v);
        return (
          <div key={v.id}>
            <div className="sg flex justify-between items-center gap-3 mt-5 mb-2.5 px-1" style={{ "--n": n++ } as any}>
              <b className="text-[19px] font-semibold tracking-[-0.3px] min-w-0 truncate">{v.n}</b>
              <small className="whitespace-nowrap text-[12.5px] cursor-pointer underline decoration-dotted underline-offset-4"
                style={{ color: "var(--mu)" }}
                onClick={() => openModal({ type: "rp", id: v.id })}>
                {(v.date ? fs(v.date).replace(/ \d{4}$/, "") + " · " : "") + l.n + " шагов"}
              </small>
            </div>
            {v.groups.map((g) => (
              <GroupBlock key={g.id} g={g} api={api} n={n++} flash={state.flash === g.id} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
