// npm install chess.js
const { Chess } = require("chess.js");
const fs = require("fs");

// wklej tu PGN Twojej partii:
const pgn = `
1. e4 Nf6 2. Nc3 e6 3. Nf3 Bc5 4. g3 b6 5. b3 Bb7 6. Ng5 Bd4
7. Nf3 Bc5 8. Bd3 Nc6 9. O-O Nb4 10. h3 Nxd3 11. cxd3 g6 12. g4 Rb8
13. Rb1 a5 14. e5 Ng8 15. Kh2 f5 16. Ne1 Ne7 17. Kg3 g5 18. Ne4 fxe4
19. dxe4 h5 20. Kg2 Bxe4+ 21. Qf3 Bxf3+ 22. Nxf3 hxg4 23. hxg4 Ng6
24. Kg1 O-O 25. Ra1 Rxf3 26. Bb2 Qf8 27. Ba3 Bxa3 28. Kh1 Nxe5
29. Rad1 Nxg4 30. Kg2 Rd3 31. f4 gxf4 32. Rxf4 Qxf4 33. Rb1 Qg3+
34. Kh1 Nf2#
`;
const chess = new Chess();
chess.loadPgn(pgn);

const fens = [];
// pozycja startowa
fens.push(chess.fen());
// wykonaj kolejno półruchy
const moves = chess.history();
chess.reset();
moves.forEach(move => {
  chess.move(move);
  fens.push(chess.fen());
});

// opcjonalnie: wyświetl albo zapisz do pliku
console.log(JSON.stringify(fens, null, 2));
fs.writeFileSync("fens.json", JSON.stringify(fens, null, 2));
