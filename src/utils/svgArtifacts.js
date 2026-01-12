export function extractSvgStrings(text) {
  if (!text) return [];

  const input = Array.isArray(text) ? text.filter(Boolean).join('\n\n') : String(text);
  const found = [];

  // Raw <svg>...</svg>
  const svgRegex = /<svg[\s\S]*?<\/svg>/gi;
  let match;
  while ((match = svgRegex.exec(input)) !== null) {
    found.push(match[0]);
  }

  // ```svg ... ``` or ``` ... ``` blocks that contain <svg>
  const fenceRegex = /```(?:svg)?\s*([\s\S]*?)```/gi;
  while ((match = fenceRegex.exec(input)) !== null) {
    const block = match[1];
    const innerMatches = block.match(/<svg[\s\S]*?<\/svg>/gi);
    if (innerMatches) found.push(...innerMatches);
  }

  // De-dup
  const unique = [];
  const seen = new Set();
  for (const svg of found) {
    const normalized = svg.trim();
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(normalized);
  }

  return unique;
}

export function svgToDataUrl(svg) {
  const safe = String(svg)
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // data:image/svg+xml with URL-encoding.
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(safe)}`;
}

export function openSvgInNewTab(svg, title = 'SVG Preview') {
  const dataUrl = svgToDataUrl(svg);
  const html = `<!doctype html><html><head><meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>body{margin:0;padding:24px;font-family:system-ui,Segoe UI,Roboto,Arial;background:#0b1020;color:#fff} .wrap{max-width:1200px;margin:0 auto} img{max-width:100%;height:auto;background:#fff;border-radius:12px;padding:12px}</style>
</head><body><div class="wrap"><h2>${escapeHtml(title)}</h2><img alt="svg" src="${dataUrl}" /></div></body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function downloadSvg(svg, filename = `artifact-${Date.now()}.svg`) {
  const blob = new Blob([String(svg)], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
