// grades.js — the four colour grades, three poster sizes and four panel layouts
// of Vice Cover Studio. A grade is one CSS filter chain applied to every panel
// photo, a frame colour, and the three stops of the title gradient. The colour
// grades carry no global dark overlay; Noir alone adds its vignette.

export const GRADES = {
  sunset: {
    label: 'Sunset',
    filter: 'sepia(0.28) saturate(1.35) hue-rotate(-12deg) contrast(1.06) brightness(1.03)',
    frame: '#40143a',
    titleStops: ['#ffffff', '#ffc46b', '#ff5e7a'],
    tagline: '#ffe9c9',
    vignette: 0,
  },
  neon: {
    label: 'Neon',
    filter: 'saturate(1.55) contrast(1.12) hue-rotate(-8deg) brightness(1.02)',
    frame: '#101b3c',
    titleStops: ['#ffffff', '#6bf2ff', '#ff3df0'],
    tagline: '#d8fbff',
    vignette: 0,
  },
  vice: {
    label: 'Vice Pink',
    filter: 'saturate(1.3) hue-rotate(-18deg) brightness(1.06) contrast(1.05) sepia(0.12)',
    frame: '#3d0a2e',
    titleStops: ['#ffffff', '#ffb3d9', '#ff2e88'],
    tagline: '#ffe3f1',
    vignette: 0,
  },
  noir: {
    label: 'Noir',
    filter: 'grayscale(1) contrast(1.5) brightness(1.04)',
    frame: '#101014',
    titleStops: ['#ffffff', '#d7dde6', '#79828e'],
    tagline: '#e8ecf1',
    vignette: 0.5,
  },
};

export const SIZES = {
  landscape: { label: '1280 × 720', w: 1280, h: 720 },
  portrait: { label: '1024 × 1280', w: 1024, h: 1280 },
  square: { label: '1024 × 1024', w: 1024, h: 1024 },
};

// Each layout is a list of panel rectangles in fractions of the poster field.
// hero-duo: one hero panel over two. hero-trio: one hero over three.
// split: two equal columns. quad: a two-by-two grid.
export const LAYOUTS = {
  'hero-duo': {
    label: 'Hero + Duo',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.6 },
      { x: 0, y: 0.6, w: 0.5, h: 0.4 },
      { x: 0.5, y: 0.6, w: 0.5, h: 0.4 },
    ],
  },
  'hero-trio': {
    label: 'Hero + Trio',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.58 },
      { x: 0, y: 0.58, w: 1 / 3, h: 0.42 },
      { x: 1 / 3, y: 0.58, w: 1 / 3, h: 0.42 },
      { x: 2 / 3, y: 0.58, w: 1 / 3, h: 0.42 },
    ],
  },
  split: {
    label: 'Split',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  quad: {
    label: 'Quad Grid',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
};

export const SAMPLES = [
  { id: 'street', src: 'samples/street.jpg', label: 'Neon Street' },
  { id: 'pier', src: 'samples/pier.jpg', label: 'Pier Sunset' },
  { id: 'boulevard', src: 'samples/boulevard.jpg', label: 'Boulevard' },
  { id: 'marina', src: 'samples/marina.jpg', label: 'Marina' },
];

// The default photo order: the hero takes the first photo and the remaining
// slots take the next photos in order, so a poster never repeats a photo
// until its slots outnumber the four photos.
export function defaultAssignment(slotCount, photoCount) {
  const order = [];
  for (let i = 0; i < slotCount; i++) order.push(i % photoCount);
  return order;
}
