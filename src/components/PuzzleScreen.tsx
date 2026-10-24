import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Modal,
} from "react-native";
import { Game, Entry, cellKey, entryCells, getPuzzle } from "../game";
import { colors, fonts } from "../theme";
import { Button } from "./Button";
import { boardGeometry } from "../layout";
export function PuzzleScreen({
  game,
  onCell,
  onBack,
}: {
  game: Game;
  onCell: (key: string, value: string) => void;
  onBack: () => void;
}) {
  const p = getPuzzle(game.puzzleId),
    { width, height } = useWindowDimensions();
  const [entryIndex, setEntryIndex] = useState(0),
    [selected, setSelected] = useState(entryCells(p.entries[0])[0]),
    [showClues, setShowClues] = useState(false),
    [checking, setChecking] = useState(false);
  const entry = p.entries[entryIndex],
    activeCells = entryCells(entry),
    done = !!game.completedAt;
  const { boardWidth, cellSize } = boardGeometry(width, height, p.size);
  const selectEntry = (index: number) => {
    setEntryIndex(index);
    setSelected(entryCells(p.entries[index])[0]);
  };
  function selectCell(key: string) {
    const matches = p.entries
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => entryCells(e).includes(key));
    const same = matches.find(({ i }) => i === entryIndex);
    const next =
      key === selected && same
        ? matches.find(({ i }) => i !== entryIndex) ?? same
        : same ?? matches[0];
    if (next) {
      setEntryIndex(next.i);
      setSelected(key);
    }
  }
  function type(letter: string) {
    if (done) return;
    setChecking(false);
    const index = activeCells.indexOf(selected);
    if (letter === "⌫") {
      if (game.cells[selected]) onCell(selected, "");
      else if (index > 0) {
        setSelected(activeCells[index - 1]);
        onCell(activeCells[index - 1], "");
      }
      return;
    }
    onCell(selected, letter);
    if (index < activeCells.length - 1) setSelected(activeCells[index + 1]);
    else {
      const nextIndex = p.entries.findIndex(
        (e, i) =>
          i > entryIndex &&
          entryCells(e).some((k) => k !== selected && !game.cells[k])
      );
      if (nextIndex >= 0) selectEntry(nextIndex);
    }
  }
  const incorrect = Object.entries(game.cells)
    .filter(([key, value]) => {
      const [r, c] = key.split(",").map(Number);
      return value && value !== p.rows[r][c];
    })
    .map(([key]) => key);
  const filled = p.rows.every((row, r) =>
    [...row].every((v, c) => v === "." || Boolean(game.cells[cellKey(r, c)]))
  );
  const caption = done
    ? "Complete ✓"
    : checking
    ? incorrect.length
      ? "Try the marked squares"
      : "Looking good"
    : filled
    ? "Almost. Check your letters."
    : null;
  function clueLine(e: Entry, i: number) {
    return (
      <Pressable
        key={`${e.number}${e.direction}`}
        accessibilityRole="button"
        onPress={() => {
          selectEntry(i);
          setShowClues(false);
        }}
        style={[
          s.clueRow,
          i === entryIndex && { backgroundColor: colors.highlight },
        ]}
      >
        <Text style={s.clueNumber}>{e.number}</Text>
        <Text style={s.clueText}>
          {e.clue} <Text style={s.length}>({e.answer.length})</Text>
        </Text>
      </Pressable>
    );
  }
  return (
    <View style={s.screen}>
      <View style={s.top}>
        <Button quiet label="‹ Home" onPress={onBack} />
        <Text style={s.heading}>Puzzle {String(p.id).padStart(3, "0")}</Text>
        <Button quiet label="Clues" onPress={() => setShowClues(true)} />
      </View>
      <ScrollView contentContainerStyle={s.playContent} style={{ flex: 1 }}>
        <View style={[s.board, { width: boardWidth, height: boardWidth }]}>
          {p.rows.map((row, r) => (
            <View
              key={r}
              style={{
                flexDirection: "row",
                height: cellSize,
                width: boardWidth,
              }}
            >
              {[...row].map((letter, c) => {
                const key = cellKey(r, c),
                  number = p.entries.find(
                    (e) => e.row === r && e.col === c
                  )?.number;
                if (letter === ".")
                  return (
                    <View
                      key={key}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: colors.ink,
                      }}
                    />
                  );
                const error = checking && incorrect.includes(key);
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityLabel={`Row ${r + 1}, column ${c + 1}${
                      number ? `, ${number}` : ""
                    }, ${game.cells[key] || "blank"}${
                      error ? ", incorrect" : ""
                    }`}
                    accessibilityState={{ selected: selected === key }}
                    onPress={() => selectCell(key)}
                    style={[
                      s.cell,
                      { width: cellSize, height: cellSize },
                      activeCells.includes(key) && {
                        backgroundColor: colors.highlight,
                      },
                      selected === key &&
                        !done && { backgroundColor: colors.lime },
                      done && { backgroundColor: "#F0F5E6" },
                      error && { backgroundColor: "#F8DAD1" },
                    ]}
                  >
                    {number && (
                      <Text
                        allowFontScaling={false}
                        style={[
                          s.number,
                          { fontSize: Math.max(8, cellSize * 0.23) },
                        ]}
                      >
                        {number}
                      </Text>
                    )}
                    <Text
                      allowFontScaling={false}
                      style={[
                        s.letter,
                        { fontSize: cellSize * 0.53 },
                        error && { color: colors.error },
                      ]}
                    >
                      {game.cells[key] || ""}
                    </Text>
                    {error && <View style={s.errorDot} />}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
        {caption && (
          <Text
            accessibilityLiveRegion="polite"
            style={[
              s.caption,
              done && { color: colors.green, fontFamily: fonts.medium },
            ]}
          >
            {caption}
          </Text>
        )}
        <View style={s.clueBar}>
          <Button
            quiet
            label="‹"
            accessibilityLabel="Previous clue"
            onPress={() =>
              selectEntry(
                (entryIndex + p.entries.length - 1) % p.entries.length
              )
            }
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show all clues"
            onPress={() => setShowClues(true)}
            style={s.currentClue}
          >
            <Text style={s.clueLabel}>
              {entry.number} {entry.direction.toUpperCase()} ·{" "}
              {entry.answer.length}
            </Text>
            <Text style={s.currentText}>{entry.clue}</Text>
          </Pressable>
          <Button
            quiet
            label="›"
            accessibilityLabel="Next clue"
            onPress={() => selectEntry((entryIndex + 1) % p.entries.length)}
          />
        </View>
      </ScrollView>
      {done ? (
        <View style={s.done}>
          <Button label="Done" onPress={onBack} />
        </View>
      ) : (
        <View style={s.keyboard}>
          <View style={s.tools}>
            <Text style={s.toolHint}>
              {entry.direction === "across" ? "ACROSS →" : "DOWN ↓"}
            </Text>
            <Button
              quiet
              label="Check"
              onPress={() => setChecking((v) => !v)}
            />
          </View>
          {["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM⌫"].map((row, i) => (
            <View
              key={row}
              style={[
                s.keyRow,
                { paddingHorizontal: i === 1 ? 14 : i === 2 ? 28 : 0 },
              ]}
            >
              {[...row].map((key) => (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={key === "⌫" ? "Delete letter" : key}
                  onPress={() => type(key)}
                  style={({ pressed }) => [
                    s.key,
                    pressed && { backgroundColor: colors.lime },
                  ]}
                >
                  <Text allowFontScaling={false} style={s.keyText}>
                    {key}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      )}
      <Modal
        visible={showClues}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClues(false)}
      >
        <View style={s.modal}>
          <View style={s.modalTop}>
            <Text style={s.modalTitle}>Clues</Text>
            <Button quiet label="Done" onPress={() => setShowClues(false)} />
          </View>
          <ScrollView>
            {(["across", "down"] as const).map((direction) => (
              <View key={direction}>
                <Text style={s.clueSection}>
                  {direction === "across" ? "Across" : "Down"}
                </Text>
                {p.entries.map((e, i) =>
                  e.direction === direction ? clueLine(e, i) : null
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, width: "100%", maxWidth: 700, alignSelf: "center" },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  heading: { fontFamily: fonts.medium, color: colors.ink, fontSize: 15 },
  playContent: { alignItems: "center", paddingTop: 8, paddingBottom: 8 },
  board: {
    flexDirection: "column",
    backgroundColor: colors.ink,
    borderRadius: 8,
    overflow: "hidden",
  },
  cell: {
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  number: {
    position: "absolute",
    top: 1,
    left: 3,
    color: colors.ink,
    fontFamily: fonts.medium,
  },
  letter: { fontFamily: fonts.medium, color: colors.ink, paddingTop: 7 },
  errorDot: {
    position: "absolute",
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.error,
  },
  caption: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 14,
  },
  clueBar: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 8,
    marginTop: 16,
    minHeight: 86,
  },
  currentClue: { flex: 1, paddingVertical: 10, paddingHorizontal: 8 },
  clueLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.muted,
    marginBottom: 8,
  },
  currentText: {
    fontFamily: fonts.medium,
    color: colors.ink,
    fontSize: 18,
    lineHeight: 24,
  },
  keyboard: {
    paddingHorizontal: 6,
    paddingBottom: 10,
    alignSelf: "center",
    width: "100%",
    maxWidth: 540,
  },
  tools: {
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toolHint: {
    fontFamily: fonts.bold,
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  keyRow: {
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    marginBottom: 7,
  },
  key: {
    flex: 1,
    height: 48,
    backgroundColor: "#E6E9DF",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: { fontFamily: fonts.medium, fontSize: 19, color: colors.ink },
  done: { padding: 24 },
  modal: {
    flex: 1,
    backgroundColor: colors.paper,
    padding: 24,
    paddingTop: 32,
  },
  modalTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: { fontFamily: fonts.serif, fontSize: 30, color: colors.ink },
  clueSection: {
    fontFamily: fonts.medium,
    fontSize: 20,
    color: colors.ink,
    marginTop: 24,
    marginBottom: 12,
  },
  clueRow: {
    flexDirection: "row",
    gap: 16,
    padding: 14,
    minHeight: 52,
    borderRadius: 10,
  },
  clueNumber: {
    width: 24,
    fontFamily: fonts.bold,
    color: colors.ink,
    fontSize: 16,
  },
  clueText: {
    flex: 1,
    fontFamily: fonts.body,
    color: colors.ink,
    fontSize: 17,
    lineHeight: 25,
  },
  length: { color: colors.muted },
});
