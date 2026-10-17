export function nextLifeBoard(board, size) {
  return board.map((alive, i) => {
    const row = Math.floor(i / size), col = i % size;
    let neighbours = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const y = row + dy, x = col + dx;
      if ((dx || dy) && y >= 0 && y < size && x >= 0 && x < size && board[y * size + x]) neighbours++;
    }
    return alive ? neighbours === 2 || neighbours === 3 : neighbours === 3;
  });
}
const examples = [
  { cells: [12, 7], en: "0 or 1 neighbour: a live cell dies.", zh: "活细胞有0或1个活邻居：死亡。" },
  { cells: [12, 6, 7, 8, 11], en: "4+ neighbours: a live cell dies.", zh: "活细胞有4个或更多活邻居：死亡。" },
  { cells: [12, 7, 17], en: "2 or 3 neighbours: a live cell survives.", zh: "活细胞有2或3个活邻居：存活。" },
  { cells: [7, 11, 17], en: "Exactly 3 neighbours: an empty cell becomes alive.", zh: "空格有恰好3个活邻居：诞生。" },
];
export default function LifeRules({ lang = "en" }) {
  const zh = lang === "zh";
  return <section className="life-rules">
    <h3>{zh ? "Conway 生命游戏规则" : "Conway’s Game of Life"}</h3>
    <p>{zh ? "先放细胞，之后棋盘自动演化。邻居是周围8格（包括斜角），不包括自己；所有格子同时更新。" : "Choose the starting cells. The board then evolves automatically. Count the 8 surrounding squares, including diagonals, excluding the cell itself. All cells update together."}</p>
    <div className="life-rule-examples">{examples.map(({ cells, en, zh: chinese }) => {
      const before = Array.from({ length: 25 }, (_, i) => cells.includes(i));
      const after = nextLifeBoard(before, 5);
      return <article key={en}><strong>{zh ? chinese : en}</strong><div className="life-rule-pair">{[before, after].map((board, n) => <div className="life-rule-state" key={n}><small>{zh ? ["当前", "下一代"][n] : ["Before", "Next generation"][n]}</small><div className="life-mini-grid">{board.map((alive, i) => <i key={i} className={`${alive ? "alive" : ""} ${i === 12 ? "observed" : ""}`} />)}</div></div>)}<b aria-hidden="true">→</b></div></article>;
    })}</div>
    <small>{zh ? "白色边框＝观察的中心格；黄色＝活细胞。" : "White outline = the cell being observed. Yellow = alive."}</small>
  </section>;
}
