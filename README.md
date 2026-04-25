# WordGames Mobile

A React Native mobile app featuring multiple word puzzle games including Crossword, Cryptoquote, Wordle, Ladderle, Panagram, and Target.

## Games

### Crossword
Classic crossword puzzle with thousands of puzzles stored in a SQLite database. Features include:
- Random puzzle selection from an extensive database
- Clue lookup from a dedicated clues database
- Save/resume puzzle progress
- Direction toggle (across/down)
- Letter reveal feature

### Cryptoquote
Cipher substitution puzzles based on famous quotes. Features include:
- 100,000+ quotes to solve
- Author attribution
- Save progress and history

### Wordle
Classic 6-attempt word guessing game featuring:
- Full dictionary support
- Visual feedback (correct, present, absent)
- Game history tracking

### Ladderle
Word ladder puzzles where you change one letter at a time. Features include:
- 5-letter word puzzles
- Letter sharing in same position
- Unlimited puzzles from dictionary

### Panagram (7 Letters)
Word puzzle game using 7 letters with one center letter. Features include:
- Find all valid words using the given letters
- Center letter must be used in every word
- Score based on word length and rarity
- Dictionary lookup for definitions

### Target (9 Letters)
Extended word puzzle with 9 letters. Features include:
- Larger letter set with center letter requirement
- Comprehensive word validation
- Score tracking

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Native Stack)
- **Storage**: AsyncStorage for game history, SQLite for puzzles
- **Database**: expo-sqlite for crossword puzzle storage
- **Compression**: pako (gzip decompression for assets)

## Project Structure

```
wordgamesmobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── db/                 # Database types, seeds, game storage
│   ├── lib/                # Utility libraries
│   │   ├── crossword.ts     # Crossword puzzle loading & SQLite
│   │   ├── clues.ts        # Clue management
│   │   ├── definitions.ts   # Free Dictionary API
│   │   └── utils.ts        # Shared utilities
│   └── screens/            # Game screens & history
├── assets/
│   ├── puzzles.db.gz       # Compressed crossword puzzles
│   ├── clues.db.gz         # Compressed clues database
│   └── cryptoquotes.txt.gz # Compressed quotes
└── App.tsx                 # Navigation configuration
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npx expo start
   ```

3. **Run on iOS**
   ```bash
   npx expo run:ios
   ```

4. **Run on Android**
   ```bash
   npx expo run:android
   ```

## Assets

Large binary files are compressed with gzip to meet GitHub's file size limits:

- `puzzles.db.gz` (38MB) - Crossword puzzles, decompresses to ~197MB
- `clues.db.gz` (14MB) - Crossword clues, decompresses to ~30MB
- `cryptoquotes.txt.gz` - Quote database

These are decompressed at runtime and cached in the app's cache directory.

## Features

- **Local Backup**: Export/import game data via clipboard (JSON format)
- **History Tracking**: Track all games played across all game types
- **Dictionary Lookup**: Click any word to see its definition (Free Dictionary API)
- **Crossword History**: Resume any saved crossword puzzle

## License

Private - All rights reserved
