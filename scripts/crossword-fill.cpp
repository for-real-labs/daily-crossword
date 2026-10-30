// Build-time crossword constraint solver. No native code is added to the app.
#include <algorithm>
#include <array>
#include <cstdint>
#include <deque>
#include <fstream>
#include <iostream>
#include <random>
#include <set>
#include <string>
#include <vector>
using Mask = std::vector<uint64_t>;
using Domains = std::vector<Mask>;
struct Slot {
  std::vector<int> cells;
};
struct Link {
  int slot, otherPosition, position;
};
class Filler {
  std::array<std::vector<std::string>, 16> words;
  std::array<std::vector<std::array<Mask, 26>>, 16> index;
  std::array<Mask, 16> all;
  std::vector<Slot> slots;
  std::vector<std::vector<Link>> links;
  std::string pattern;
  std::mt19937 random;
  int nodes = 0, limit = 0;
  static int count(const Mask &m) {
    int n = 0;
    for (auto v : m)
      n += __builtin_popcountll(v);
    return n;
  }
  static bool intersects(const Mask &a, const Mask &b) {
    for (size_t i = 0; i < a.size(); i++)
      if (a[i] & b[i])
        return true;
    return false;
  }
  static int first(const Mask &m) {
    for (size_t i = 0; i < m.size(); i++)
      if (m[i])
        return int(i * 64 + __builtin_ctzll(m[i]));
    return -1;
  }
  bool propagate(Domains &domains, std::deque<int> queue) {
    std::vector<bool> queued(slots.size());
    for (int k : queue)
      queued[k] = true;
    auto enqueue = [&](int k) {
      if (!queued[k]) {
        queue.push_back(k);
        queued[k] = true;
      }
    };
    while (!queue.empty()) {
      int k = queue.front();
      queue.pop_front();
      queued[k] = false;
      int length = slots[k].cells.size();
      if (count(domains[k]) == 1) {
        int word = first(domains[k]);
        for (size_t j = 0; j < slots.size(); j++) {
          if (int(j) == k || slots[j].cells.size() != size_t(length))
            continue;
          if (domains[j][word / 64] & (uint64_t(1) << (word % 64))) {
            domains[j][word / 64] &= ~(uint64_t(1) << (word % 64));
            if (count(domains[j]) == 0)
              return false;
            enqueue(j);
          }
        }
      }
      for (auto link : links[k]) {
        int j = link.slot, otherLength = slots[j].cells.size();
        Mask allowed(domains[j].size());
        for (int c = 0; c < 26; c++)
          if (intersects(domains[k], index[length][link.position][c])) {
            auto &matching = index[otherLength][link.otherPosition][c];
            for (size_t n = 0; n < allowed.size(); n++)
              allowed[n] |= matching[n];
          }
        bool changed = false, nonempty = false;
        for (size_t n = 0; n < allowed.size(); n++) {
          uint64_t next = domains[j][n] & allowed[n];
          changed |= next != domains[j][n];
          nonempty |= next != 0;
          domains[j][n] = next;
        }
        if (!nonempty)
          return false;
        if (changed)
          enqueue(j);
      }
    }
    return true;
  }
  bool search(Domains &domains) {
    if (++nodes > limit)
      return false;
    int selected = -1, best = 100000;
    for (size_t k = 0; k < domains.size(); k++) {
      int n = count(domains[k]);
      if (n > 1 && n < best) {
        selected = k;
        best = n;
      }
    }
    if (selected < 0)
      return true;
    std::vector<int> choices;
    for (size_t k = 0; k < domains[selected].size(); k++) {
      auto bits = domains[selected][k];
      while (bits) {
        int b = __builtin_ctzll(bits);
        choices.push_back(k * 64 + b);
        bits &= bits - 1;
      }
    }
    std::shuffle(choices.begin(), choices.end(), random);
    for (int word : choices) {
      Domains next = domains;
      std::fill(next[selected].begin(), next[selected].end(), 0);
      next[selected][word / 64] = uint64_t(1) << (word % 64);
      if (propagate(next, {selected}) && search(next)) {
        domains = std::move(next);
        return true;
      }
      if (nodes > limit)
        return false;
    }
    return false;
  }

public:
  Filler(const std::string &path, const std::string &grid, uint32_t seed)
      : pattern(grid), random(seed) {
    std::ifstream input(path);
    std::string word;
    while (std::getline(input, word)) {
      if (word.size() < 3 || word.size() > 15 ||
          word.find_first_not_of("ABCDEFGHIJKLMNOPQRSTUVWXYZ") !=
              std::string::npos)
        throw std::runtime_error("Invalid word");
      words[word.size()].push_back(word);
    }
    for (int len = 3; len <= 15; len++) {
      auto &ws = words[len];
      std::sort(ws.begin(), ws.end());
      size_t chunks = (ws.size() + 63) / 64;
      all[len] = Mask(chunks);
      index[len].resize(len);
      for (auto &position : index[len])
        for (auto &letters : position)
          letters = Mask(chunks);
      for (size_t i = 0; i < ws.size(); i++) {
        uint64_t bit = uint64_t(1) << (i % 64);
        all[len][i / 64] |= bit;
        for (int pos = 0; pos < len; pos++)
          index[len][pos][ws[i][pos] - 'A'][i / 64] |= bit;
      }
    }
    if (pattern.size() != 225)
      throw std::runtime_error("Expected a 15x15 pattern");
    for (int i = 0; i < 225; i++)
      if (pattern[i] != '#')
        for (int d : {1, 15}) {
          if ((d == 15 ? i >= 15 : i % 15 != 0) && pattern[i - d] != '#')
            continue;
          Slot s;
          for (int j = i;
               j < 225 && pattern[j] != '#' && (d == 15 || j / 15 == i / 15);
               j += d)
            s.cells.push_back(j);
          if (s.cells.size() < 3 || all[s.cells.size()].empty())
            throw std::runtime_error("Invalid slot");
          slots.push_back(s);
        }
    links.resize(slots.size());
    std::array<std::vector<std::pair<int, int>>, 225> cells;
    for (size_t k = 0; k < slots.size(); k++)
      for (size_t p = 0; p < slots[k].cells.size(); p++)
        cells[slots[k].cells[p]].push_back({k, p});
    for (auto &cell : cells)
      for (auto a : cell)
        for (auto b : cell)
          if (a.first != b.first)
            links[a.first].push_back({b.first, b.second, a.second});
  }
  std::string solve(const std::string &previous) {
    Domains domains;
    for (auto &slot : slots)
      domains.push_back(all[slot.cells.size()]);
    if (!previous.empty()) {
      std::vector<int> choices;
      for (size_t k = 0; k < slots.size(); k++)
        choices.push_back(k);
      std::shuffle(choices.begin(), choices.end(), random);
      for (int n = 0; n < 8; n++) {
        int k = choices[n];
        std::string word;
        for (int cell : slots[k].cells)
          word += previous[cell];
        auto &ws = words[word.size()];
        auto it = std::lower_bound(ws.begin(), ws.end(), word);
        if (it == ws.end() || *it != word)
          throw std::runtime_error("Seed answer not in bank");
        int id = it - ws.begin();
        std::fill(domains[k].begin(), domains[k].end(), 0);
        domains[k][id / 64] = uint64_t(1) << (id % 64);
      }
    }
    std::deque<int> queue;
    for (size_t k = 0; k < slots.size(); k++)
      queue.push_back(k);
    nodes = 0;
    limit = previous.empty() ? 50000 : 2000;
    if (!propagate(domains, queue) || !search(domains))
      return "";
    std::string grid = pattern;
    for (size_t k = 0; k < slots.size(); k++) {
      auto &word = words[slots[k].cells.size()][first(domains[k])];
      for (size_t p = 0; p < word.size(); p++)
        grid[slots[k].cells[p]] = word[p];
    }
    return grid;
  }
  std::string answerSet(const std::string &grid) {
    std::vector<std::string> answers;
    for (auto &slot : slots) {
      std::string answer;
      for (int cell : slot.cells)
        answer += grid[cell];
      answers.push_back(answer);
    }
    std::sort(answers.begin(), answers.end());
    std::string result;
    for (auto &w : answers)
      result += w + ",";
    return result;
  }
};
int main(int argc, char **argv) {
  try {
    if (argc != 7)
      throw std::runtime_error(
          "Expected bank, pattern, seed grid, seed, count, output");
    std::string pattern = argv[2], previous = argv[3];
    if (previous == "-")
      previous = "";
    uint32_t seed = std::stoul(argv[4]);
    int target = std::stoi(argv[5]);
    Filler filler(argv[1], pattern, seed);
    std::ofstream out(argv[6]);
    if (!out)
      throw std::runtime_error("Cannot open output");
    std::set<std::string> grids, answers;
    for (int attempt = 0; attempt < target * 200 && int(grids.size()) < target;
         attempt++) {
      auto grid = filler.solve(previous);
      if (grid.empty())
        continue;
      previous = grid;
      auto answerSet = filler.answerSet(grid);
      if (grids.count(grid) || answers.count(answerSet))
        continue;
      grids.insert(grid);
      answers.insert(answerSet);
      out << grid << '\n';
      out.flush();
      if (grids.size() == 1 || grids.size() % 100 == 0)
        std::cerr << "Pattern " << seed << ": " << grids.size() << "/" << target
                  << std::endl;
    }
    if (int(grids.size()) != target)
      throw std::runtime_error(
          "Unable to generate requested number of unique grids");
  } catch (const std::exception &e) {
    std::cerr << e.what() << std::endl;
    return 1;
  }
}
