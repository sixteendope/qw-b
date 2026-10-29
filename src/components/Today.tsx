import { useState } from "react";
import { Api } from "../hooks/usePlanner";
import { State, TPL_DAYS, addD, cur, dl, plan, vsteps, lab, MG } from "../lib/planner";
import { DatePicker } from "./DatePicker";
import { Header, HonorBar, Plus, Star, Half, Bolt } from "./ui";

export function Today({ state, api, openModal }: { state: State; api: Api; openModal: (m: any) => void }) {
  const c = cur(state);
  const now = new Date();
  const [name, setName] = useState("");
  const [date, setDate] = useState(addD(14));
  const [trail, setTrail] = useState(false);

  const primary = () => {
    if (!c) return;
    if (state.timer) {
      api.view("timer");
      return;
    }
    if (c.t.y === "t") {
      api.start(c.t.id);
    } else {
      setTrail(true);
      setTimeout(() => setTrail(false), 1000);
      api.finish(c.t.id, 0);
    }
  };

  const st = c ? vsteps(c.v) : null;
  const dd = c && c.v.date ? Math.round((+new Date(c.v.date) - +new Date()) / 864e5) : null;
  const ps = c ? plan(c.v) : "";

  return (
    <div className="today-col flex flex-col">
      <Header
        title={now.getDate() + " " + MG[now.getMonth()]}
        sub={now.toLocaleDateString("ru-RU", { weekday: "long" })}
        right={
          <>
            <button className="rb" aria-label="идеи" title="идеи" onClick={() => openModal({ type: "ideas" })}>
              <Star size={16} />
            </button>
            <button className="rb" aria-label="новое видео" title="новое видео" onClick={() => openModal({ type: "new" })}>
              <Plus />
            </button>
            <button className="rb" aria-label="тема" onClick={api.theme}>
              <Half />
            </button>
          </>
        }
      />

      {c ? (
        <div className="sg main-card p-6 relative overflow-hidden" style={{ "--n": 1 } as any}>
          <div key={c.t.id} className="swap">
            <div className="flex justify-between gap-3 text-[12.5px] tracking-[0.09em] opacity-55 mb-3">
              <span>{c.g.n}</span>
              <span className="text-right flex items-center gap-1.5">
                {c.t.y === "t" && <Bolt size={11} />}
                {(c.t.dt ? dl(c.t.dt) : "") + (c.t.y === "t" ? " · " + c.t.m + " мин" : "")}
              </span>
            </div>
            <div className="text-[27px] font-semibold leading-[1.18] tracking-[-0.4px] mb-1.5 [overflow-wrap:anywhere]">
              {c.t.n}
            </div>
            <div className="text-[14.5px] opacity-50 mb-6 truncate">{c.v.n}</div>
            <button className={"btn btn-solid w-full h-[54px] text-[16.5px]" + (trail ? " trail" : "")} onClick={primary}>
              {state.timer ? "к таймеру" : lab(c.t)}
              {c.t.y === "t" && <Star size={15} className={"opacity-80" + (state.timer ? "" : " spin-slow")} />}
            </button>
          </div>
          <div className="absolute -right-7 -top-7 opacity-[0.06] pointer-events-none">
            <Star size={150} />
          </div>
        </div>
      ) : (
        <div className="sg main-card p-6 relative overflow-hidden" style={{ "--n": 1 } as any}>
          <div className="flex items-center gap-2 text-[12.5px] tracking-[0.09em] opacity-55 mb-2">
            <Star size={12} /> очередь пуста
          </div>
          <div className="text-[24px] font-semibold leading-[1.2] tracking-[-0.4px] mb-5">
            время задумать новый ролик
          </div>
          <input className="field-line mb-4" placeholder="как назовём ролик?" maxLength={60} value={name}
            onChange={(e) => setName(e.target.value)} />
          <DatePicker value={date} min={addD(7)} quicks={[["2 недели", 14], ["3 недели", 21], ["месяц", 30]]} onChange={setDate} />
          <button className="btn btn-solid w-full h-[52px] text-[16px]"
            onClick={() => { const n = name.trim(); if (!n) return; api.addVideo(n, date); setName(""); }}>
            создать <Star size={15} />
          </button>
          <div className="text-[12.5px] opacity-50 mt-3.5 leading-snug">
            план займёт примерно {TPL_DAYS} раб. дней по 5,5 часов
          </div>
        </div>
      )}

      {st && (
        <div className="sg px-2 pt-5" style={{ "--n": 2 } as any}>
          <div className="flex justify-between text-[13.5px]" style={{ color: "var(--mu)" }}>
            <span>шаги <b className="ml-1 font-semibold" style={{ color: "var(--tx)" }}>{st.done}/{st.all}</b></span>
            <span>до выхода <b className="ml-1 font-semibold" style={{ color: "var(--tx)" }}>{dd === null ? "—" : dd + " дн"}</b></span>
          </div>
          <div className="pb mt-3"><i className="anim" style={{ width: (st.all ? (st.done / st.all) * 100 : 0) + "%" }} /></div>
          {ps && <div className="text-center text-[12.5px] mt-2.5" style={{ color: "var(--mu)" }}>{ps}</div>}
        </div>
      )}

      <div className="flex-1" />

      <div className="sg" style={{ "--n": 3 } as any}>
        <HonorBar honor={state.honor} streak={state.streak} />
        <div className="text-center mt-4 text-[13px] flex items-center justify-center gap-3" style={{ color: "var(--mu)" }}>
          <span>sixteendope ©</span>
          <span className="opacity-40">·</span>
          <button className="bg-transparent border-0 p-0 cursor-pointer font-inherit text-[13px]"
            style={{ color: "var(--mu)", fontFamily: "inherit" }}
            onClick={() => openModal({ type: "reset" })}>
            сбросить
          </button>
        </div>
      </div>
    </div>
  );
}
