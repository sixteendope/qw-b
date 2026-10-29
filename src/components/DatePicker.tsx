import { useMemo, useState } from "react";
import { MN, WDN, WDS, addD, fs, pd } from "../lib/planner";
import { Chevron } from "./ui";

export function DatePicker({
  value, min = "", quicks = [], label = "выход", onChange,
}: {
  value: string;
  min?: string;
  quicks?: [string, number][];
  label?: string;
  onChange: (d: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(value.slice(0, 7));

  const quickOn = useMemo(() => quicks.findIndex(([, n]) => addD(n) === value), [quicks, value]);

  const cells = useMemo(() => {
    const [y, mo] = month.split("-").map(Number);
    const first = (new Date(y, mo - 1, 1).getDay() + 6) % 7;
    const n = new Date(y, mo + 1 - 1, 0).getDate();
    const out: (string | null)[] = [];
    for (let i = 0; i < first; i++) out.push(null);
    for (let d = 1; d <= n; d++) out.push(y + "-" + String(mo).padStart(2, "0") + "-" + String(d).padStart(2, "0"));
    return out;
  }, [month]);

  const [y, mo] = month.split("-").map(Number);
  const canPrev = !min || month > min.slice(0, 7);
  const d = pd(value);

  const move = (dir: number) => {
    const x = new Date(y, mo - 1 + dir, 1);
    const nm = x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0");
    if (min && nm < min.slice(0, 7)) return;
    setMonth(nm);
  };

  return (
    <div className="mb-4">
      {label && <div className="text-[11.5px] tracking-[0.14em] opacity-50 mb-2 ml-1">{label}</div>}
      <div className="flex gap-2 flex-wrap mb-3">
        {quicks.map(([lbl, n], i) => {
          const x = min && addD(n) < min ? min : addD(n);
          return (
            <button key={lbl} type="button" className={"dp-chip" + (quickOn === i ? " on" : "")}
              onClick={() => onChange(x)}>{lbl}</button>
          );
        })}
        <button type="button" className={"dp-chip" + (quickOn < 0 ? " on" : "")} onClick={() => setOpen(!open)}>
          {open ? "скрыть" : "дата"}
        </button>
      </div>
      <div className="flex items-baseline gap-2.5 mx-1 mb-1">
        <b className="text-[19px] font-semibold">{fs(value)}</b>
        <small className="text-[13.5px] opacity-50">{WDN[d.getDay()]}</small>
      </div>
      <div className={"gbody" + (open ? "" : " shut")}>
        <div>
          <div className="flex justify-between items-center px-0.5 py-1">
            <button type="button" className="rb !w-9 !h-9" style={{ visibility: canPrev ? "visible" : "hidden" }} onClick={() => move(-1)}>
              <Chevron left size={15} />
            </button>
            <b className="text-[15px] font-semibold">{MN[mo - 1]} {y}</b>
            <button type="button" className="rb !w-9 !h-9" onClick={() => move(1)}>
              <Chevron size={15} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-0.5 pb-1">
            {[1, 2, 3, 4, 5, 6, 0].map((wd) => (
              <i key={wd} className="flex items-center justify-center h-7 text-[11px] opacity-40 not-italic">{WDS[wd]}</i>
            ))}
            {cells.map((k, i) =>
              k === null ? <i key={"e" + i} /> : (
                <button type="button" key={k}
                  className={"dp-day justify-self-center" + (k === value ? " sel" : "") + (min && k < min ? " dis" : "")}
                  onClick={() => { onChange(k); setTimeout(() => setOpen(false), 200); }}>
                  {+k.slice(8)}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
