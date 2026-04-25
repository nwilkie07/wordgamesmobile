const apiCache: Record<string, string> = {};

async function fetchFromFreeDictionary(word: string): Promise<string | null> {
  const w = word.toLowerCase();

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${w}`,
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const entry = data[0];
      if (entry.meanings && entry.meanings.length > 0) {
        const meaning = entry.meanings[0];
        if (meaning.definitions && meaning.definitions.length > 0) {
          return meaning.definitions[0].definition;
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`[dict] Failed to fetch definition for ${w}:`, error);
    return null;
  }
}

export async function getDefinition(word: string): Promise<string | null> {
  const w = word.toLowerCase();

  if (apiCache[w]) {
    return apiCache[w];
  }

  const definition = await fetchFromFreeDictionary(w);
  if (definition) {
    apiCache[w] = definition;
  }

  return definition;
}