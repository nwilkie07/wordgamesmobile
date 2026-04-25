import * as SQLite from 'expo-sqlite';
import { Paths, File } from 'expo-file-system';
import pako from 'pako';

export interface CrosswordEntry {
  number: number;
  answer: string;
  clue: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
}

export interface CrosswordPuzzle {
  id: string;
  size: number;
  grid: (string | null)[][];
  entries: CrosswordEntry[];
  completed: boolean;
}

let puzzlesDb: SQLite.SQLiteDatabase | null = null;
let cluesDb: SQLite.SQLiteDatabase | null = null;
let cluesCache: Map<string, string> = new Map();
let loaded = false;

async function decompressGzipAsset(assetName: string, destFileName: string): Promise<string | null> {
  try {
    const destFile = new File(Paths.cache, destFileName);

    if (destFile.exists) {
      console.log(`[crossword] Using cached ${destFileName}`);
      return destFile.uri;
    }

    const assetFile = new File(Paths.document, 'assets', assetName);

    if (!assetFile.exists) {
      console.log(`[crossword] Asset not found: ${assetFile.uri}`);
      return null;
    }

    const gzippedBase64 = await assetFile.base64();
    const binaryString = atob(gzippedBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const decompressed = pako.ungzip(bytes);

    await destFile.write(decompressed);

    console.log(`[crossword] Decompressed ${assetName} to ${destFile.uri}`);
    return destFile.uri;
  } catch (e) {
    console.error(`[crossword] Failed to decompress ${assetName}:`, e);
    return null;
  }
}

export async function loadCrosswordData(): Promise<void> {
  if (loaded) return;

  try {
    const puzzlesPath = await decompressGzipAsset('puzzles.db.gz', 'puzzles.db');
    const cluesPath = await decompressGzipAsset('clues.db.gz', 'clues.db');

    if (puzzlesPath) {
      puzzlesDb = await SQLite.openDatabaseAsync(puzzlesPath);
      console.log('[crossword] Opened puzzles.db');
    }

    if (cluesPath) {
      cluesDb = await SQLite.openDatabaseAsync(cluesPath);
      console.log('[crossword] Opened clues.db');
    }
  } catch (e) {
    console.error('[crossword] Failed to open databases:', e);
  }

  loaded = true;
}

async function getClueForWord(word: string): Promise<string> {
  const upperWord = word.toUpperCase();

  if (cluesCache.has(upperWord)) {
    return cluesCache.get(upperWord) || 'No clue available';
  }

  if (!cluesDb) return 'No clue available';

  try {
    const result = await cluesDb.getFirstAsync<{ clue: string }>(
      'SELECT clue FROM clues WHERE word = ?',
      [upperWord]
    );

    const clue = result?.clue || 'No clue available';
    cluesCache.set(upperWord, clue);
    return clue;
  } catch (e) {
    console.error('[crossword] Failed to get clue for word:', word, e);
    return 'No clue available';
  }
}

async function getCluesForWords(words: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  if (!cluesDb) return result;

  try {
    const placeholders = words.map(() => '?').join(',');
    const rows = await cluesDb.getAllAsync<{ word: string; clue: string }>(
      `SELECT word, clue FROM clues WHERE word IN (${placeholders})`,
      words.map(w => w.toUpperCase())
    );

    for (const row of rows) {
      result.set(row.word.toUpperCase(), row.clue);
      cluesCache.set(row.word.toUpperCase(), row.clue);
    }
  } catch (e) {
    console.error('[crossword] Failed to batch get clues:', e);
  }

  return result;
}

function parseGrid(gridJson: string): (string | null)[][] {
  const grid: (string | null)[][] = [];
  const rows = JSON.parse(gridJson);
  for (const row of rows) {
    const gridRow: (string | null)[] = [];
    for (const cell of row) {
      gridRow.push(cell === null ? null : cell);
    }
    grid.push(gridRow);
  }
  return grid;
}

export async function getRandomPuzzle(): Promise<CrosswordPuzzle | null> {
  if (!puzzlesDb) {
    await loadCrosswordData();
  }
  if (!puzzlesDb) return null;

  try {
    const result = await puzzlesDb.getFirstAsync<{ id: number; grid: Uint8Array; across_json: string; down_json: string }>(
      'SELECT id, grid, across_json, down_json FROM puzzles ORDER BY RANDOM() LIMIT 1'
    );

    if (!result) return null;

    const decompressed = pako.inflate(result.grid);
    const gridJson = new TextDecoder().decode(decompressed);
    const grid = parseGrid(gridJson);

    const across = JSON.parse(result.across_json);
    const down = JSON.parse(result.down_json);

    const allWords = [
      ...across.map((e: any) => e.answer),
      ...down.map((e: any) => e.answer),
    ];

    await getCluesForWords(allWords);

    const entries: CrosswordEntry[] = [];

    for (const entry of across) {
      entries.push({
        number: entry.number,
        answer: entry.answer.toUpperCase(),
        clue: cluesCache.get(entry.answer.toUpperCase()) || 'No clue available',
        row: entry.row,
        col: entry.col,
        direction: 'across',
      });
    }

    for (const entry of down) {
      entries.push({
        number: entry.number,
        answer: entry.answer.toUpperCase(),
        clue: cluesCache.get(entry.answer.toUpperCase()) || 'No clue available',
        row: entry.row,
        col: entry.col,
        direction: 'down',
      });
    }

    return {
      id: `puzzle_${result.id}`,
      size: grid.length,
      grid,
      entries,
      completed: false,
    };
  } catch (e) {
    console.error('[crossword] Failed to get random puzzle:', e);
    return null;
  }
}

export async function getPuzzleById(id: string): Promise<CrosswordPuzzle | null> {
  if (!puzzlesDb) {
    await loadCrosswordData();
  }
  if (!puzzlesDb) return null;

  try {
    const numericId = parseInt(id.replace('puzzle_', ''), 10);
    if (isNaN(numericId)) return null;

    const result = await puzzlesDb.getFirstAsync<{ id: number; grid: Uint8Array; across_json: string; down_json: string }>(
      'SELECT id, grid, across_json, down_json FROM puzzles WHERE id = ?',
      [numericId]
    );

    if (!result) return null;

    const decompressed = pako.inflate(result.grid);
    const gridJson = new TextDecoder().decode(decompressed);
    const grid = parseGrid(gridJson);

    const across = JSON.parse(result.across_json);
    const down = JSON.parse(result.down_json);

    const allWords = [
      ...across.map((e: any) => e.answer),
      ...down.map((e: any) => e.answer),
    ];

    await getCluesForWords(allWords);

    const entries: CrosswordEntry[] = [];

    for (const entry of across) {
      entries.push({
        number: entry.number,
        answer: entry.answer.toUpperCase(),
        clue: cluesCache.get(entry.answer.toUpperCase()) || 'No clue available',
        row: entry.row,
        col: entry.col,
        direction: 'across',
      });
    }

    for (const entry of down) {
      entries.push({
        number: entry.number,
        answer: entry.answer.toUpperCase(),
        clue: cluesCache.get(entry.answer.toUpperCase()) || 'No clue available',
        row: entry.row,
        col: entry.col,
        direction: 'down',
      });
    }

    return {
      id: `puzzle_${result.id}`,
      size: grid.length,
      grid,
      entries,
      completed: false,
    };
  } catch (e) {
    console.error('[crossword] Failed to get puzzle by id:', e);
    return null;
  }
}

export function isLoaded(): boolean {
  return loaded;
}