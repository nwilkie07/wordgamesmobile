let wordsCache: { word: string; length: number }[] = [];
let loaded = false;

export async function loadWords(): Promise<{ word: string; length: number }[]> {
  if (loaded) return wordsCache;

  try {
    const WORD_LIST = require('../db/wordlist.js');

    if (!WORD_LIST || !Array.isArray(WORD_LIST)) {
      throw new Error('Word list not loaded');
    }

    wordsCache = WORD_LIST.map((word: string) => ({ word, length: word.length }));
    loaded = true;
    console.log(`[db] Loaded ${wordsCache.length} words`);
    return wordsCache;
  } catch (e) {
    console.error('Failed to load words', e);
    return [];
  }
}

export function getWords() {
  return wordsCache;
}

export function isLoaded() {
  return loaded;
}