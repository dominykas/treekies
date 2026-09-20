// Knobs you might want to tweak. Everything else lives in public/data/*.json.

// Which language to show: 'lt' or 'en'. You can also add ?lang=en to the URL.
const params = new URLSearchParams(window.location.search);
export const LANG = params.get('lang') || 'lt';

// Start with the debug overlay on? Add ?debug to the URL, or press ` (backtick) in game.
export const DEBUG = params.has('debug');

// Size of one pathfinding cell in map pixels. Smaller = more precise but slower.
export const CELL_SIZE = 12;

// Camera zoom limits (1 = one map pixel per screen pixel).
export const MAX_ZOOM = 2;
export const START_ZOOM = 1;

// Pick a translated string from an object like { lt: '...', en: '...' }.
export function t(obj) {
  if (obj == null || typeof obj === 'string') return obj ?? '';
  return obj[LANG] ?? obj.lt ?? obj.en ?? '';
}
