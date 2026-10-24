import {
  FlatList,
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
} from "react-native";
import {
  State,
  Game,
  canStart,
  dayKey,
  orderedGames,
  progress,
  puzzles,
} from "../game";
import { colors, fonts } from "../theme";
import { Button } from "./Button";
function MiniGrid({ done }: { done: boolean }) {
  return (
    <View accessible={false} style={s.mini}>
      {Array.from({ length: 9 }, (_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            {
              backgroundColor: [2, 6].includes(i)
                ? colors.ink
                : done
                ? colors.lime
                : colors.line,
            },
          ]}
        />
      ))}
    </View>
  );
}
export function Home({
  state,
  now,
  busy,
  onStart,
  onOpen,
  onError,
}: {
  state: State;
  now: Date;
  busy: boolean;
  onStart: () => void;
  onOpen: (id: number) => void;
  onError: () => void;
}) {
  const unfinished = orderedGames(state, false),
    completed = orderedGames(state, true),
    available = canStart(state, dayKey(now));
  const rows: ({ heading: string } | { game: Game })[] = [
    ...(unfinished.length
      ? [{ heading: "Continue" }, ...unfinished.map((game) => ({ game }))]
      : []),
    ...(completed.length
      ? [{ heading: "Completed" }, ...completed.map((game) => ({ game }))]
      : []),
  ];
  return (
    <FlatList
      style={s.page}
      contentContainerStyle={s.content}
      data={rows}
      keyExtractor={(item) =>
        "heading" in item ? item.heading : String(item.game.puzzleId)
      }
      ListHeaderComponent={
        <View>
          <View style={s.brand}>
            <MiniGrid done />
            <Text style={s.brandText}>100% FREE · NO ADS</Text>
          </View>
          <Text accessibilityRole="header" style={s.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            OpenCrossword
          </Text>
          <Text style={s.date}>
            {now.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
          <View style={s.hero}>
            <View style={s.heroTop}>
              <Text style={s.heroLabel}>
                {available
                  ? "Today’s puzzle"
                  : state.next >= puzzles.length
                  ? "All done"
                  : "See you tomorrow"}
              </Text>
              <Text style={s.sun}>{available ? "✦" : "✓"}</Text>
            </View>
            {available ? (
              <Button
                label="New puzzle"
                accessibilityLabel="Start new puzzle"
                onPress={onStart}
                disabled={busy}
              />
            ) : (
              <Text style={s.heroSub}>
                {state.next >= puzzles.length
                  ? "3,000 puzzles. Complete."
                  : "A fresh puzzle each day."}
              </Text>
            )}
          </View>
        </View>
      }
      renderItem={({ item }) =>
        "heading" in item ? (
          <Text accessibilityRole="header" style={s.section}>
            {item.heading}
          </Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${
              item.game.completedAt
                ? "View completed puzzle"
                : "Continue puzzle"
            } ${item.game.puzzleId}`}
            onPress={() => onOpen(item.game.puzzleId)}
            style={({ pressed }) => [s.row, pressed && { opacity: 0.6 }]}
          >
            <MiniGrid done={!!item.game.completedAt} />
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>
                Puzzle {String(item.game.puzzleId).padStart(3, "0")}
              </Text>
              <Text style={s.rowSub}>
                {new Date(`${item.game.day}T12:00:00`).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                )}
              </Text>
            </View>
            <Text style={s.percent}>
              {item.game.completedAt ? "✓" : `${progress(item.game)}%`}
            </Text>
            <Text style={s.arrow}>›</Text>
          </Pressable>
        )
      }
      ListFooterComponent={
        <View style={s.footer}>
          <Text style={s.footerNote}>Just free daily crosswords.</Text>
          <Button
            quiet
            label="Privacy & support"
            onPress={() => {
              void Linking.openURL(
                "https://for-real-labs.github.io/opencrossword/"
              ).catch(onError);
            }}
          />
        </View>
      }
    />
  );
}
const s = StyleSheet.create({
  page: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    flexGrow: 1,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 34,
  },
  brandText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 3,
    color: colors.ink,
  },
  mini: {
    width: 34,
    height: 34,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
  },
  dot: { width: 9, height: 9, borderRadius: 2 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 34,
    letterSpacing: -1.5,
    color: colors.ink,
  },
  date: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.muted,
    marginTop: 10,
  },
  hero: {
    backgroundColor: "#EBEEDF",
    padding: 22,
    borderRadius: 24,
    marginTop: 32,
    marginBottom: 12,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  heroLabel: { fontFamily: fonts.medium, fontSize: 19, color: colors.ink },
  sun: { fontSize: 30, color: colors.green },
  heroSub: { fontFamily: fonts.body, fontSize: 15, color: colors.muted },
  section: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.ink,
    marginTop: 26,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 19,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    minHeight: 84,
  },
  rowTitle: { fontFamily: fonts.medium, fontSize: 17, color: colors.ink },
  rowSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 5,
  },
  percent: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted },
  arrow: { fontSize: 24, color: colors.muted },
  footer: { alignItems: "center", paddingTop: 48, marginTop: "auto" },
  footerNote: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginBottom: 8,
  },
});
