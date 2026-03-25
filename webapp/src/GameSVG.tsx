import React from 'react';

const HexBoard: React.FC = () => {
  const size = 5;
  const r = 22;
  const hexW = r * Math.sqrt(3);
  const hexH = r * 2;

  const cells: { cx: number; cy: number; row: number; col: number }[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col <= row; col++) {
      const cx = (col - row / 2) * hexW + (size * hexW) / 2;
      const cy = row * hexH * 0.75 + r;
      cells.push({ cx, cy, row, col });
    }
  }

  const svgW = size * hexW;
  const svgH = (size - 1) * hexH * 0.75 + hexH;

  const hexPath = (cx: number, cy: number) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * 0.88 * Math.cos(a)},${cy + r * 0.88 * Math.sin(a)}`;
    });
    return `M${pts.join('L')}Z`;
  };

  const colors = [
    '#1d4ed8', '#991b1b', null,
    '#1d4ed8', null, null,
    null, '#991b1b', null, null,
    null, null, null, null, null,
  ];

  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
      {cells.map(({ cx, cy }, i) => {
        const fill = colors[i];
        return (
          <g key={i}>
            <path
              d={hexPath(cx, cy)}
              fill={fill ?? 'rgba(255,255,255,0.04)'}
              stroke={fill ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.25)'}
              strokeWidth="1"
            />
          </g>
        );
      })}
    </svg>
  );
};

export default HexBoard;