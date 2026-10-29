/* запасной вход: классический скрипт (ES2017) для сред, где не выполняется type="module" —
   старый Safari, просмотр файла на iOS и т.п. Собирается esbuild'ом и встраивается в index.html. */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ui";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
(window as any).__booted = true;
