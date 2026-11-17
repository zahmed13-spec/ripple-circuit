import { Arena3D, type Quality } from "./arena";
export function cameraControls(
  arena: Arena3D,
  container: HTMLElement,
  cancel: () => void,
) {
  const bar = document.createElement("div");
  bar.className = "camera-bar";
  bar.innerHTML =
    '<label>View <select aria-label="Camera view"><option value="isometric">Isometric</option><option value="classic">Classic</option><option value="top">Top-down</option></select></label><button aria-label="Zoom out">−</button><button aria-label="Zoom in">+</button><button aria-label="Reset camera">↺ View</button><label>Graphics <select aria-label="Graphics quality"><option value="auto">Auto</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>';
  container.append(bar);
  const selects = bar.querySelectorAll("select");
  try {
    const p = localStorage.getItem("ripple-graphics");
    if (p && ["auto", "low", "medium", "high"].includes(p)) {
      selects[1].value = p;
      arena.setQuality(p as Quality);
    }
  } catch {}
  selects[0].onchange = () => {
    cancel();
    arena.setCamera(selects[0].value, true);
  };
  selects[1].onchange = () => {
    arena.setQuality(selects[1].value as Quality);
    try {
      localStorage.setItem("ripple-graphics", selects[1].value);
    } catch {}
  };
  const buttons = bar.querySelectorAll("button");
  buttons[0].onclick = () => {
    cancel();
    arena.zoom = Math.max(0.8, arena.zoom - 0.1);
    arena.resize();
  };
  buttons[1].onclick = () => {
    cancel();
    arena.zoom = Math.min(1.15, arena.zoom + 0.1);
    arena.resize();
  };
  buttons[2].onclick = () => {
    cancel();
    arena.zoom = 1;
    selects[0].value = "isometric";
    arena.setCamera("isometric");
  };
}
