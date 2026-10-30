"""Compile the offline filler and assemble its independently validated output."""

import concurrent.futures
import json
import os
from pathlib import Path
import random
import subprocess
import sys
import tempfile


def make_puzzle(rows, puzzle_id, words):
    rows = [row.replace("#", ".") for row in rows]
    entries = []
    number = 0
    for r in range(15):
        for c in range(15):
            if rows[r][c] == ".":
                continue
            starts = []
            if c == 0 or rows[r][c - 1] == ".":
                starts.append(("across", 0, 1))
            if r == 0 or rows[r - 1][c] == ".":
                starts.append(("down", 1, 0))
            if starts:
                number += 1
            for direction, dr, dc in starts:
                answer = ""
                y, x = r, c
                while y < 15 and x < 15 and rows[y][x] != ".":
                    answer += rows[y][x]
                    y += dr
                    x += dc
                entries.append(
                    dict(
                        answer=answer,
                        clue=words[answer],
                        row=r,
                        col=c,
                        direction=direction,
                        number=number,
                    )
                )
    return dict(id=puzzle_id, size=15, rows=rows, entries=entries)


def main():
    clues = json.loads(Path(sys.argv[1]).read_text())
    patterns = json.loads(Path(sys.argv[2]).read_text())
    bootstrap = json.loads(Path("data/newspaper-seeds.json").read_text())
    count = 3000
    if count % len(patterns):
        raise ValueError("Pattern count must divide the library size")
    with tempfile.TemporaryDirectory(prefix="opencrossword-fill-") as folder:
        folder = Path(folder)
        binary = folder / "fill"
        subprocess.run(
            [
                os.environ.get("CXX", "c++"),
                "-std=c++17",
                "-O3",
                "scripts/crossword-fill.cpp",
                "-o",
                str(binary),
            ],
            check=True,
        )
        bank = folder / "words.txt"
        bank.write_text("\n".join(sorted(clues)))

        def batch(item):
            i, pattern = item
            output = folder / f"{i}.txt"
            subprocess.run(
                [
                    str(binary),
                    str(bank),
                    "".join(pattern),
                    "".join(bootstrap[i]),
                    str(20261030 + i * 100000),
                    str(count // len(patterns) + 50),
                    str(output),
                ],
                check=True,
            )
            return [
                make_puzzle([grid[n : n + 15] for n in range(0, 225, 15)], 0, clues)
                for grid in output.read_text().splitlines()
            ]

        with concurrent.futures.ThreadPoolExecutor(
            max_workers=min(6, len(patterns))
        ) as pool:
            batches = list(pool.map(batch, enumerate(patterns)))
    # Transposed patterns can occasionally converge on the same answer set.
    # Oversample each batch, then deduplicate across the entire library.
    puzzles = []
    seen_grids, seen_answers = set(), set()
    for batch in batches:
        for puzzle in batch:
            grid = "".join(puzzle["rows"])
            answers = ",".join(sorted(e["answer"] for e in puzzle["entries"]))
            if grid in seen_grids or answers in seen_answers:
                continue
            seen_grids.add(grid)
            seen_answers.add(answers)
            puzzles.append(puzzle)
    random.Random(20261030).shuffle(puzzles)
    puzzles = puzzles[:count]
    for i, puzzle in enumerate(puzzles):
        puzzle["id"] = i + 1
    if (
        len(puzzles) != count
        or len({"".join(p["rows"]) for p in puzzles}) != count
        or len({",".join(sorted(e["answer"] for e in p["entries"])) for p in puzzles})
        != count
    ):
        raise ValueError("Incomplete or duplicate library")
    target = Path(sys.argv[3])
    temporary = target.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(puzzles, separators=(",", ":")))
    temporary.replace(target)
    print(f"{len(puzzles)} full-size crosswords generated", flush=True)


if __name__ == "__main__":
    main()
