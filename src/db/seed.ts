let wordsCache: { word: string; length: number }[] = [];
let loaded = false;

export async function loadWords(): Promise<{ word: string; length: number }[]> {
  if (loaded) return wordsCache;

  try {
    const module = require('../db/wordlist.js');
    let wordList: string[];

    if (Array.isArray(module)) {
      wordList = module;
    } else if (module && typeof module === 'object' && 'WORD_LIST' in module) {
      wordList = module.WORD_LIST;
    } else if (module && typeof module === 'object' && 'default' in module) {
      wordList = module.default;
    } else {
      throw new Error('Word list not loaded');
    }

    if (!Array.isArray(wordList)) {
      throw new Error('Word list not loaded');
    }

    wordsCache = wordList.map((word: string) => ({ word, length: word.length }));
    loaded = true;
    console.log(`[db] Loaded ${wordsCache.length} words`);
    return wordsCache;
  } catch (e) {
    console.error('Failed to load words', e);
    throw e;
  }
}

export function getWords() {
  if (!loaded || wordsCache.length === 0) {
    throw new Error('Word list not loaded - call loadWords() first');
  }
  return wordsCache;
}

export function isLoaded() {
  return loaded;
}