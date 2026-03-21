import { useEffect, useRef } from "react";

interface HexBackgroundProps {
  opacity?: number; // multiplicador global de opacidad (default 1)
}

const HexBackground: React.FC<HexBackgroundProps> = ({ opacity = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const drawHex = (cx: number, cy: number, r: number, alpha: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(99, 102, 241, ${alpha * opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.008;

      const hexR = 36;
      const hexW = hexR * Math.sqrt(3);
      const hexH = hexR * 2;
      const cols = Math.ceil(canvas.width / hexW) + 2;
      const rows = Math.ceil(canvas.height / (hexH * 0.75)) + 2;

      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const cx = col * hexW + (row % 2) * (hexW / 2);
          const cy = row * hexH * 0.75;
          const dist = Math.sqrt(
            Math.pow((cx - canvas.width * 0.5) / canvas.width, 2) +
              Math.pow((cy - canvas.height * 0.5) / canvas.height, 2)
          );
          const pulse = Math.sin(t - dist * 6) * 0.5 + 0.5;
          const alpha = pulse * 0.12 + 0.03;
          drawHex(cx, cy, hexR * 0.88, alpha);
        }
      }

      animFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, [opacity]);

  return (
    <>
      {/* Canvas hex grid */}
      <canvas
    ref={canvasRef}
    style={{
        position: "fixed",  // ← cambia absolute por fixed
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
    }}
    />
    <div
    style={{
        position: "fixed",  // ← también este
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        background:
        "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(30,20,80,0.6) 0%, transparent 70%)",
    }}
    />
    </>
  );
};

export default HexBackground;