import { useState } from "react";
import { Api } from "../hooks/usePlanner";
import { State, TPL_DAYS, WD, addD, day, vleft } from "../lib/planner";
import { DatePicker } from "./DatePicker";
import { Modal, ModalTitle, Star, X } from "./ui";

export type ModalState =
  | { type: "new" }
  | { type: "addt" }
  | { type: "rp"; id: string }
  | { type: "ideas" }
  | { type: "reset" }
  | null;

export function Modals({ modal, close, state, api }: { modal: ModalState; close: () => void; state: State; api: Api }) {
  if (!modal) return null;
  return <Modal onClose={close}>{modal.type === "new" ? <NewVideo api={api} close={close} />
    : modal.type === "addt" ? <AddTask state={state} api={api} close={close} />
    : modal.type === "rp" ? <Rebuild state={state} api={api} id={modal.id} close={close} />
    : modal.type === "ideas" ? <Ideas state={state} api={api} close={close} />
    : <ResetAll api={api} close={close} />}</Modal>;
}

function NewVideo({ api, close }: { api: Api; close: () => void }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(addD(14));
  return (
    <>
      <ModalTitle>новое видео</ModalTitle>
      <input className="field-line mb-5" placeholder="как назовём ролик?" maxLength={60} autoFocus value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { api.addVideo(name.trim(), date); close(); } }} />
      <DatePicker value={date} min={addD(7)} quicks={[["2 недели", 14], ["3 недели", 21], ["месяц", 30]]} onChange={setDate} />
      <div className="text-[12.5px] opacity-50 mb-5 leading-snug">план займёт примерно {TPL_DAYS} раб. дней по 5,5 часов</div>
      <button className="btn btn-solid w-full h-[50px] text-[16px]"
        onClick={() => { const n = name.trim(); if (!n) return; api.addVideo(n, date); close(); }}>
        создать <Star size={15} />
      </button>
    </>
  );
}

function AddTask({ state, api, close }: { state: State; api: Api; close: () => void }) {
  const [name, setName] = useState("");
  const [y, setY] = useState<"t" | "s" | "d">("t");
  const [m, setM] = useState(30);
  const [vid, setVid] = useState(state.videos[0]?.id || "own");
  return (
    <>
      <ModalTitle>новая задача</ModalTitle>
      <input className="field mb-2.5" placeholder="что сделать" maxLength={60} autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      <select className="field mb-2.5" value={vid} onChange={(e) => setVid(e.target.value)}>
        <option value="own">свои задачи</option>
        {state.videos.filter((v) => v.id !== "own").map((v) => <option key={v.id} value={v.id}>{v.n}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <select className="field" value={y} onChange={(e) => setY(e.target.value as any)}>
          <option value="t">с таймером</option>
          <option value="s">одним тапом</option>
          <option value="d">на день</option>
        </select>
        <input className="field" type="number" min={5} max={600} value={m} disabled={y === "d"}
          onChange={(e) => setM(+e.target.value || 30)} placeholder="минут" />
      </div>
      <button className="btn btn-solid w-full h-[50px] text-[16px] mt-2"
        onClick={() => { const n = name.trim(); if (!n) return; api.addTask(n, y, m, vid); close(); }}>
        добавить <Star size={15} />
      </button>
    </>
  );
}

function Rebuild({ state, api, id, close }: { state: State; api: Api; id: string; close: () => void }) {
  const v = state.videos.find((x) => x.id === id);
  const [date, setDate] = useState(v && v.date && v.date > day() ? v.date : addD(14));
  if (!v) return null;
  const l = vleft(v);
  return (
    <>
      <ModalTitle>пересобрать план</ModalTitle>
      <p className="text-[14px] leading-relaxed m-0 mb-4" style={{ color: "var(--mu)" }}>
        {v.n}: осталось {l.n} шагов — примерно {Math.max(1, Math.ceil(l.m / WD))} раб. дней по 5,5 часов.
        даты задач пересчитаются от сегодняшнего дня.
      </p>
      <DatePicker value={date} min={day()} quicks={[["неделя", 7], ["2 недели", 14], ["месяц", 30]]} onChange={setDate} />
      <button className="btn btn-solid w-full h-[50px] text-[16px]"
        onClick={() => { api.rebuild(id, date); close(); }}>
        пересобрать <Star size={15} />
      </button>
    </>
  );
}

function Ideas({ state, api, close }: { state: State; api: Api; close: () => void }) {
  const [text, setText] = useState("");
  return (
    <>
      <ModalTitle>идеи <span className="text-[13px] font-normal opacity-50 ml-1">{state.ideas.length || ""}</span></ModalTitle>
      <div className="flex gap-2 mb-4">
        <input className="field mb-0" placeholder="что пришло в голову" maxLength={80} value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) { api.addIdea(text.trim()); setText(""); } }} />
        <button className="btn btn-solid h-[52px] px-5 flex-none" onClick={() => { if (text.trim()) { api.addIdea(text.trim()); setText(""); } }}>
          записать
        </button>
      </div>
      {!state.ideas.length && (
        <p className="text-[13.5px] py-2 m-0" style={{ color: "var(--mu)" }}>
          лови мысли сразу — из них рождаются ролики
        </p>
      )}
      {state.ideas.map((x, i) => (
        <div key={x + i} className="flex items-center gap-2 py-2.5 border-t" style={{ borderColor: "var(--c2)" }}>
          <span className="flex-1 min-w-0 text-[14.5px] truncate">{x}</span>
          <button className="btn btn-soft h-8 px-3 text-[12px] flex-none" title="превратить в план ролика"
            onClick={() => { api.ideaVideo(i, addD(21)); close(); }}>
            в видео
          </button>
          <span className="del" style={{ color: "var(--mu)" }} onClick={() => api.delIdea(i)} aria-label="удалить"><X size={14} /></span>
        </div>
      ))}
    </>
  );
}

function ResetAll({ api, close }: { api: Api; close: () => void }) {
  return (
    <>
      <ModalTitle>сбросить всё?</ModalTitle>
      <p className="text-[14px] m-0 mb-5 leading-relaxed" style={{ color: "var(--mu)" }}>
        видео, история, идеи и итоги удалятся. в течение пары секунд это можно будет отменить.
      </p>
      <div className="flex gap-2.5">
        <button className="btn btn-solid flex-1 h-[50px] text-[15.5px]" style={{ background: "#ff5468", color: "#fff" }}
          onClick={() => { api.reset(); close(); }}>
          сбросить
        </button>
        <button className="btn btn-soft flex-1 h-[50px] text-[15.5px]" onClick={close}>отмена</button>
      </div>
    </>
  );
}
