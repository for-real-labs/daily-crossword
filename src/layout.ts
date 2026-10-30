/** Whole-point cells avoid Yoga rounding a row beyond its container width. */
export function boardGeometry(
  width: number,
  height: number,
  size: number,
  measuredPlayHeight?: number
) {
  const available = Math.min(
    width - 32,
    480,
    measuredPlayHeight === undefined
      ? Math.max(250, height - 330)
      : Math.max(1, measuredPlayHeight - 16)
  );
  const cellSize = Math.max(1, Math.floor(available / size));
  return { cellSize, boardWidth: cellSize * size };
}

/** Keep two-digit clue numbers and entered letters separate in a 15-column grid. */
export function cellTypography(cellSize: number) {
  const numberSize = Math.max(6, Math.min(10, cellSize * 0.26));
  const numberLineHeight = Math.ceil(numberSize);
  const letterSize = Math.floor(cellSize * 0.51);
  const letterLineHeight = Math.ceil(letterSize * 1.05);
  return {
    numberSize,
    numberLineHeight,
    letterSize,
    letterLineHeight,
    letterTop: Math.max(0, cellSize - letterLineHeight - 3),
  };
}
