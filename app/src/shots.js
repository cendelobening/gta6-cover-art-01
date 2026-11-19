// Fixed scenes for screenshots: ?shot=editor shows the editor with a photo
// loaded; ?shot=cover shows the finished cover alone, at an export size.
// Query params: photo (sample for the hero), photo2 (sample for the small
// panels), panels (comma-separated sample names, one per panel), caption,
// sub, layout, grade, size, oy (hero pan, -0.5..0.5, positive shows the top
// of the photo). window.__shotReady is set once the scene is painted, so a
// headless screenshot can wait for it.
export async function runShot(shot, query, applyScene) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const hero = query.get('photo') ?? 'pier';
  const small = query.get('photo2') ?? 'boulevard';
  const listed = query.get('panels');
  const panels = listed
    ? listed.split(',').map((name) => name.trim()).filter(Boolean)
    : [hero, small, small, small];
  const oy = Number(query.get('oy') ?? '0');
  applyScene({
    layout: query.get('layout') ?? 'hero-duo',
    grade: query.get('grade') ?? 'sunset',
    size: query.get('size') ?? '1920x1080',
    title: query.get('caption') ?? 'Sunset Heist',
    subtitle: query.get('sub') ?? 'One last score under the neon sky',
    panels: panels.map((photo, i) => (i === 0 && oy ? { photo, oy } : photo)),
  });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
