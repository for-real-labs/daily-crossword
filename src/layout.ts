/** Whole-point cells avoid Yoga rounding a row beyond its container width. */
export function boardGeometry(width: number, height: number, size: number) {
  const available = Math.min(width - 32, 480, Math.max(250, height - 330));
  const cellSize = Math.max(1, Math.floor(available / size));
  return { cellSize, boardWidth: cellSize * size };
}
