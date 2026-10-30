import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { getEntries } from "open-crossword-bank/en";

// The generator is build-time only. The mobile app bundles the finished puzzles.
// Upstream word/clue data is CC0; see data/SOURCES.md.
const unsuitable =
  /\b(sex|sexual|sexually|porn|pornographic|vagina|vaginal|penis|penile|fuck|fucking|shit|bitch|nigger|cunt|slur|derogatory|offensive|vulgar|anus|anal|buttocks|feces|faeces|semen|testicle|testicles|prostitute|prostitution|erotic|orgasm|orgasmic)\b/i;
const clues = {};
for (const entry of getEntries({ seed: 1, tier: [1, 2] })) {
  if (!/^[A-Z]{3,9}$/.test(entry.word)) continue;
  if (
    unsuitable.test(entry.word + " " + entry.clues.map((c) => c.text).join(" "))
  )
    continue;
  const clue = entry.clues.find(
    (c) =>
      c.type === "definition" &&
      !/\b(name|names|surname|surnames)\b/i.test(c.text) &&
      !new RegExp(`\\b${entry.word}\\b`, "i").test(c.text)
  );
  if (clue) clues[entry.word] = clue.text.replace(/[.]$/, "");
}
for (const line of fs
  .readFileSync("data/words.txt", "utf8")
  .trim()
  .split("\n")) {
  const [answer, clue] = line.split("|");
  clues[answer] = clue;
}
for (const line of fs
  .readFileSync("data/clue-overrides.txt", "utf8")
  .trim()
  .split("\n")) {
  const [answer, clue] = line.split("|");
  clues[answer] = clue;
}
if (process.argv.includes("--refresh-clues")) {
  const puzzles = JSON.parse(fs.readFileSync("data/puzzles.json", "utf8"));
  for (const puzzle of puzzles)
    for (const entry of puzzle.entries) {
      if (!clues[entry.answer])
        throw new Error(`Missing clue: ${entry.answer}`);
      entry.clue = clues[entry.answer];
    }
  fs.writeFileSync("data/puzzles.json", JSON.stringify(puzzles));
  process.exit(0);
}
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "opencrossword-generate-"));
try {
  const input = path.join(temp, "clues.json");
  fs.writeFileSync(input, JSON.stringify(clues));
  const result = spawnSync(
    "python3",
    [
      "scripts/fill-newspaper.py",
      input,
      "data/newspaper-patterns.json",
      "data/puzzles.json",
    ],
    { stdio: "inherit" }
  );
  if (result.status !== 0)
    throw new Error(
      "Crossword generation failed; existing library was not replaced"
    );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
