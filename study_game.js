const { spawn } = require("child_process");

const fens = [
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "rnbqkbnr/pppp1ppp/8/4p3/8/4P3/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
  "rnbqkbnr/pppp1ppp/8/4p3/8/4PQ2/PPPP1PPP/RNB1KBNR b KQkq - 1 2",
  "rnbqkbnr/pppp2pp/5p2/4p3/8/4PQ2/PPPP1PPP/RNB1KBNR w KQkq - 0 3",
  "rnbqkbnr/pppp2pp/5p2/4p3/8/2N1PQ2/PPPP1PPP/R1B1KBNR b KQkq - 1 3",
  "rnbqkb1r/pppp2pp/5p1n/4p3/8/2N1PQ2/PPPP1PPP/R1B1KBNR w KQkq - 2 4",
  "rnbqkb1r/pppp2pp/5p1n/4p3/2B5/2N1PQ2/PPPP1PPP/R1B1K1NR b KQkq - 3 4",
  "rnbqkb1r/ppp3pp/3p1p1n/4p3/2B5/2N1PQ2/PPPP1PPP/R1B1K1NR w KQkq - 0 5",
  "rnbqkb1r/ppp3pp/3p1p1n/4p2Q/2B5/2N1P3/PPPP1PPP/R1B1K1NR b KQkq - 1 5",
  "rnbqkb1r/ppp4p/3p1ppn/4p2Q/2B5/2N1P3/PPPP1PPP/R1B1K1NR w KQkq - 0 6",
  "rnbqkb1r/ppp4p/3p1ppn/4p3/2B4Q/2N1P3/PPPP1PPP/R1B1K1NR b KQkq - 1 6",
  "rn1qkb1r/ppp4p/3pbppn/4p3/2B4Q/2N1P3/PPPP1PPP/R1B1K1NR w KQkq - 2 7",
  "rn1qkb1r/ppp4p/3pBppn/4p3/7Q/2N1P3/PPPP1PPP/R1B1K1NR b KQkq - 0 7",
  "rn1qkb1r/ppp4p/3pBpp1/4pn2/7Q/2N1P3/PPPP1PPP/R1B1K1NR w KQkq - 1 8",
  "rn1qkb1r/ppp4p/3pBpp1/4pn2/2Q5/2N1P3/PPPP1PPP/R1B1K1NR b KQkq - 2 8",
  "rnq1kb1r/ppp4p/3pBpp1/4pn2/2Q5/2N1P3/PPPP1PPP/R1B1K1NR w KQkq - 3 9",
  "rnB1kb1r/ppp4p/3p1pp1/4pn2/2Q5/2N1P3/PPPP1PPP/R1B1K1NR b KQkq - 0 9",
  "rnBk1b1r/ppp4p/3p1pp1/4pn2/2Q5/2N1P3/PPPP1PPP/R1B1K1NR w KQ - 1 10",
  "rn1k1b1r/pBp4p/3p1pp1/4pn2/2Q5/2N1P3/PPPP1PPP/R1B1K1NR b KQ - 0 10",
  "r2k1b1r/pBpn3p/3p1pp1/4pn2/2Q5/2N1P3/PPPP1PPP/R1B1K1NR w KQ - 1 11",
  "B2k1b1r/p1pn3p/3p1pp1/4pn2/2Q5/2N1P3/PPPP1PPP/R1B1K1NR b KQ - 0 11",
  "B2k1b1r/p1pn2np/3p1pp1/4p3/2Q5/2N1P3/PPPP1PPP/R1B1K1NR w KQ - 1 12",
  "B2k1b1r/p1pn2np/3p1pp1/4p3/2Q5/2N1PN2/PPPP1PPP/R1B1K2R b KQ - 2 12",
  "Bn1k1b1r/p1p3np/3p1pp1/4p3/2Q5/2N1PN2/PPPP1PPP/R1B1K2R w KQ - 3 13",
  "Bn1k1b1r/p1p3np/3p1pp1/4p3/2Q5/1PN1PN2/P1PP1PPP/R1B1K2R b KQ - 0 13",
  "Bn1k1b1r/p5np/3p1pp1/2p1p3/2Q5/1PN1PN2/P1PP1PPP/R1B1K2R w KQ - 0 14",
  "Bn1k1b1r/p5np/3p1pp1/1Qp1p3/8/1PN1PN2/P1PP1PPP/R1B1K2R b KQ - 1 14",
  "B2k1b1r/p2n2np/3p1pp1/1Qp1p3/8/1PN1PN2/P1PP1PPP/R1B1K2R w KQ - 2 15",
  "B2k1b1r/p2n2np/3p1pp1/Q1p1p3/8/1PN1PN2/P1PP1PPP/R1B1K2R b KQ - 3 15",
  "B4b1r/p2nk1np/3p1pp1/Q1p1p3/8/1PN1PN2/P1PP1PPP/R1B1K2R w KQ - 4 16",
  "B4b1r/Q2nk1np/3p1pp1/2p1p3/8/1PN1PN2/P1PP1PPP/R1B1K2R b KQ - 0 16",
  "B4b1r/Q2nk1n1/3p1pp1/2p1p2p/8/1PN1PN2/P1PP1PPP/R1B1K2R w KQ - 0 17",
  "5b1r/Q2nk1n1/2Bp1pp1/2p1p2p/8/1PN1PN2/P1PP1PPP/R1B1K2R b KQ - 1 17",
  "5b1r/Q2n1kn1/2Bp1pp1/2p1p2p/8/1PN1PN2/P1PP1PPP/R1B1K2R w KQ - 2 18",
  "5b1r/3Q1kn1/2Bp1pp1/2p1p2p/8/1PN1PN2/P1PP1PPP/R1B1K2R b KQ - 0 18",
  "5bkr/3Q2n1/2Bp1pp1/2p1p2p/8/1PN1PN2/P1PP1PPP/R1B1K2R w KQ - 1 19",
  "5bkr/3Q2n1/3p1pp1/2pBp2p/8/1PN1PN2/P1PP1PPP/R1B1K2R b KQ - 2 19",
  "5b1r/3Q2nk/3p1pp1/2pBp2p/8/1PN1PN2/P1PP1PPP/R1B1K2R w KQ - 3 20",
  "5b1r/3Q2nk/3p1pp1/2pBp2p/8/BPN1PN2/P1PP1PPP/R3K2R b KQ - 4 20",
  "5br1/3Q2nk/3p1pp1/2pBp2p/8/BPN1PN2/P1PP1PPP/R3K2R w KQ - 5 21",
  "5bB1/3Q2nk/3p1pp1/2p1p2p/8/BPN1PN2/P1PP1PPP/R3K2R b KQ - 0 21",
  "5bk1/3Q2n1/3p1pp1/2p1p2p/8/BPN1PN2/P1PP1PPP/R3K2R w KQ - 0 22",
  "5bk1/3Q2n1/3p1pp1/2pNp2p/8/BP2PN2/P1PP1PPP/R3K2R b KQ - 1 22",
  "5bk1/3Q2n1/3p1p2/2pNp1pp/8/BP2PN2/P1PP1PPP/R3K2R w KQ - 0 23",
  "5bk1/3Q2n1/3p1N2/2p1p1pp/8/BP2PN2/P1PP1PPP/R3K2R b KQ - 0 23",
  "5b1k/3Q2n1/3p1N2/2p1p1pp/8/BP2PN2/P1PP1PPP/R3K2R w KQ - 1 24",
  "5b1k/3Q2n1/3p1N2/2p1p1Np/8/BP2P3/P1PP1PPP/R3K2R b KQ - 0 24"
];

for (const fen of fens) {
  const proc = spawn("node", ["bot.js"]);

  proc.stdin.write(fen + "\n"); // podajesz FEN jako stdin
  proc.stdin.end();

  proc.stdout.on("data", (data) => {
    console.log(`[OUT-${fen.slice(0, 10)}]: ${data}`);
  });

  proc.stderr.on("data", (data) => {
    console.error(`[ERR-${fen.slice(0, 10)}]: ${data}`);
  });
}
