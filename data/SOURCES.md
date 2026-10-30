# Crossword content

The 15×15 library is generated locally from original grid patterns and the English
word/clue data in `open-crossword-bank` 1.0.2 by Tamino Martinius:
https://github.com/tamino-martinius/node-open-crossword-bank

The upstream project explicitly dedicates its word and clue data to **CC0-1.0**:
https://creativecommons.org/publicdomain/zero/1.0/
Its software is MIT licensed. Clues were authored with AI assistance by that
project. We filter adult/profane material and clues that reveal their answer,
and prefer our original `words.txt` clues where available. No newspaper puzzles
or publisher clue databases are copied.

`legacy-puzzles.json` is the unchanged original 9×9 library. It is retained only
to open games saved by earlier app versions. All newly started games use the
15×15 library. Both libraries use stable puzzle IDs; each saved game identifies
its edition.

Regenerate with `npm run puzzles` (Node 22, Python 3.10+, and a C++17 compiler). The seeded build-time
solver uses bit sets, arc consistency, unique answers, and bounded
backtracking. Every completed grid is fully crossed, connected, and symmetric;
the test suite verifies the entire shipped library independently of the solver.
