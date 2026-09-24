type Point = {x: number;y: number;};

const HAND_CONNECTIONS: [number, number][] = [
[0, 1], [1, 2], [2, 3], [3, 4],
[0, 5], [5, 6], [6, 7], [7, 8],
[5, 9], [9, 10], [10, 11], [11, 12],
[9, 13], [13, 14], [14, 15], [15, 16],
[13, 17], [0, 17], [17, 18], [18, 19], [19, 20]];


function toPoint(raw: unknown): Point | null {
  if (Array.isArray(raw) && raw.length >= 2 && typeof raw[0] === 'number' && typeof raw[1] === 'number') {
    return { x: raw[0], y: raw[1] };
  }
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    if (typeof r.x === 'number' && typeof r.y === 'number') return { x: r.x, y: r.y };
  }
  return null;
}

/** Accepts either one hand (21 points) or a list of hands, in normalized [0..1] coordinates. */
export function parseHands(landmarks: unknown): Point[][] {
  if (!Array.isArray(landmarks) || landmarks.length === 0) return [];
  const first = landmarks[0];
  const isHandList = Array.isArray(first) && first.length > 3;
  const hands = isHandList ? landmarks as unknown[] : [landmarks];
  return hands.
  map((hand) => Array.isArray(hand) ? hand.map(toPoint).filter((p): p is Point => p !== null) : []).
  filter((pts) => pts.length >= 21);
}

export function drawHands(ctx: CanvasRenderingContext2D, hands: Point[][], width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  hands.forEach((pts) => {
    ctx.strokeStyle = 'rgba(30, 215, 96, 0.9)';
    HAND_CONNECTIONS.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(pts[a].x * width, pts[a].y * height);
      ctx.lineTo(pts[b].x * width, pts[b].y * height);
      ctx.stroke();
    });
    ctx.fillStyle = '#ffffff';
    pts.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}