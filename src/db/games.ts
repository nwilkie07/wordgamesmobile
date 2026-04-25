import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_ACTIVE_GAME_KEY = 'wordgames_last_active_game';

export type PanagramGame = {
  id: string;
  letters: string;
  centerLetter: string;
  foundWordsJson: string;
  score: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TargetGame = {
  id: string;
  letters: string;
  centerLetter: string;
  letterCounts: string;
  foundWordsJson: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LadderleGame = {
  id: string;
  targetWord: string;
  attemptsJson: string;
  completed: boolean;
  won: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CryptoquoteGame = {
  id: string;
  encryptedQuote: string;
  decryptedQuote: string;
  author: string;
  cipherMapJson: string;
  decryptedMapJson: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WordGuessGame = {
  id: string;
  targetWord: string;
  guessesJson: string;
  completed: boolean;
  won: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CrosswordGame = {
  id: string;
  puzzleId: string;
  entriesJson: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

const PANAGRAM_STORAGE_KEY = 'wordgames_panagram_games';
const TARGET_STORAGE_KEY = 'wordgames_target_games';
const LADDERLE_STORAGE_KEY = 'wordgames_ladderle_games';
const CRYPTOQUOTE_STORAGE_KEY = 'wordgames_cryptoquote_games';
const WORDGUESS_STORAGE_KEY = 'wordgames_wordguess_games';
const CROSSWORD_STORAGE_KEY = 'wordgames_crossword_games';

let panagramGames: PanagramGame[] = [];
let targetGames: TargetGame[] = [];
let ladderleGames: LadderleGame[] = [];
let cryptoquoteGames: CryptoquoteGame[] = [];
let wordguessGames: WordGuessGame[] = [];
let crosswordGames: CrosswordGame[] = [];

export async function loadGamesFromStorage(): Promise<void> {
  try {
    const pData = await AsyncStorage.getItem(PANAGRAM_STORAGE_KEY);
    if (pData) panagramGames = JSON.parse(pData);
    const tData = await AsyncStorage.getItem(TARGET_STORAGE_KEY);
    if (tData) targetGames = JSON.parse(tData);
    const lData = await AsyncStorage.getItem(LADDERLE_STORAGE_KEY);
    if (lData) ladderleGames = JSON.parse(lData);
    const cData = await AsyncStorage.getItem(CRYPTOQUOTE_STORAGE_KEY);
    if (cData) cryptoquoteGames = JSON.parse(cData);
    const wgData = await AsyncStorage.getItem(WORDGUESS_STORAGE_KEY);
    if (wgData) wordguessGames = JSON.parse(wgData);
    const cwData = await AsyncStorage.getItem(CROSSWORD_STORAGE_KEY);
    if (cwData) crosswordGames = JSON.parse(cwData);
  } catch (e) {
    console.error('Failed to load games', e);
  }
}

export async function getLastActiveGame(): Promise<{ gameType: string; gameId: string } | null> {
  try {
    const data = await AsyncStorage.getItem(LAST_ACTIVE_GAME_KEY);
    if (data) return JSON.parse(data);
    return null;
  } catch (e) {
    return null;
  }
}

export async function setLastActiveGame(gameType: string, gameId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_ACTIVE_GAME_KEY, JSON.stringify({ gameType, gameId }));
  } catch (e) {
    console.error('Failed to save last active game', e);
  }
}

async function savePanagramToStorage(): Promise<void> {
  await AsyncStorage.setItem(PANAGRAM_STORAGE_KEY, JSON.stringify(panagramGames));
}

async function saveTargetToStorage(): Promise<void> {
  await AsyncStorage.setItem(TARGET_STORAGE_KEY, JSON.stringify(targetGames));
}

async function saveLadderleToStorage(): Promise<void> {
  await AsyncStorage.setItem(LADDERLE_STORAGE_KEY, JSON.stringify(ladderleGames));
}

async function saveCryptoquoteToStorage(): Promise<void> {
  await AsyncStorage.setItem(CRYPTOQUOTE_STORAGE_KEY, JSON.stringify(cryptoquoteGames));
}

async function saveWordGuessToStorage(): Promise<void> {
  await AsyncStorage.setItem(WORDGUESS_STORAGE_KEY, JSON.stringify(wordguessGames));
}

async function saveCrosswordToStorage(): Promise<void> {
  await AsyncStorage.setItem(CROSSWORD_STORAGE_KEY, JSON.stringify(crosswordGames));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const gameDb = {
  panagram: {
    async create(data: Omit<PanagramGame, 'id' | 'createdAt' | 'updatedAt'>): Promise<PanagramGame> {
      const now = new Date().toISOString();
      const game: PanagramGame = {
        id: generateId(),
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      panagramGames.push(game);
      await savePanagramToStorage();
      return game;
    },
    async update(id: string, data: Partial<PanagramGame>): Promise<PanagramGame | null> {
      const idx = panagramGames.findIndex((g) => g.id === id);
      if (idx === -1) return null;
      panagramGames[idx] = {
        ...panagramGames[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await savePanagramToStorage();
      return panagramGames[idx];
    },
    findById(id: string): PanagramGame | undefined {
      return panagramGames.find((g) => g.id === id);
    },
    findAll(): PanagramGame[] {
      return [...panagramGames].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    },
    async remove(id: string): Promise<boolean> {
      const idx = panagramGames.findIndex((g) => g.id === id);
      if (idx === -1) return false;
      panagramGames.splice(idx, 1);
      await savePanagramToStorage();
      return true;
    },
  },
  target: {
    async create(data: Omit<TargetGame, 'id' | 'createdAt' | 'updatedAt'>): Promise<TargetGame> {
      const now = new Date().toISOString();
      const game: TargetGame = {
        id: generateId(),
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      targetGames.push(game);
      await saveTargetToStorage();
      return game;
    },
    async update(id: string, data: Partial<TargetGame>): Promise<TargetGame | null> {
      const idx = targetGames.findIndex((g) => g.id === id);
      if (idx === -1) return null;
      targetGames[idx] = {
        ...targetGames[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await saveTargetToStorage();
      return targetGames[idx];
    },
    findById(id: string): TargetGame | undefined {
      return targetGames.find((g) => g.id === id);
    },
    findAll(): TargetGame[] {
      return [...targetGames].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    },
    async remove(id: string): Promise<boolean> {
      const idx = targetGames.findIndex((g) => g.id === id);
      if (idx === -1) return false;
      targetGames.splice(idx, 1);
      await saveTargetToStorage();
      return true;
    },
  },
  ladderle: {
    async create(data: Omit<LadderleGame, 'id' | 'createdAt' | 'updatedAt'>): Promise<LadderleGame> {
      const now = new Date().toISOString();
      const game: LadderleGame = {
        id: generateId(),
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      ladderleGames.push(game);
      await saveLadderleToStorage();
      return game;
    },
    async update(id: string, data: Partial<LadderleGame>): Promise<LadderleGame | null> {
      const idx = ladderleGames.findIndex((g) => g.id === id);
      if (idx === -1) return null;
      ladderleGames[idx] = {
        ...ladderleGames[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await saveLadderleToStorage();
      return ladderleGames[idx];
    },
    findById(id: string): LadderleGame | undefined {
      return ladderleGames.find((g) => g.id === id);
    },
    findAll(): LadderleGame[] {
      return [...ladderleGames].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    },
    async remove(id: string): Promise<boolean> {
      const idx = ladderleGames.findIndex((g) => g.id === id);
      if (idx === -1) return false;
      ladderleGames.splice(idx, 1);
      await saveLadderleToStorage();
      return true;
    },
  },
  cryptoquote: {
    async create(data: Omit<CryptoquoteGame, 'id' | 'createdAt' | 'updatedAt'>): Promise<CryptoquoteGame> {
      const now = new Date().toISOString();
      const game: CryptoquoteGame = {
        id: generateId(),
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      cryptoquoteGames.push(game);
      await saveCryptoquoteToStorage();
      return game;
    },
    async update(id: string, data: Partial<CryptoquoteGame>): Promise<CryptoquoteGame | null> {
      const idx = cryptoquoteGames.findIndex((g) => g.id === id);
      if (idx === -1) return null;
      cryptoquoteGames[idx] = {
        ...cryptoquoteGames[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await saveCryptoquoteToStorage();
      return cryptoquoteGames[idx];
    },
    findById(id: string): CryptoquoteGame | undefined {
      return cryptoquoteGames.find((g) => g.id === id);
    },
    findAll(): CryptoquoteGame[] {
      return [...cryptoquoteGames].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    },
    async remove(id: string): Promise<boolean> {
      const idx = cryptoquoteGames.findIndex((g) => g.id === id);
      if (idx === -1) return false;
      cryptoquoteGames.splice(idx, 1);
      await saveCryptoquoteToStorage();
      return true;
    },
  },
  wordguess: {
    async create(data: Omit<WordGuessGame, 'id' | 'createdAt' | 'updatedAt'>): Promise<WordGuessGame> {
      const now = new Date().toISOString();
      const game: WordGuessGame = {
        id: generateId(),
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      wordguessGames.push(game);
      await saveWordGuessToStorage();
      return game;
    },
    async update(id: string, data: Partial<WordGuessGame>): Promise<WordGuessGame | null> {
      const idx = wordguessGames.findIndex((g) => g.id === id);
      if (idx === -1) return null;
      wordguessGames[idx] = {
        ...wordguessGames[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await saveWordGuessToStorage();
      return wordguessGames[idx];
    },
    findById(id: string): WordGuessGame | undefined {
      return wordguessGames.find((g) => g.id === id);
    },
    findAll(): WordGuessGame[] {
      return [...wordguessGames].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    },
    async remove(id: string): Promise<boolean> {
      const idx = wordguessGames.findIndex((g) => g.id === id);
      if (idx === -1) return false;
      wordguessGames.splice(idx, 1);
      await saveWordGuessToStorage();
      return true;
    },
  },
  crossword: {
    async create(data: Omit<CrosswordGame, 'id' | 'createdAt' | 'updatedAt'>): Promise<CrosswordGame> {
      const now = new Date().toISOString();
      const game: CrosswordGame = {
        id: generateId(),
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      crosswordGames.push(game);
      await saveCrosswordToStorage();
      return game;
    },
    async update(id: string, data: Partial<CrosswordGame>): Promise<CrosswordGame | null> {
      const idx = crosswordGames.findIndex((g) => g.id === id);
      if (idx === -1) return null;
      crosswordGames[idx] = {
        ...crosswordGames[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await saveCrosswordToStorage();
      return crosswordGames[idx];
    },
    findById(id: string): CrosswordGame | undefined {
      return crosswordGames.find((g) => g.id === id);
    },
    findAll(): CrosswordGame[] {
      return [...crosswordGames].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    },
    async remove(id: string): Promise<boolean> {
      const idx = crosswordGames.findIndex((g) => g.id === id);
      if (idx === -1) return false;
      crosswordGames.splice(idx, 1);
      await saveCrosswordToStorage();
      return true;
    },
  },
};