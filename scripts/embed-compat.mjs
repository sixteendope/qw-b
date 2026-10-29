/* встраивает резервную копию приложения (классический бандл + стили) в index.html:
   1. CSS берётся из последней сборки vite (dist/index.html, инлайновый <style>)
   2. JS — предварительно собранный esbuild'ом классический бандл (compat.js)
   маркеры __COMPAT_CSS__ / __COMPAT_JS__ заменяются на экранированный контент */
import { readFileSync, writeFileSync } from "fs";

const dist = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
const compatJs = readFileSync(new URL("../compat.js", import.meta.url), "utf8");
const htmlPath = new URL("../index.html", import.meta.url);
let html = readFileSync(htmlPath, "utf8");

const m = dist.match(/<style[^>]*>([\s\S]*?)<\/style>/);
if (!m) throw new Error("в dist/index.html не найден инлайновый <style>");
const css = m[1];

const esc = (s) => s.replace(/<\/script/gi, "<\\/script");

if (!html.includes("__COMPAT_CSS__") || !html.includes("__COMPAT_JS__"))
  throw new Error("в index.html нет маркеров __COMPAT_CSS__/__COMPAT_JS__");

html = html.replace("__COMPAT_CSS__", esc(css));
html = html.replace("__COMPAT_JS__", esc(compatJs));
writeFileSync(htmlPath, html);

console.log(
  "встроено: css " + (css.length / 1024).toFixed(0) + " КБ, js " + (compatJs.length / 1024).toFixed(0) + " КБ, " +
  "index.html теперь " + (html.length / 1024).toFixed(0) + " КБ"
);
