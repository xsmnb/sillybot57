const { Chess } = require("chess.js");
const readline = require("readline");
const path = require("path");
const fs = require("fs");

let currentPieceDelta = 0;
let currentActivityDelta = 0;
let currentCenterControlDelta = 0;
const moveCategories = {};
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});
if (require.main === module) {
  rl.on("line", (fen) => {
    rl.close();
    startBot(fen.trim());
  });
}
function startBot(fen) {
  const root = new Chess(fen);
  let depth = 1;
  (function nextDepth() {
    const start = Date.now();
    const { best, line } = searchRoot(root, depth);
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    currentBest = best;
    console.log(
      `depth = ${depth}, time = ${elapsed}s, line = ${line.join(
        " "
      )}, activity = ${currentActivityDelta}, material = ${currentPieceDelta}, center control = ${currentCenterControlDelta}`
    );
    depth++;
    setImmediate(nextDepth);
  })();
}
const CACHE_FILE = path.join(__dirname, ".analysis_cache.json");
let CACHE = {};
try {
  CACHE = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
} catch {
  CACHE = {};
}

function saveCache() {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(CACHE, null, 2));
}
const categoryWeights = {
  szach: 100,
  promocja: 90,
  bicie: 80,
  "slabe bicie": 40,
  "ruch do przodu": 10,
  "nudny ruch": 0,
  podstawka: -999,
};
function sortMoves(board, moves) {
  const stm = board.turn();
  const opponent = stm === "w" ? "b" : "w";
  const materialValues = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  const scoredMoves = [];
  for (const m of moves) {
    const key = m.from + m.to + (m.promotion || "");
    let category = "nudny ruch";
    let target = board.get(m.to);
    const wasCapture = m.flags.includes("c") || m.flags.includes("e");
    let isWeakCapture = false;
    if (wasCapture && target) {
      board.move(m);
      const capType = target.type;
      const capValue = materialValues[capType] || 0;
      const oppMoves = board.moves({ verbose: true });
      for (const om of oppMoves) {
        if (
          (om.flags.includes("c") || om.flags.includes("e")) &&
          om.to === m.to
        ) {
          const atkFromPiece = board.get(om.from);
          const atkValue = materialValues[atkFromPiece.type] || 0;
          if (atkValue < capValue) {
            isWeakCapture = true;
            break;
          }
        }
      }
      board.undo();
    }
    board.move(m);
    if (board.isAttacked(m.to, opponent) && !board.isAttacked(m.to, stm)) {
      category = "podstawka";
    } else if (board.inCheck()) {
      category = "szach";
    } else if (m.promotion) {
      category = "promocja";
    } else if (wasCapture) {
      category = isWeakCapture ? "slabe bicie" : "bicie";
    } else {
      const fromRank = parseInt(m.from[1], 10);
      const toRank = parseInt(m.to[1], 10);
      if (
        (stm === "w" && toRank > fromRank) ||
        (stm === "b" && toRank < fromRank)
      ) {
        category = "ruch do przodu";
      }
    }
    board.undo();
    moveCategories[key] = category;
    scoredMoves.push({ move: m, score: categoryWeights[category] });
  }
  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves.map((obj) => obj.move);
}
function negamaxLine(node, depth, alpha, beta) {
  if (depth === 0) return { score: evalNode(node), line: [] };
  let moves = node.moves({ verbose: true });
  if (moves.length === 0)
    return { score: node.inCheck() ? -100000 + depth : 0, line: [] };
  moves = sortMoves(node, moves);
  let best = -Infinity;
  let bestLine = [];
  for (const m of moves) {
    node.move(m);
    const { score, line } = negamaxLine(node, depth - 1, -beta, -alpha);
    const actualScore = -score;
    node.undo();
    if (actualScore > best) {
      best = actualScore;
      bestLine = [m.from + m.to + (m.promotion || "")].concat(line);
    }
    alpha = Math.max(alpha, actualScore);
    if (alpha >= beta) break;
  }
  return { score: best, line: bestLine };
}
function searchRoot(root, maxDepth) {
  const fen = root.fen();
  const cacheEntry = CACHE[fen] || {};
  if (cacheEntry.depth >= maxDepth) {
    return { best: cacheEntry.best, line: cacheEntry.line };
  }
  let moves = root.moves({ verbose: true });
  if (!moves.length) return { best: null, line: [], sortedMoves: [] };
  moves = sortMoves(root, moves);
  let bestMove = moves[0];
  let bestScore = -Infinity;
  let bestLine = [];
  let alpha = -Infinity,
    beta = Infinity;
  for (const m of moves) {
    root.move(m);
    if (root.isCheckmate()) {
      root.undo();
      return { best: m.from + m.to, line: [m.from + m.to], sortedMoves: moves };
    }
    const { score, line } = negamaxLine(root, maxDepth - 1, -beta, -alpha);
    const actualScore = -score;
    root.undo();
    if (actualScore > bestScore) {
      bestScore = actualScore;
      bestMove = m;
      bestLine = [m.from + m.to + (m.promotion || "")].concat(line);
      alpha = Math.max(alpha, actualScore);
    }
  }
  CACHE[fen] = {
    depth: maxDepth,
    best: bestMove.from + bestMove.to,
    line: bestLine,
    timestamp: Date.now(),
  };
  saveCache();
  return {
    best: bestMove.from + bestMove.to,
    line: bestLine,
    sortedMoves: moves,
  };
}
function evalNode(node) {
  const board = node.board();
  const materialValues = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  const centerSquares = ["d4", "d5", "e4", "e5"];
  const pieceCount = board.flat().filter(Boolean).length;

  let materialScore = 0;
  let activityCountsWhite = { n: 0, b: 0, r: 0, q: 0 };
  let activityCountsBlack = { n: 0, b: 0, r: 0, q: 0 };
  let centerControlWhite = 0;
  let centerControlBlack = 0;

  const phase =
    pieceCount > 26 ? "opening" : pieceCount > 14 ? "midgame" : "endgame";

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (!piece) continue;

      const val = materialValues[piece.type] || 0;
      materialScore += piece.color === "w" ? val : -val;

      const square = String.fromCharCode(97 + j) + (8 - i);
      const moves = node.moves({ square, verbose: true });

      if (
        piece.color === "w" &&
        activityCountsWhite.hasOwnProperty(piece.type)
      ) {
        activityCountsWhite[piece.type] += moves.length;
      }
      if (
        piece.color === "b" &&
        activityCountsBlack.hasOwnProperty(piece.type)
      ) {
        activityCountsBlack[piece.type] += moves.length;
      }

      if (phase === "opening") {
        for (const m of moves) {
          if (centerSquares.includes(m.to)) {
            const weight =
              piece.type === "p"
                ? 0.6
                : piece.type === "n"
                ? 0.3
                : piece.type === "b"
                ? 0.3
                : 0;
            if (piece.color === "w") centerControlWhite += weight;
            else centerControlBlack += weight;
          }
        }
      }
    }
  }

  let activityScore;
  if (phase === "opening") {
    activityScore =
      0.2 * (activityCountsWhite.n - activityCountsBlack.n) +
      0.2 * (activityCountsWhite.b - activityCountsBlack.b);
  } else {
    const sumW =
      activityCountsWhite.n +
      activityCountsWhite.b +
      activityCountsWhite.r +
      activityCountsWhite.q;
    const sumB =
      activityCountsBlack.n +
      activityCountsBlack.b +
      activityCountsBlack.r +
      activityCountsBlack.q;
    activityScore = 0.1 * (sumW - sumB);
  }
  const centerControlScore = centerControlWhite - centerControlBlack;
  currentPieceDelta = materialScore;
  currentActivityDelta = activityScore;
  currentCenterControlDelta = centerControlScore;

  const raw =
    materialScore +
    activityScore +
    (phase === "opening" ? centerControlScore : 0);
  return (node.turn() === "w" ? +1 : -1) * raw;
}

module.exports = { searchRoot, evalNode, sortMoves };
