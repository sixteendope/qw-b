import { Component, ReactNode, useEffect, useRef, useState } from "react";
import { hc } from "../lib/planner";
import { cn } from "../utils/cn";

/* ————— error boundary: вместо белого экрана — понятное сообщение ————— */
export class ErrorBoundary extends Component<{ children: ReactNode }, { err: string | null }> {
  state = { err: null as string | null };
  static getDerivedStateFromError(e: any) {
    return { err: String((e && e.message) || e) };
  }
  render() {
    if (this.state.err)
      return (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-[999] flex items-center justify-center p-7 text-center"
          style={{ background: "var(--bg)", color: "var(--tx)" }}>
          <div className="max-w-[340px]">
            <div className="text-[40px] leading-none mb-4">✦</div>
            <div className="font-disp text-[19px] font-semibold mb-2">что-то сломалось</div>
            <div className="text-[13.5px] mb-5 leading-relaxed" style={{ color: "var(--mu)" }}>{this.state.err}</div>
            <button className="btn btn-solid h-12 px-7" onClick={() => location.reload()}>перезапустить</button>
          </div>
        </div>
      );
    return this.props.children;
  }
}

/* ————— иконки ————— */
export const Star = ({ size = 26, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M12 1.5Q13.1 10.9 22.5 12Q13.1 13.1 12 22.5Q10.9 13.1 1.5 12Q10.9 10.9 12 1.5Z" />
  </svg>
);
export const Plus = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const Reset = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
    <path d="M3.5 4v4.5H8" />
  </svg>
);
export const Half = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M12 3.6a8.4 8.4 0 0 1 0 16.8Z" fill="currentColor" />
  </svg>
);
export const X = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const Chevron = ({ size = 18, left }: { size?: number; left?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
    style={left ? { transform: "rotate(180deg)" } : undefined} aria-hidden>
    <path d="M9 5l7 7-7 7" />
  </svg>
);
export const Bolt = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M13 2 4.5 13.5H11L9.8 22l8.7-11.5H12L13 2Z" />
  </svg>
);

/* ————— шапка ————— */
export function Header({ title, sub, right, n = 0 }: { title: string; sub?: string; right?: ReactNode; n?: number }) {
  return (
    <div className="sg flex items-center justify-between gap-3 mt-1 mb-5" style={{ "--n": n } as any}>
      <div className="min-w-0">
        <h1 className="font-disp text-[26px] leading-[1.15] font-semibold tracking-tight m-0 truncate">{title}</h1>
        {sub && <div className="text-[13px] mt-1" style={{ color: "var(--mu)" }}>{sub}</div>}
      </div>
      <div className="flex gap-2 flex-none">{right}</div>
    </div>
  );
}

/* ————— честь (как в rdr2): растёт от выполненных в срок шагов, падает от нарушений ————— */
export function HonorBar({ honor, streak }: { honor: number; streak: number }) {
  const c = hc(honor);
  const prev = useRef(honor);
  const [delta, setDelta] = useState<number | null>(null);
  useEffect(() => {
    if (prev.current !== honor) {
      setDelta(honor - prev.current);
      prev.current = honor;
      const t = setTimeout(() => setDelta(null), 1900);
      return () => clearTimeout(t);
    }
  }, [honor]);
  return (
    <div className="px-1 pt-6 pb-1">
      <div className="hon-track mx-[13px]">
        <div className="hon-knob" style={{ left: `calc((100% - 27px) * ${honor / 100})`, color: c }}>
          {delta !== null && (
            <span key={delta + "" + honor} className="hon-delta" style={{ color: delta > 0 ? c : "#ff5468" }}>
              {(delta > 0 ? "+" : "−") + Math.abs(delta)}
            </span>
          )}
          <Star size={13} />
        </div>
      </div>
      <div className="flex justify-between items-center mt-3 text-[12.5px] tracking-[0.08em]" style={{ color: "var(--mu)" }}>
        <span>честь</span>
        <span className="flex items-center gap-3">
          {streak > 1 && (
            <span className="flex items-center gap-1 font-semibold" style={{ color: c }}>
              <Star size={11} />{streak} дн подряд
            </span>
          )}
          <b className="font-disp text-[13px] font-medium" style={{ color: c }}>{honor}</b>
        </span>
      </div>
    </div>
  );
}

/* ————— модалка ————— */
export function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true">{children}</div>
    </div>
  );
}
export function ModalTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-disp text-[20px] font-semibold m-0 mb-4 tracking-tight">{children}</h2>;
}

/* ————— тост с undo ————— */
export function Toast({ msg, undo, onUndo, onDone }: { msg: string; undo?: boolean; onUndo: () => void; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="toast">
      <span>{msg}</span>
      {undo && (
        <button className="btn btn-inv h-8 px-4 text-[13px]" onClick={onUndo}>вернуть</button>
      )}
    </div>
  );
}

/* ————— мелочи ————— */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("text-[12px] tracking-[0.09em] uppercase", className)} style={{ color: "var(--mu)" }}>
      {children}
    </span>
  );
}
