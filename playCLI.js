const { Chess } = require("chess.js");
const readline = require("readline");
const { Worker } = require("worker_threads");

// Prevent bot.js's own CLI from hijacking stdin when imported
const botReadline = require("readline");
const realCreate = botReadline.createInterface;
botReadline.createInterface = () => ({ on: () => {}, close: () => {} });
const { searchRoot } = require("./bot.js");
botReadline.createInterface = realCreate;

// Helper: run searchRoot at given depth in a worker with timeout
function runDepthWorker(fen, depth, timeout) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      `
const { parentPort } = require('worker_threads');
const { Chess } = require('chess.js');
const { searchRoot } = require('./bot.js');
parentPort.once('message', ({ fen, depth }) => {
  const game = new Chess(fen);
  const result = searchRoot(game, depth);
  parentPort.postMessage(result);
});
      `, { eval: true }
    );
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error('timeout'));
    }, timeout);
    worker.once('message', (msg) => {
      clearTimeout(timer);
      resolve(msg);
      worker.terminate();
    });
    worker.once('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    worker.postMessage({ fen, depth });
  });
}

// CLI for human vs bot
(async () => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (msg) => new Promise(res => rl.question(msg, res));

  const fenArg = process.argv[2];
  const game = new Chess(fenArg || undefined);
  console.log(`Starting position: ${game.fen()}`);

  while (!game.isGameOver()) {
    console.log(game.ascii());
    let human;
    while (true) {
      human = await ask("Your move: ");
      if (game.move(human.trim(), { sloppy: true })) break;
      console.log("Invalid move, try again.");
    }
    if (game.isGameOver()) break;

    console.log("Bot is thinking...");
    let bestMove = null;
    let bestLine = [];
    try {
      const { best, line } = await runDepthWorker(game.fen(), 3, 15000);
      if (best) {
        bestMove = best;
        bestLine = line;
      }
    } catch {
      console.log("Bot failed to compute move at depth 3.");
      break;
    }

    if (!bestMove) {
      console.log("Bot failed to find a move.");
      break;
    }

    game.move(bestMove, { sloppy: true });
    console.log(`Bot plays: ${bestMove}  (variation: ${bestLine.join(" ")})`);
  }

  console.log("Game over.");
  if (game.isCheckmate()) console.log(`Checkmate! Winner: ${game.turn() === 'w' ? 'Black' : 'White'}`);
  else if (game.isStalemate()) console.log("Stalemate.");
  else if (game.isDraw()) console.log("Draw.");
  rl.close();
})();
