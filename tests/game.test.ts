import { describe, it, expect } from "vitest";
import {
  puzzles,
  getGamePuzzle,
  getPuzzle,
  progress,
  freshState,
  startGame,
  canStart,
  updateCell,
  openGame,
  orderedGames,
  readState,
  reconcile,
  cellKey,
  entryCells,
  dayKey,
} from "../src/game";
import { GameRepository, Persistence } from "../src/repository";
const date = (day: number) => new Date(2026, 9, day, 12);
describe("daily rules", () => {
  it("allows exactly one start per local date, including rapid retries", () => {
    const s = startGame(freshState(), date(24));
    expect(s.games).toHaveLength(1);
    expect(startGame(s, date(24))).toBe(s);
    expect(startGame(s, date(23))).toBe(s);
    expect(startGame(s, date(25)).next).toBe(2);
  });
  it("uses the local calendar, including midnight and leap day", () => {
    expect(dayKey(new Date(2028, 1, 29, 0, 0))).toBe("2028-02-29");
    let s = startGame(freshState(), new Date(2026, 9, 24, 23, 59));
    expect(canStart(s, dayKey(new Date(2026, 9, 25, 0, 0)))).toBe(true);
  });
  it("never repeats and stops at 3000 without cycling", () => {
    let s = freshState();
    const ids = new Set();
    for (let i = 0; i < 3000; i++) {
      s = startGame(s, new Date(2026, 0, 1 + i));
      ids.add(s.games[0].puzzleId);
    }
    expect(ids.size).toBe(3000);
    expect(startGame(s, new Date(2040, 0, 1))).toBe(s);
    expect(canStart(s, "2040-01-01")).toBe(false);
  });
  it("resumes older games without consuming today", () => {
    let s = startGame(freshState(), date(24));
    s = startGame(s, date(25));
    s = openGame(s, 1, date(26).getTime());
    expect(orderedGames(s, false)[0].puzzleId).toBe(1);
    expect(canStart(s, "2026-10-26")).toBe(true);
  });
  it("completes only when every letter is correct and preserves completed games", () => {
    let s = startGame(freshState(), date(24));
    const p = puzzles[0];
    for (let r = 0; r < p.size; r++)
      for (let c = 0; c < p.size; c++)
        if (p.rows[r][c] !== ".")
          s = updateCell(s, 1, cellKey(r, c), p.rows[r][c], 1234);
    expect(s.games[0].completedAt).toBe(1234);
    const key = entryCells(p.entries[0])[0];
    expect(updateCell(s, 1, key, "X").games[0]).toEqual(s.games[0]);
    expect(startGame(s, date(24))).toBe(s);
    expect(orderedGames(s, true)).toHaveLength(1);
  });
  it("rejects invalid cells and damaged saves without wiping history", () => {
    const s = startGame(freshState(), date(24));
    expect(updateCell(s, 1, "-1,0", "A")).toBe(s);
    expect(updateCell(s, 1, "0,0", "AB")).toBe(s);
    expect(readState(JSON.stringify(s))).toEqual(s);
    expect(() => readState("broken")).toThrow();
    expect(() => readState(JSON.stringify({ ...s, next: -1 }))).toThrow();
  });
  it("restores an interrupted reservation and keeps the sequence after reinstall", () => {
    const s = reconcile(freshState(), {
      next: 100,
      lastDay: "2026-10-24",
      pending: { puzzleId: 100, day: "2026-10-24", openedAt: 1 },
    });
    expect(s.games[0].puzzleId).toBe(100);
    expect(startGame(s, date(24))).toBe(s);
    expect(startGame(s, date(25)).games[0].puzzleId).toBe(101);
  });
});
describe("all bundled crosswords", () => {
  it("has 3000 distinct grids and distinct sets of answers", () => {
    expect(puzzles).toHaveLength(3000);
    expect(new Set(puzzles.map((p) => p.rows.join(""))).size).toBe(3000);
    expect(
      new Set(
        puzzles.map((p) =>
          p.entries
            .map((e) => e.answer)
            .sort()
            .join(",")
        )
      ).size
    ).toBe(3000);
  });
  it("has consistent clues, crossings, numbering, and no accidental words or disconnected islands", () => {
    for (const [index, p] of puzzles.entries()) {
      expect(p.id).toBe(index + 1);
      expect(p.rows).toHaveLength(p.size);
      expect(p.size).toBe(15);
      expect(p.entries.length).toBeGreaterThanOrEqual(70);
      expect(p.entries.length).toBeLessThanOrEqual(82);
      expect(new Set(p.entries.map((e) => e.answer)).size).toBe(
        p.entries.length
      );
      expect(p.rows.join("").split(".").length - 1).toBeLessThanOrEqual(40);
      expect(
        Math.max(...p.entries.map((e) => e.answer.length))
      ).toBeGreaterThanOrEqual(7);
      const coverage = new Map<string, Set<string>>();
      for (const e of p.entries)
        for (const key of entryCells(e)) {
          const directions = coverage.get(key) ?? new Set<string>();
          directions.add(e.direction);
          coverage.set(key, directions);
        }
      for (const directions of coverage.values())
        expect(directions.size).toBe(2);
      for (let r = 0; r < p.size; r++) {
        expect(p.rows[r]).toHaveLength(15);
        for (let c = 0; c < p.size; c++)
          expect(p.rows[r][c] === ".").toBe(p.rows[14 - r][14 - c] === ".");
      }
      const represented = new Set<string>(),
        starts = [
          ...new Set(p.entries.map((e) => e.row * p.size + e.col)),
        ].sort((a, b) => a - b);
      for (const e of p.entries) {
        expect(e.clue.length).toBeGreaterThan(3);
        expect(e.answer).toMatch(/^[A-Z]{3,9}$/);
        expect(e.number).toBe(starts.indexOf(e.row * p.size + e.col) + 1);
        entryCells(e).forEach((key, i) => {
          const [r, c] = key.split(",").map(Number);
          expect(p.rows[r][c]).toBe(e.answer[i]);
          represented.add(key);
        });
      }
      for (let r = 0; r < p.size; r++)
        for (let c = 0; c < p.size; c++)
          if (p.rows[r][c] !== ".") {
            expect(represented.has(cellKey(r, c))).toBe(true);
            for (const dir of ["across", "down"] as const) {
              const dr = dir === "down" ? 1 : 0,
                dc = 1 - dr;
              if ((p.rows[r - dr]?.[c - dc] ?? ".") !== ".") continue;
              let answer = "";
              for (
                let i = 0;
                (p.rows[r + i * dr]?.[c + i * dc] ?? ".") !== ".";
                i++
              )
                answer += p.rows[r + i * dr][c + i * dc];
              if (answer.length > 1)
                expect(
                  p.entries.some(
                    (e) =>
                      e.row === r &&
                      e.col === c &&
                      e.direction === dir &&
                      e.answer === answer
                  )
                ).toBe(true);
            }
          }
      const seen = new Set<string>(),
        queue = [...represented].slice(0, 1);
      while (queue.length) {
        const key = queue.pop()!;
        if (seen.has(key)) continue;
        seen.add(key);
        const [r, c] = key.split(",").map(Number);
        for (const [dr, dc] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const next = cellKey(r + dr, c + dc);
          if (represented.has(next) && !seen.has(next)) queue.push(next);
        }
      }
      expect(seen.size).toBe(represented.size);
    }
  }, 120000);
});
function memory() {
  let value: string | null = null,
    ledger: string | null = null;
  const store: Persistence = {
    read: async () => value,
    write: async (v) => {
      value = v;
    },
    readLedger: async () => ledger,
    writeLedger: async (v) => {
      ledger = v;
    },
  };
  return store;
}
describe("durable saves", () => {
  it("survives relaunch and concurrent start taps", async () => {
    const store = memory(),
      repo = new GameRepository(store);
    await repo.load();
    await Promise.all([
      repo.start(date(24)),
      repo.start(date(24)),
      repo.start(date(24)),
    ]);
    expect(repo.state.next).toBe(1);
    const key = entryCells(puzzles[0].entries[0])[0];
    await repo.save(updateCell(repo.state, 1, key, "Z"));
    const reopened = new GameRepository(store);
    await reopened.load();
    expect(reopened.state.games[0].cells[key]).toBe("Z");
    expect((await reopened.start(date(24))).next).toBe(1);
  });
  it("recovers a game if the disk write fails after reserving its ID", async () => {
    const store = memory(),
      repo = new GameRepository(store);
    await repo.load();
    const write = store.write;
    store.write = async () => {
      throw Error("disk");
    };
    await expect(repo.start(date(24))).rejects.toThrow();
    store.write = write;
    const reopened = new GameRepository(store);
    await reopened.load();
    expect(reopened.state.next).toBe(1);
    expect(reopened.state.games[0].puzzleId).toBe(1);
    expect((await reopened.start(date(24))).next).toBe(1);
  });
  it("does not start if the permanent ledger cannot be saved", async () => {
    const store = memory(),
      repo = new GameRepository(store);
    await repo.load();
    store.writeLedger = async () => {
      throw Error("keychain");
    };
    await expect(repo.start(date(24))).rejects.toThrow();
    expect(repo.state.next).toBe(0);
  });
  it("serializes saves so stale writes cannot win", async () => {
    const store = memory(),
      repo = new GameRepository(store);
    await repo.load();
    await repo.start(date(24));
    const key = entryCells(puzzles[0].entries[0])[0];
    const first = repo.save(updateCell(repo.state, 1, key, "A"));
    const second = repo.save(updateCell(repo.state, 1, key, "B"));
    await Promise.all([first, second]);
    const reopened = new GameRepository(store);
    await reopened.load();
    expect(reopened.state.games[0].cells[key]).toBe("B");
  });
});

