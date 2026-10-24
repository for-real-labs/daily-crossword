# Daily Crossword

A free, native Expo iOS app. One new crossword per local day, 3,000 original bundled puzzles, automatic saves, and a simple home screen with unfinished puzzles ordered by last opened and a completed archive. No login, ads, purchases, network requirement, or analytics.

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

`data/words.txt` contains 439 original concise clues. `npm run puzzles` deterministically generates 3,000 connected 9×9 mini crosswords. Every grid and answer set is unique; individual words and clues recur across different puzzles. These are compact crisscross grids, without a rotational-symmetry requirement. All puzzles ship inside the app; no downloaded or scraped crossword content.

Tests verify every grid's answers, numbering, clue coverage, crossings, connectivity, uniqueness, and absence of unlisted adjacent words.

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

Support/privacy: https://for-real-labs.github.io/daily-crossword/
