import { expect, it } from "vitest";
import { boardGeometry } from "../src/layout";
it.each([
  [320, 568],
  [375, 667],
  [390, 844],
  [440, 956],
  [1024, 1366],
  [1366, 1024],
  [1440, 900],
])("keeps nine complete columns inside a %i × %i screen", (width, height) => {
  const { cellSize, boardWidth } = boardGeometry(width, height, 9);
  expect(Number.isInteger(cellSize)).toBe(true);
  expect(boardWidth).toBe(cellSize * 9);
  expect(boardWidth).toBeLessThanOrEqual(width - 32);
  expect(boardWidth).toBeLessThanOrEqual(480);
  expect(cellSize).toBeGreaterThanOrEqual(26);
});
