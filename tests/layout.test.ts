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

import { cellTypography } from "../src/layout";
it.each([
  [320, 568],
  [375, 667],
  [390, 844],
  [440, 956],
  [1024, 1366],
  [1366, 1024],
])(
  "fits all fifteen columns and legible letter boxes at %i × %i",
  (width, height) => {
    const { cellSize, boardWidth } = boardGeometry(width, height, 15);
    expect(boardWidth).toBe(cellSize * 15);
    expect(boardWidth).toBeLessThanOrEqual(width - 32);
    const type = cellTypography(cellSize);
    expect(type.numberSize).toBeGreaterThanOrEqual(6);
    expect(type.letterSize).toBeGreaterThanOrEqual(8);
    expect(type.letterLineHeight + type.letterTop).toBeLessThanOrEqual(
      cellSize - 1
    );
  }
);

it.each([180, 240, 300, 480])(
  "fits the measured play area of %i points without hiding the clue",
  (height) => {
    const { boardWidth } = boardGeometry(375, 667, 15, height);
    expect(boardWidth).toBeLessThanOrEqual(height - 16);
    expect(boardWidth).toBeLessThanOrEqual(343);
  }
);
