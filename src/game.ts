import bundled from "../data/puzzles.json";
export type Direction = "across" | "down";
export interface Entry {
  answer: string;
  clue: string;
  row: number;
  col: number;
  direction: Direction;
  number: number;
}
export interface Puzzle {
  id: number;
  size: number;
  rows: string[];
  entries: Entry[];
}
export interface Game {
  puzzleId: number;
  day: string;
  openedAt: number;
  cells: Record<string, string>;
  completedAt: number | null;
}
export interface State {
  version: 1;
  next: number;
  lastDay: string;
  games: Game[];
}
export interface Ledger {
  next: number;
  lastDay: string;
  pending: { puzzleId: number; day: string; openedAt: number } | null;
}
export const puzzles = bundled as Puzzle[];
export const freshState = (): State => ({
  version: 1,
  next: 0,
  lastDay: "",
  games: [],
});
export const dayKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
export const cellKey = (row: number, col: number) => `${row},${col}`;
export function entryCells(entry: Entry) {
  return [...entry.answer].map((_, i) =>
    cellKey(
      entry.row + (entry.direction === "down" ? i : 0),
      entry.col + (entry.direction === "across" ? i : 0)
    )
  );
}
export const getPuzzle = (id: number) => {
  const p = puzzles[id - 1];
  if (!p || p.id !== id) throw Error("Unknown puzzle");
  return p;
};
export function canStart(state: State, day = dayKey()) {
  return state.next < puzzles.length && day > state.lastDay;
}
export function startGame(state: State, date = new Date()): State {
  const day = dayKey(date);
  if (!canStart(state, day)) return state;
  const game: Game = {
    puzzleId: puzzles[state.next].id,
    day,
    openedAt: date.getTime(),
    cells: {},
    completedAt: null,
  };
  return {
    ...state,
    next: state.next + 1,
    lastDay: day,
    games: [game, ...state.games],
  };
}
export function solved(puzzle: Puzzle, cells: Record<string, string>) {
  return puzzle.rows.every((row, r) =>
    [...row].every(
      (letter, c) => letter === "." || cells[cellKey(r, c)] === letter
    )
  );
}
export function updateCell(
  state: State,
  id: number,
  key: string,
  value: string,
  now = Date.now()
): State {
  const p = getPuzzle(id),
    [r, c] = key.split(",").map(Number);
  if (
    !Number.isInteger(r) ||
    !Number.isInteger(c) ||
    !p.rows[r]?.[c] ||
    p.rows[r][c] === "." ||
    !/^[A-Z]?$/.test(value)
  )
    return state;
  return {
    ...state,
    games: state.games.map((game) => {
      if (game.puzzleId !== id || game.completedAt) return game;
      const cells = { ...game.cells, [key]: value };
      return {
        ...game,
        cells,
        openedAt: now,
        completedAt: solved(p, cells) ? now : null,
      };
    }),
  };
}
export function openGame(state: State, id: number, now = Date.now()): State {
  return {
    ...state,
    games: state.games.map((g) =>
      g.puzzleId === id ? { ...g, openedAt: now } : g
    ),
  };
}
export const orderedGames = (state: State, complete: boolean) =>
  state.games
    .filter((g) => Boolean(g.completedAt) === complete)
    .sort((a, b) => b.openedAt - a.openedAt);
export function progress(game: Game) {
  const p = getPuzzle(game.puzzleId);
  const total = p.rows.join("").replaceAll(".", "").length;
  const filled = Object.values(game.cells).filter(Boolean).length;
  return Math.round((100 * filled) / total);
}
export function readState(raw: string | null): State {
  if (raw === null) return freshState();
  const s = JSON.parse(raw) as State;
  if (
    s.version !== 1 ||
    !Number.isInteger(s.next) ||
    s.next < 0 ||
    s.next > puzzles.length ||
    typeof s.lastDay !== "string" ||
    !Array.isArray(s.games)
  )
    throw Error("Invalid save");
  const ids = new Set<number>();
  for (const g of s.games) {
    const p = getPuzzle(g.puzzleId);
    if (
      ids.has(g.puzzleId) ||
      g.puzzleId > s.next ||
      !/^\d{4}-\d{2}-\d{2}$/.test(g.day) ||
      !Number.isFinite(g.openedAt) ||
      !g.cells ||
      typeof g.cells !== "object" ||
      Array.isArray(g.cells) ||
      !(g.completedAt === null || Number.isFinite(g.completedAt))
    )
      throw Error("Invalid game");
    ids.add(g.puzzleId);
    for (const [key, value] of Object.entries(g.cells)) {
      const [r, c] = key.split(",").map(Number);
      if (
        key !== cellKey(r, c) ||
        !p.rows[r]?.[c] ||
        p.rows[r][c] === "." ||
        typeof value !== "string" ||
        !/^[A-Z]?$/.test(value)
      )
        throw Error("Invalid cell");
    }
    if (g.completedAt !== null && !solved(p, g.cells))
      throw Error("Invalid completion");
  }
  return s;
}
export function reconcile(state: State, ledger: Ledger | null): State {
  if (!ledger) return state;
  if (
    !Number.isInteger(ledger.next) ||
    ledger.next < 0 ||
    ledger.next > puzzles.length ||
    typeof ledger.lastDay !== "string"
  )
    throw Error("Invalid ledger");
  let games = state.games;
  if (
    ledger.pending &&
    !games.some((g) => g.puzzleId === ledger.pending!.puzzleId)
  ) {
    const pending = ledger.pending;
    getPuzzle(pending.puzzleId);
    if (
      pending.puzzleId !== ledger.next ||
      pending.day !== ledger.lastDay ||
      !Number.isFinite(pending.openedAt)
    )
      throw Error("Invalid reservation");
    games = [{ ...pending, cells: {}, completedAt: null }, ...games];
  }
  return {
    ...state,
    next: Math.max(state.next, ledger.next),
    lastDay: state.lastDay > ledger.lastDay ? state.lastDay : ledger.lastDay,
    games,
  };
}
