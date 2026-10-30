# OpenCrossword

100% free. No ads. Just daily crosswords. A minimal native Expo iOS app. One new crossword per local day, 3,000 original bundled puzzles, automatic saves, and a simple home screen with unfinished puzzles ordered by last opened and a completed archive. No login, ads, purchases, network requirement, or analytics.

## Run

Node 22 LTS is recommended.

```sh
npm ci
npm start
npm test
npm run typecheck
```

`npm run ios` runs a local native build with a supported Xcode. `npm run web` provides a browser preview. Production iOS builds use EAS and its current Xcode image.

## Puzzle library

The daily library contains 3,000 full-size 15×15 crosswords with 70–82 clues per puzzle. Black squares have 180-degree rotational symmetry, every white square belongs to both an Across and a Down answer, all answers are at least three letters, and every grid is connected. Pinch to enlarge the grid on iOS.

`npm run puzzles` deterministically fills six original block patterns using Python 3.10+, a C++17 compiler, and the pinned CC0 word/clue bank. Generation is reproducible with the same compiler and standard library. The generator is a development tool; puzzles ship inside the app and need no network connection. See [content provenance](data/SOURCES.md). Every grid and answer set is unique; individual words and clues recur across puzzles.

Tests independently check the entire library for size, density, symmetry, numbering, answers, duplicate answers, clue coverage, crossings, connectivity, and uniqueness. `data/legacy-puzzles.json` retains the exact old 9×9 boards so saved and completed games remain readable. New games use the newspaper edition; the daily sequence and limits are preserved.

## Saving and daily limits

A monotonic sequence assigns each puzzle only once. A local-calendar start date enforces one new puzzle per day, with rollback protection for dates already used. Opening or completing an existing puzzle does not consume a new day. After puzzle 3,000, the archive remains available and the app does not repeat puzzles.

AsyncStorage holds all game progress. A small iOS Keychain reservation is written before a new puzzle is saved. Interrupted writes recover the same puzzle, and retained Keychain data prevents starting again at puzzle 1 after reinstalling. Writes are serialized. Invalid saves show a recoverable error rather than silently deleting history.

This is an offline app: it cannot enforce a global allowance across separate devices, deliberate clock advances, or deletion of all device/Keychain data. No cross-device sync is claimed. Normal uninstall may remove saved boards; the sequence record can survive in Keychain.

## Release

```sh
npx eas-cli build -p ios --profile production
npx eas-cli submit -p ios --profile production
```

Signing and submission credentials are managed by the existing Expo account. Never commit private keys or signing certificates. Apple must approve a submission before it appears on the App Store.

Support/privacy: https://for-real-labs.github.io/opencrossword/
