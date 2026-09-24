/**
 * High-precision canvas drawing utility for rendering hand skeletons from MediaPipe landmarks.
 * Features neon glowing joints, bone lines, distinct color profiles for multi-hand signs.
 */

import type { LandmarkPoint } from '../types';

const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [5, 9], [9, 13], [13, 17]
];

export function drawHandLandmarks(
  ctx: CanvasRenderingContext2D,
  hands: LandmarkPoint[][],
  width: number,
  height: number
) {
  ctx.clearRect(0, 0, width, height);
  if (!hands || hands.length === 0) return;

  hands.forEach((hand, handIdx) => {
    if (!hand || hand.length < 21) return;

    const isPrimary = handIdx === 0;
    const boneColor = isPrimary ? 'rgba(16, 185, 129, 0.92)' : 'rgba(99, 102, 241, 0.92)';
    const tipColor = isPrimary ? '#38BDF8' : '#818CF8';
    const jointColor = isPrimary ? '#10B981' : '#6366F1';

    // Compute dynamic scale factor based on the hand's real pixel size on screen
    const wristPt = hand[0];
    const midMcpPt = hand[9];
    const palmPixels = Math.hypot(
      (midMcpPt.x - wristPt.x) * width,
      (midMcpPt.y - wristPt.y) * height
    );
    const scaleFactor = Math.max(1.0, Math.min(2.2, palmPixels / 85.0));

    // 0. Draw subtle translucent Palm Bio-Mesh so the skeleton fills the real hand palm area
    const palmIndices = [0, 1, 5, 9, 13, 17];
    ctx.beginPath();
    palmIndices.forEach((idx, i) => {
      const pt = hand[idx];
      if (i === 0) ctx.moveTo(pt.x * width, pt.y * height);
      else ctx.lineTo(pt.x * width, pt.y * height);
    });
    ctx.closePath();
    ctx.fillStyle = isPrimary ? 'rgba(16, 185, 129, 0.14)' : 'rgba(99, 102, 241, 0.14)';
    ctx.fill();

    // 1. Draw Proportional Bones (plus subtle outer glow)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Outer bone glow
    ctx.lineWidth = 8.0 * scaleFactor;
    ctx.strokeStyle = isPrimary ? 'rgba(16, 185, 129, 0.22)' : 'rgba(99, 102, 241, 0.22)';
    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = hand[startIdx];
      const p2 = hand[endIdx];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }
    }

    // Core structural bone line
    ctx.lineWidth = 4.2 * scaleFactor;
    ctx.strokeStyle = boneColor;
    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = hand[startIdx];
      const p2 = hand[endIdx];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }
    }

    // 2. Draw Landmark Joints with Proportional Glowing Halos (extending to fingertip pads)
    const tipToDipMap: Record<number, number> = { 4: 3, 8: 7, 12: 11, 16: 15, 20: 19 };

    for (let i = 0; i < hand.length; i++) {
      const pt = hand[i];
      let cx = pt.x * width;
      let cy = pt.y * height;
      const isTip = [4, 8, 12, 16, 20].includes(i);
      const isWrist = i === 0;

      // Extend fingertip point slightly along the distal phalanx vector to reach the very top of the fingernail
      if (isTip && tipToDipMap[i] !== undefined) {
        const dip = hand[tipToDipMap[i]];
        cx += (pt.x - dip.x) * width * 0.22;
        cy += (pt.y - dip.y) * height * 0.22;
      }

      // Glow halo on fingertips
      if (isTip) {
        ctx.beginPath();
        ctx.arc(cx, cy, 11 * scaleFactor, 0, 2 * Math.PI);
        ctx.fillStyle = isPrimary ? 'rgba(56, 189, 248, 0.35)' : 'rgba(129, 140, 248, 0.35)';
        ctx.fill();
      }

      ctx.beginPath();
      const radius = (isTip ? 6.5 : isWrist ? 7.0 : 4.8) * scaleFactor;
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isTip ? tipColor : isWrist ? '#F59E0B' : jointColor;
      ctx.fill();

      // Sharp white core border
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
    }

    // 3. Draw Full-Hand Tracking Reticle / Bounding Corner Brackets around the entire hand silhouette
    const xs = hand.map(p => p.x * width);
    const ys = hand.map(p => p.y * height);
    const pad = Math.max(24, palmPixels * 0.25);
    const minX = Math.max(8, Math.min(...xs) - pad);
    const maxX = Math.min(width - 8, Math.max(...xs) + pad);
    const minY = Math.max(8, Math.min(...ys) - pad);
    const maxY = Math.min(height - 8, Math.max(...ys) + pad);
    const cornerLen = Math.max(16, Math.round(16 * scaleFactor));

    ctx.strokeStyle = isPrimary ? 'rgba(99, 102, 241, 0.9)' : 'rgba(16, 185, 129, 0.9)';
    ctx.lineWidth = 2.8;

    // Top-left bracket
    ctx.beginPath();
    ctx.moveTo(minX, minY + cornerLen);
    ctx.lineTo(minX, minY);
    ctx.lineTo(minX + cornerLen, minY);
    ctx.stroke();

    // Top-right bracket
    ctx.beginPath();
    ctx.moveTo(maxX - cornerLen, minY);
    ctx.lineTo(maxX, minY);
    ctx.lineTo(maxX, minY + cornerLen);
    ctx.stroke();

    // Bottom-left bracket
    ctx.beginPath();
    ctx.moveTo(minX, maxY - cornerLen);
    ctx.lineTo(minX, maxY);
    ctx.lineTo(minX + cornerLen, maxY);
    ctx.stroke();

    // Bottom-right bracket
    ctx.beginPath();
    ctx.moveTo(maxX - cornerLen, maxY);
    ctx.lineTo(maxX, maxY);
    ctx.lineTo(maxX, maxY - cornerLen);
    ctx.stroke();
  });
}
