import { Asset } from 'expo-asset';
import pako from 'pako';

let quotesCache: { quote: string; author: string }[] = [];
let isLoaded = false;

export async function initQuotesDatabase(): Promise<void> {
  if (isLoaded) return;

  try {
    const asset = Asset.fromModule(require('../../assets/cryptoquotes.txt.gz'));
    await asset.downloadAsync();
    const response = await fetch(asset.localUri || asset.uri);
    const buffer = await response.arrayBuffer();
    const decompressed = pako.ungzip(new Uint8Array(buffer));
    const text = new TextDecoder().decode(decompressed);
    const lines = text.split('\n').filter((line: string) => line.trim());

    quotesCache = [];
    for (const line of lines) {
      const match = line.match(/"([^"]+)"\s*-\s*(.+)/);
      if (match) {
        quotesCache.push({ quote: match[1].trim(), author: match[2].trim() });
      }
    }

    isLoaded = true;
    console.log(`[quotes] Loaded ${quotesCache.length} quotes`);
  } catch (e) {
    console.error('[quotes] Failed to load quotes:', e);
  }
}

export async function getRandomQuote(): Promise<{ quote: string; author: string } | null> {
  if (!isLoaded || quotesCache.length === 0) {
    await initQuotesDatabase();
  }

  if (quotesCache.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * quotesCache.length);
  return quotesCache[randomIndex];
}

export async function closeQuotesDatabase(): Promise<void> {
  quotesCache = [];
  isLoaded = false;
}