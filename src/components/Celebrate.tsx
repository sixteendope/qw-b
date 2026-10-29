import { useEffect, useRef } from "react";
import { hc } from "../lib/planner";
import { Star } from "./ui";

export function Celebrate({ honor, onDone }: { honor: number; onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.scale(dpr, dpr);

    const colors = [hc(honor), hc(Math.min(100, honor + 25)), "#ffffff", "#ffb234"];
    const parts = Array.from({ length: 52 }, () => {
      const a = Math.random() * Math.PI * 2;
      const sp = 2.2 + Math.random() * 7.5;
      return {
        x: W / 2, y: H / 2,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5,
        r: 5 + Math.random() * 11,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.25,
        c: colors[(Math.random() * colors.length) | 0],
        life: 1, decay: 0.008 + Math.random() * 0.01,
      };
    });

    let raf = 0;
    const t0 = performance.now();
    const drawStar = (x: number, y: number, r: number, rot: number) => {
      ctx.beginPath();
      const k = 0.18;
      for (let i = 0; i < 8; i++) {
        const rr = i % 2 === 0 ? r : r * k;
        const ang = rot + (i * Math.PI) / 4;
        const px = x + Math.cos(ang) * rr, py = y + Math.sin(ang) * rr;
        // лёгкое "вдавливание" сторон звезды
        if (i === 0) ctx.moveTo(px, py);
        else {
          const midA = rot + ((i - 0.5) * Math.PI) / 4;
          const mr = (i % 2 === 0 ? r : r * k) * 0.82;
          ctx.quadraticCurveTo(x + Math.cos(midA) * mr, y + Math.sin(midA) * mr, px, py);
        }
      }
      ctx.closePath();
      ctx.fill();
    };

    const loop = (t: number) => {
      const el = t - t0;
      ctx.clearRect(0, 0, W, H);
      parts.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.055; p.vx *= 0.992;
        p.rot += p.vr; p.life -= p.decay;
        if (p.life <= 0) return;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.c;
        ctx.shadowColor = p.c;
        ctx.shadowBlur = 10;
        drawStar(p.x, p.y, p.r * (0.5 + p.life * 0.5), p.rot);
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      if (el < 2200) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const done = setTimeout(onDone, 3000);
    try { navigator.vibrate?.([20, 50, 20]); } catch { /* noop */ }
    return () => { cancelAnimationFrame(raf); clearTimeout(done); };
  }, [honor, onDone]);

  return (
    <div className="celeb-bg" onClick={onDone}>
      <canvas ref={ref} className="fixed inset-0 w-full h-full pointer-events-none" />
      <div className="flex flex-col items-center gap-5 pointer-events-none">
        <Star size={92} className="celeb-star" />
        <div className="font-disp text-[22px] font-semibold tracking-tight"
          style={{ animation: "rise .7s .25s cubic-bezier(.3,.8,.3,1) both" }}>
          ролик выпущен
        </div>
        <div className="text-[13.5px] -mt-3" style={{ color: "var(--mu)", animation: "fadeIn 1s .6s both" }}>
          +15 к чести · нажми, чтобы продолжить
        </div>
      </div>
    </div>
  );
}
