"""Exercise the shipped filler, separately from the full-library invariants."""

import json
from pathlib import Path
import subprocess
import tempfile
import unittest


class FillerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.folder = Path(cls.temp.name)
        cls.binary = cls.folder / "fill"
        subprocess.run(
            [
                "c++",
                "-std=c++17",
                "-O2",
                "scripts/crossword-fill.cpp",
                "-o",
                str(cls.binary),
            ],
            check=True,
        )
        seed = json.loads(Path("data/newspaper-seeds.json").read_text())[0]
        cls.grid = "".join(seed)
        cls.pattern = "".join("#" if c == "#" else "?" for c in cls.grid)
        # An exact seed solution is a small, deterministic fixture with every crossing checked.
        answers = set()
        for i, letter in enumerate(cls.grid):
            if letter == "#":
                continue
            for step in (1, 15):
                if (i >= 15 if step == 15 else i % 15 != 0) and cls.grid[
                    i - step
                ] != "#":
                    continue
                word = ""
                j = i
                while (
                    j < 225
                    and cls.grid[j] != "#"
                    and (step == 15 or j // 15 == i // 15)
                ):
                    word += cls.grid[j]
                    j += step
                answers.add(word)
        cls.bank = cls.folder / "words.txt"
        cls.bank.write_text("\n".join(sorted(answers)))

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def run_filler(self, pattern, output):
        return subprocess.run(
            [
                str(self.binary),
                str(self.bank),
                pattern,
                self.grid,
                "42",
                "1",
                str(output),
            ],
            capture_output=True,
            text=True,
            timeout=20,
        )

    def test_reproducible_complete_fill(self):
        a, b = self.folder / "a.txt", self.folder / "b.txt"
        self.assertEqual(self.run_filler(self.pattern, a).returncode, 0)
        self.assertEqual(self.run_filler(self.pattern, b).returncode, 0)
        self.assertEqual(a.read_text(), b.read_text())
        grid = a.read_text().strip()
        self.assertEqual(len(grid), 225)
        self.assertNotIn("?", grid)
        self.assertEqual(
            [i for i, c in enumerate(grid) if c == "#"],
            [i for i, c in enumerate(self.pattern) if c == "#"],
        )

    def test_rejects_invalid_pattern(self):
        result = self.run_filler("???", self.folder / "invalid.txt")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("15x15", result.stderr)


if __name__ == "__main__":
    unittest.main()
