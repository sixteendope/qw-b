import { useState } from "react";
import { Api } from "../hooks/usePlanner";
import { State, fd, fm } from "../lib/planner";
import { Header, Half, Star } from "./ui";

function HCard({ title, meta, children, n }: { title: string; meta: string; children?: React.ReactNode; n: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={"card px-4 mb-2.5" + (children ? " pb-1 pt-1" : " py-3.5")}
      style={{ animation: `rise .6s cubic-bezier(.3,.8,.3,1) ${n * 65 + 90}ms both` }}>
      <div className="flex justify-between items-center gap-2.5 min-h-[46px] cursor-pointer" onClick={() => children && setOpen(!open)}>
        <span className="text-[15.5px] font-semibold min-w-0 truncate">{title}</span>
        <span className="text-[12.5px] whitespace-nowrap flex items-center gap-1.5" style={{ color: "var(--mu)" }}>
          {meta}
          {children && <Star size={9} className={"transition-transform duration-500 " + (open ? "rotate-90" : "")} />}
        </span>
      </div>
      {children && (
        <div className={"gbody" + (open ? "" : " shut")}>
          <div>
            <div className="pb-3 pt-1 border-t" style={{ borderColor: "var(--c2)" }}>{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export function History({ state, api }: { state: State; api: Api }) {
  let n = 1;
  const days = Object.keys(state.log).sort().reverse().filter((k) => state.log[k].d > 0);
  return (
    <div className="pb-4">
      <Header title="история" sub={state.hist.length ? state.hist.length + " роликов выпущено" : undefined} n={0}
        right={<button className="rb" aria-label="тема" onClick={api.theme}><Half /></button>} />

      <div className="sg text-[19px] font-semibold tracking-[-0.3px] mt-4 mb-2.5 px-1" style={{ "--n": n++ } as any}>ролики</div>
      {!state.hist.length && (
        <p className="px-1 py-3 text-[14px]" style={{ color: "var(--mu)" }}>пока нет завершённых — первый ролик ждёт</p>
      )}
      {state.hist.map((v, i) => {
        let tm = 0, sc = 0;
        const ds: Record<string, 1> = {};
        v.groups.forEach((g) => g.tasks.forEach((t) => {
          tm += t.a || 0; sc++;
          if (t.dd) ds[t.dd] = 1;
        }));
        return (
          <HCard key={i} n={n++} title={v.n} meta={v.end.slice(5).split("-").reverse().join(".")}>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                ["время", fm(tm) + " мин"],
                ["в работе", Object.keys(ds).length + " дн"],
                ["шагов", String(sc)],
              ].map(([a, b]) => (
                <div key={a} className="rounded-2xl px-3 py-2.5" style={{ background: "rgba(var(--tx-rgb),0.05)" }}>
                  <div className="text-[11px] tracking-[0.08em]" style={{ color: "var(--mu)" }}>{a}</div>
                  <div className="font-disp text-[16px] font-medium mt-1">{b}</div>
                </div>
              ))}
            </div>
            {v.groups.map((g) => {
              const gm = g.tasks.reduce((s, t) => s + (t.a || 0), 0);
              return (
                <div key={g.id} className="py-1.5">
                  <div className="flex justify-between text-[14.5px] font-semibold">
                    <span>{g.n}</span><span style={{ color: "var(--mu)" }}>{Math.round(gm)} мин</span>
                  </div>
                  {g.tasks.filter((t) => (t.a || 0) > 0).map((t) => (
                    <div key={t.id} className="flex justify-between gap-3 text-[13px] pl-3 py-0.5" style={{ color: "var(--mu)" }}>
                      <span className="truncate">{t.n}</span><span className="whitespace-nowrap">{Math.round(t.a || 0)} мин</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </HCard>
        );
      })}

      <div className="sg text-[19px] font-semibold tracking-[-0.3px] mt-7 mb-2.5 px-1" style={{ "--n": n++ } as any}>дни</div>
      {!days.length && <p className="px-1 py-3 text-[14px]" style={{ color: "var(--mu)" }}>пока пусто</p>}
      {days.slice(0, 30).map((k) => {
        const L = state.log[k];
        return (
          <HCard key={k} n={n++} title={fd(k)} meta={L.d + " шагов · " + Math.round(L.m) + " мин"} />
        );
      })}
    </div>
  );
}
