import { useMemo, useState } from "react";
import { Api } from "../hooks/usePlanner";
import { State, addD, day, fm } from "../lib/planner";
import { Header, Half, Star } from "./ui";

function Heatmap({ state }: { state: State }) {
  const mint = state.theme === "dark" ? "69,224,154" : "20,158,99";
  const { weeks, labels } = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const wks: string[][] = [];
    for (let w = 11; w >= 0; w--) {
      const col: string[] = [];
      for (let r = 0; r < 7; r++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() - w * 7 + r);
        col.push(day(d));
      }
      wks.push(col);
    }
    return { weeks: wks, labels: ["пн", "", "ср", "", "пт", "", ""] };
  }, []);

  return (
    <div className="card p-4 mb-2.5">
      <div className="flex justify-between items-baseline mb-3.5">
        <span className="text-[15.5px] font-semibold">активность</span>
        <span className="text-[12px]" style={{ color: "var(--mu)" }}>12 недель</span>
      </div>
      <div className="flex gap-1 justify-between">
        <div className="flex flex-col gap-1 pr-1">
          {labels.map((l, i) => (
            <span key={i} className="h-[15px] leading-[15px] text-[9.5px]" style={{ color: "var(--mu)" }}>{l}</span>
          ))}
        </div>
        {weeks.map((col, w) => (
          <div key={w} className="flex flex-col gap-1 flex-1">
            {col.map((k) => {
              const L = state.log[k];
              const m = L?.m || 0;
              const a = m <= 0 ? 0 : 0.28 + 0.72 * Math.min(1, m / 240);
              const future = k > day();
              return (
                <div key={k} className="heat-cell w-full aspect-square"
                  title={L && L.d ? k.split("-").reverse().slice(0, 2).join(".") + " · " + Math.round(m) + " мин · " + L.d + " шаг." : ""}
                  style={{
                    background: future ? "transparent"
                      : a ? `rgba(${mint},${a.toFixed(2)})`
                      : "rgba(128,128,128,0.14)",
                  }} />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 justify-end mt-3 text-[10.5px]" style={{ color: "var(--mu)" }}>
        меньше
        {[0, 35, 70, 100].map((a) => (
          <span key={a} className="w-[11px] h-[11px] rounded-[3px]"
            style={{ background: a ? `rgba(${mint},${(a / 100).toFixed(2)})` : "rgba(128,128,128,0.14)" }} />
        ))}
        больше
      </div>
    </div>
  );
}

export function Summary({ state, api }: { state: State; api: Api }) {
  const L = state.log[day()] || { d: 0, m: 0, t: [] };
  const week = useMemo(() => {
    let m = 0, d = 0;
    for (let i = 0; i < 7; i++) {
      const l = state.log[addD(-i)];
      if (l) { m += l.m; d += l.d; }
    }
    return { m, d };
  }, [state.log]);

  const cats = useMemo(() => {
    const out: { g: string; m: number; items: { n: string; m: number }[] }[] = [];
    (L.t || []).forEach((x) => {
      let c = out.find((o) => o.g === (x.g || "прочее"));
      if (!c) { c = { g: x.g || "прочее", m: 0, items: [] }; out.push(c); }
      c.m += x.m;
      c.items.push(x);
    });
    return out;
  }, [L]);

  const [openCat, setOpenCat] = useState<string | null>(null);
  let n = 1;

  return (
    <div className="pb-4">
      <Header title="итоги" sub="сегодня и за неделю" n={0}
        right={<button className="rb" aria-label="тема" onClick={api.theme}><Half /></button>} />

      <div className="sg grid grid-cols-2 gap-2.5" style={{ "--n": n++ } as any}>
        {[
          ["шагов сегодня", String(L.d), null],
          ["времени сегодня", fm(L.m) + " мин", null],
          ["за 7 дней", fm(week.m) + " мин", week.d + " шагов"],
          ["серия", state.streak ? state.streak + " дн" : "—", state.streak > 1 ? "✦ в ударе" : "начни сегодня"],
        ].map(([a, b, c]) => (
          <div key={a as string} className="card px-4 py-3.5">
            <div className="text-[11.5px] tracking-[0.1em]" style={{ color: "var(--mu)" }}>{a}</div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <b className="font-disp text-[22px] font-medium tracking-tight">{b}</b>
              {c && <span className="text-[11.5px]" style={{ color: "var(--mint)" }}>{c}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="sg mt-2.5" style={{ "--n": n++ } as any}>
        <Heatmap state={state} />
      </div>

      <div className="sg text-[19px] font-semibold tracking-[-0.3px] mt-5 mb-2.5 px-1" style={{ "--n": n++ } as any}>
        сегодня по этапам
      </div>
      {!cats.length && <p className="px-1 py-3 text-[14px]" style={{ color: "var(--mu)" }}>сегодня пока пусто</p>}
      {cats.map((c) => (
        <div key={c.g} className="card px-4 pt-1 pb-1 mb-2.5">
          <div className="flex justify-between items-center gap-2.5 min-h-[46px] cursor-pointer"
            onClick={() => setOpenCat(openCat === c.g ? null : c.g)}>
            <span className="text-[15.5px] font-semibold">{c.g}</span>
            <span className="text-[12.5px] flex items-center gap-1.5" style={{ color: "var(--mu)" }}>
              {c.items.length} шаг. · {fm(c.m)} мин
              <Star size={9} className={"transition-transform duration-500 " + (openCat === c.g ? "rotate-90" : "")} />
            </span>
          </div>
          <div className={"gbody" + (openCat === c.g ? "" : " shut")}>
            <div>
              <div className="pb-3 border-t" style={{ borderColor: "var(--c2)" }}>
                {c.items.map((x, i) => (
                  <div key={i} className="flex justify-between gap-3 text-[13px] pt-2" style={{ color: "var(--mu)" }}>
                    <span className="truncate">{x.n}</span><span className="whitespace-nowrap">{fm(x.m)} мин</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
