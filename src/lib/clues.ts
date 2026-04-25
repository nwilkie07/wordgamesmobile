import pako from 'pako';

let cluesCache: Record<string, string[]> | null = null;
let loading = false;
let loadPromise: Promise<void> | null = null;

export async function loadClues(): Promise<void> {
  if (cluesCache) return;
  if (loading && loadPromise) return loadPromise;

  loading = true;
  loadPromise = (async () => {
    try {
      const response = await fetch(require('../assets/clues.json.gz'));
      const buffer = await response.arrayBuffer();
      const decompressed = pako.ungzip(new Uint8Array(buffer));
      const text = new TextDecoder().decode(decompressed);
      cluesCache = JSON.parse(text);
      console.log('[clues] Loaded clues database, words:', Object.keys(cluesCache).length);
    } catch (e) {
      console.error('[clues] Failed to load clues:', e);
      try {
        const text = require('../assets/clues.json');
        cluesCache = typeof text === 'string' ? JSON.parse(text) : text;
        console.log('[clues] Loaded from fallback');
      } catch (fallbackErr) {
        console.error('[clues] Fallback also failed:', fallbackErr);
        cluesCache = {};
      }
    }
    loading = false;
  })();

  return loadPromise;
}

export function getClues(word: string): string[] | null {
  if (!cluesCache) return null;
  const clues = cluesCache[word.toLowerCase()];
  if (!clues || clues.length === 0) return null;
  return clues;
}

export function getRandomClue(word: string): string | null {
  const clues = getClues(word);
  if (!clues || clues.length === 0) return null;
  return clues[Math.floor(Math.random() * clues.length)];
}

export function hasClue(word: string): boolean {
  if (!cluesCache) return false;
  const clues = cluesCache[word.toLowerCase()];
  return Array.isArray(clues) && clues.length > 0;
}

export function isLoaded(): boolean {
  return cluesCache !== null;
}

export function getCluesCount(): number {
  if (!cluesCache) return 0;
  return Object.keys(cluesCache).length;
}