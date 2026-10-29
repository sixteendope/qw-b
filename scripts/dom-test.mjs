/* запуск собранного dist/index.html в jsdom как есть:
   jsdom игнорирует <script type="module"> — как старый Safari / просмотр файла.
   Проверяет, что приложение всё равно поднимается (compat-путь), и кликает по UI. */
import { readFileSync } from "fs";
import { JSDOM } from "jsdom";

const MODULE = !!process.env.MODULE;
let html = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
let deferredBundle = null;
if (MODULE) {
  // jsdom не умеет module-скрипты: вырезаем бандл и выполняем его после парсинга
  // (в конце body) — это честная эмуляция deferred-семантики module-скриптов в браузере
  const bundle = html.match(/<script type="module"[^>]*>([\s\S]*?)<\/script>/);
  if (!bundle) throw new Error("module-бандл не найден");
  if (/(^|\n)\s*(import|export)\s/m.test(bundle[1])) throw new Error("бандл не совместим с классическим скриптом");
  deferredBundle = bundle[1];
  html = html.replace(/<script type="module"[^>]*>[\s\S]*?<\/script>/, "");
}
console.log(MODULE ? "режим: основной (vite-бандл, deferred-эмуляция)" : "режим: резервный (module не выполняется)");

// localStorage с реальными v1-данными пользователя (до выполнения скриптов)
const seed = (window) => window.localStorage.setItem(
  "planer_yt_v1",
  JSON.stringify({
    theme: "dark", honor: 42, view: "today", last: "2026-02-01", pen: "",
    videos: [{
      id: "v1", n: "ролик про бироллы", date: "2026-03-01",
      groups: [
        { id: "g1", n: "подготовка", tasks: [
          { id: "t1", n: "сценарий", y: "t", m: 90, done: 1, a: 84, dt: "2026-02-02", dd: "2026-02-02" },
          { id: "t2", n: "список бироллов", y: "t", m: 30, done: 0, dt: "2026-02-03" },
        ]},
        { id: "g2", n: "съёмка", tasks: [
          { id: "t3", n: "говорящая голова", y: "s", m: 60, done: 0, dt: "2026-02-04" },
        ]},
      ],
    }],
    hist: [], ideas: ["ролик про setup"], log: { "2026-02-02": { d: 1, m: 84, t: [{ n: "сценарий", m: 84, g: "подготовка" }] } },
  })
);

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "http://localhost/",
  beforeParse: seed,
});
const { window } = dom;
const { document } = window;

const errors = [];
window.addEventListener("error", (e) => errors.push(e.message || "unknown"));

if (MODULE) {
  const s = document.createElement("script");
  s.textContent = deferredBundle;
  document.body.appendChild(s);
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

const t0 = Date.now();
let mounted = false;
for (let i = 0; i < 60; i++) {
  await sleep(250);
  if (document.getElementById("root") && document.getElementById("root").childElementCount > 0) {
    mounted = true;
    break;
  }
}
const bootMs = Date.now() - t0;

if (!mounted) {
  console.log("FAIL: приложение не смонтировалось за 15 секунд");
  console.log("ошибки:", errors);
  console.log("fail-overlay:", document.getElementById("__fail") ? document.getElementById("__fail").textContent.slice(0, 120) : "нет");
  process.exit(1);
}
console.log(`ok: приложение смонтировалось за ${bootMs} мс (${MODULE ? "основной путь" : "compat-путь, module-скрипт игнорировался"})`);

// кликаем по UI: отметить задачу, открыть видео, итоги, историю, модалку идей
function click(sel) {
  const el = document.querySelector(sel);
  if (!el) throw new Error("не найден: " + sel);
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
}
function fire(el) {
  if (!el) throw new Error("элемент не найден");
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
}
function tab(name) {
  return [...document.querySelectorAll(".tab")].find((b) => b.textContent.includes(name));
}
try {
  // «начать» → экран таймера → «завершить» → задача закрыта
  fire([...document.querySelectorAll("button")].find((b) => /начать|снято|готово/.test(b.textContent)));
  await sleep(300);
  if (!document.querySelector(".digit")) throw new Error("нет цифр таймера");
  fire([...document.querySelectorAll("button")].find((b) => b.textContent.includes("завершить")));
  await sleep(300);
  // таб «видео»
  fire(tab("видео"));
  await sleep(300);
  const rows = document.querySelectorAll(".row");
  if (!rows.length) throw new Error("в «видео» нет задач");
  fire(rows[0]); // отметить задачу
  await sleep(300);
  // итоги
  fire(tab("итоги"));
  await sleep(300);
  if (!document.querySelector(".heat-cell")) throw new Error("нет heatmap");
  // история
  fire(tab("история"));
  await sleep(300);
  // удалить задачу → тост с undo
  fire(tab("видео"));
  await sleep(300);
  const del = document.querySelector(".del");
  if (del) {
    fire(del);
    await sleep(300);
    if (!document.querySelector(".toast")) throw new Error("нет тоста после удаления");
    fire([...document.querySelectorAll(".toast button")].find((b) => b.textContent.includes("вернуть")));
    await sleep(300);
  }
  console.log("ok: клики по UI (таймер, задачи, табы, undo) без падений");
} catch (e) {
  console.log("FAIL при кликах: " + e.message);
  console.log("ошибки окна:", errors);
  process.exit(1);
}

const fatal = errors.filter((m) => !/not implemented/i.test(m));
if (fatal.length) {
  console.log("ошибки окна (нераспознанные):", fatal);
  process.exit(1);
}
console.log("ok: window-ошибок нет");
process.exit(0);
