export function landscape() {
  const clouds = [12, 38, 61, 85].map((x, i) =>
    `<i class="sky-cloud" style="--x:${x}%;--y:${8 + i % 3 * 8}%;--duration:${46 + i * 13}s;--delay:${-11 * i}s"></i>`).join("");
  const grass = Array.from({length: 24}, (_, i) => {
    const x = i * 4.4;
    const height = 22 + i * 17 % 48;
    return `<g transform="translate(${x} 100)"><path style="--sway:${3.8 + i % 5 * .36}s;--delay:${-i * .27}s" d="M0 0Q-1 ${-height*.6} -2 ${-height}Q3 ${-height*.65} 2 0ZM1 0Q2 ${-height*.54} 6 ${-height*.85}Q4 ${-height*.41} 3 0ZM0 0Q-4 ${-height*.44} -8 ${-height*.70}Q-5 ${-height*.17} -2 0Z"/></g>`;
  }).join("");
  const bubbles = [28, 62, 44].map((y, i) =>
    `<i class="sky-bubble" style="--y:${y}%;--size:${[64,31,93][i]}px;--duration:${[42,57,72][i]}s;--delay:${[-9,-24,-48][i]}s;--drift:${[-62,29,-98][i]}px"></i>`).join("");
  return `<div class="landscape" aria-hidden="true"><div class="sky-glow"></div>${clouds}<svg class="sky-grass" viewBox="0 0 100 100" preserveAspectRatio="none">${grass}</svg>${bubbles}</div>`;
}