describe("upgrading from mini crosswords", () => {
  it("keeps saved letters and completed mini puzzles attached to their original grids", () => {
    const old = getPuzzle(1, "legacy");
    const cells = Object.fromEntries(
      old.rows.flatMap((row, r) =>
        [...row].flatMap((letter, c) =>
          letter === "." ? [] : [[cellKey(r, c), letter]]
        )
      )
    );
    const saved = {
      version: 1,
      next: 1,
      lastDay: "2026-10-24",
      games: [
        {
          puzzleId: 1,
          day: "2026-10-24",
          openedAt: 123,
          cells,
          completedAt: 124,
        },
      ],
    };
    const state = readState(JSON.stringify(saved));
    expect(state).toEqual(saved);
    expect(getGamePuzzle(state.games[0]).size).toBe(9);
    expect(progress(state.games[0])).toBe(100);
    const next = startGame(state, date(25));
    expect(getGamePuzzle(next.games[0]).size).toBe(15);
    expect(next.games[0].edition).toBe("newspaper");
    expect(next.games[1]).toEqual(saved.games[0]);
    expect(readState(JSON.stringify(next))).toEqual(next);
  });
  it("recovers reservations with the edition they were created for", () => {
    for (const edition of [undefined, "newspaper"] as const) {
      const state = reconcile(freshState(), {
        next: 1,
        lastDay: "2026-10-24",
        pending: { puzzleId: 1, day: "2026-10-24", openedAt: 1, edition },
      });
      expect(getGamePuzzle(state.games[0]).size).toBe(edition ? 15 : 9);
      expect(readState(JSON.stringify(state))).toEqual(state);
    }
  });
  it("edits an unfinished old puzzle using its old coordinates", () => {
    const old = getPuzzle(1, "legacy");
    const key = entryCells(old.entries[0])[0];
    const state = readState(
      JSON.stringify({
        version: 1,
        next: 1,
        lastDay: "2026-10-24",
        games: [
          {
            puzzleId: 1,
            day: "2026-10-24",
            openedAt: 1,
            cells: {},
            completedAt: null,
          },
        ],
      })
    );
    expect(
      updateCell(state, 1, key, old.entries[0].answer[0]).games[0].cells[key]
    ).toBe(old.entries[0].answer[0]);
  });
  it("rejects an unknown edition instead of assigning the wrong grid", () => {
    const state = startGame(freshState(), date(24));
    const invalid = {
      ...state,
      games: [{ ...state.games[0], edition: "unknown" }],
    };
    expect(() => readState(JSON.stringify(invalid))).toThrow();
  });
});
