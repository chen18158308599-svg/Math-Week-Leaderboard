// Colour each interval by its own movement, independently of the daily return.
export function MarketPriceLine({ prices, width = 300, height = 58, insetX = 4, insetY = 6, strokeWidth = 2.2 }: {
  prices: number[]; width?: number; height?: number; insetX?: number; insetY?: number; strokeWidth?: number;
}) {
  if (!prices.length) return null;
  const low = Math.min(...prices) - 1;
  const high = Math.max(...prices) + 1;
  const points = prices.map((price, i) => ({
    x: insetX + i * (width - 2 * insetX) / Math.max(1, prices.length - 1),
    y: height - insetY - (price - low) / (high - low) * (height - 2 * insetY),
  }));
  if (prices.length === 1) return <circle cx={points[0].x} cy={points[0].y} r={strokeWidth} fill="#64748b" />;
  return <g fill="none" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {points.slice(1).map((point, i) => <path key={i}
      d={`M${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}L${point.x.toFixed(1)} ${point.y.toFixed(1)}`}
      stroke={prices[i + 1] > prices[i] ? "#15803d" : prices[i + 1] < prices[i] ? "#c73643" : "#64748b"} />)}
  </g>;
}
