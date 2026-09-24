import type { HandPose, GestureAnimationDefinition, GesturePhase } from './types';

// Utility helper to lerp numbers
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

// Flat open hand pose
export function createOpenHandPose(): HandPose {
  return {
    wrist: { rotX: 0, rotY: 0, rotZ: 0, posX: 0, posY: 0, posZ: 0 },
    thumb: { cmc: 0.1, mcp: 0.1, dip: 0.1, splay: 0.1 },
    index: { mcp: 0.05, pip: 0.05, dip: 0.05, splay: -0.06 },
    middle: { mcp: 0.02, pip: 0.02, dip: 0.02, splay: 0 },
    ring: { mcp: 0.05, pip: 0.05, dip: 0.05, splay: 0.06 },
    pinky: { mcp: 0.08, pip: 0.08, dip: 0.08, splay: 0.12 },
  };
}

// Closed fist pose
export function createFistPose(): HandPose {
  return {
    wrist: { rotX: 0, rotY: 0, rotZ: 0, posX: 0, posY: 0, posZ: 0 },
    thumb: { cmc: 0.6, mcp: 0.8, dip: 0.6, splay: -0.2 },
    index: { mcp: 1.5, pip: 1.55, dip: 1.2, splay: 0 },
    middle: { mcp: 1.55, pip: 1.6, dip: 1.25, splay: 0 },
    ring: { mcp: 1.5, pip: 1.55, dip: 1.2, splay: 0 },
    pinky: { mcp: 1.45, pip: 1.5, dip: 1.15, splay: 0 },
  };
}

// =========================================================================
// 1. ISL HELLO (OPEN PALM OUTWARD GREETING WAVE)
// =========================================================================
export const HELLO_ANIMATION: GestureAnimationDefinition = {
  id: 'Hello',
  name: 'HELLO',
  hindiName: 'नमस्ते',
  description: 'Palm facing outward, gentle greeting wave from wrist.',
  durationMs: 1800,
  available3D: true,
  evaluatePose: (t: number) => {
    let phase: GesturePhase = 'START';
    let motionHint = 'Start: Palm upright, facing forward';
    const pose = createOpenHandPose();

    if (t < 0.22) {
      // Start phase: Hand stabilizes in upright forward greeting position
      phase = 'START';
      motionHint = 'Start: Open palm facing outward at head/chest height';
      pose.wrist.rotZ = 0.05;
      pose.wrist.rotX = -0.08;
    } else if (t < 0.78) {
      // Movement phase: Gentle rhythmic side-to-side greeting wave
      phase = 'MOVE';
      motionHint = 'Movement: Gentle side-to-side wave from wrist';
      const waveProgress = (t - 0.22) / 0.56;
      // 2 complete wave cycles
      const waveAngle = Math.sin(waveProgress * Math.PI * 4) * 0.35;
      pose.wrist.rotZ = waveAngle;
      pose.wrist.posX = waveAngle * 0.45;
      // Soft reactive finger flexing
      pose.index.splay = -0.06 + waveAngle * 0.08;
      pose.pinky.splay = 0.12 - waveAngle * 0.08;
    } else {
      // End phase: Settles cleanly into final stable posture
      phase = 'END';
      motionHint = 'End: Return to stable greeting pose';
      const returnProg = (t - 0.78) / 0.22;
      pose.wrist.rotZ = lerp(0.15, 0.0, returnProg);
      pose.wrist.rotX = -0.06;
    }

    return {
      rightHand: pose,
      phase,
      motionHint,
    };
  },
};

// =========================================================================
// 2. ISL HELP (2-HAND SUPPORTIVE LIFTING GESTURE)
// =========================================================================
export const HELP_ANIMATION: GestureAnimationDefinition = {
  id: 'Help',
  name: 'HELP',
  hindiName: 'मदद',
  description: 'Dominant fist supported on flat non-dominant base palm, lifted upward together.',
  durationMs: 2000,
  isTwoHanded: true,
  available3D: true,
  evaluatePose: (t: number) => {
    let phase: GesturePhase = 'START';
    let motionHint = 'Start: Right fist resting on horizontal left base palm';

    // Base left hand (flat platform, palm facing upward)
    const leftPose: HandPose = {
      wrist: {
        rotX: -1.50, // Palm tilted upward horizontally
        rotY: 0.1,
        rotZ: -0.15,
        posX: -0.1,
        posY: -0.5,
        posZ: 0.2,
      },
      thumb: { cmc: 0.2, mcp: 0.15, dip: 0.1, splay: 0.25 },
      index: { mcp: 0.06, pip: 0.04, dip: 0.02, splay: -0.05 },
      middle: { mcp: 0.04, pip: 0.02, dip: 0.02, splay: 0 },
      ring: { mcp: 0.05, pip: 0.03, dip: 0.02, splay: 0.05 },
      pinky: { mcp: 0.08, pip: 0.04, dip: 0.02, splay: 0.1 },
    };

    // Right hand (supportive fist with thumb upright)
    const rightPose: HandPose = {
      wrist: {
        rotX: 0.2,
        rotY: -0.2,
        rotZ: 0.05,
        posX: 0.05,
        posY: 0.25,
        posZ: 0.25,
      },
      thumb: { cmc: 0.1, mcp: 0.05, dip: 0.05, splay: 0.35 }, // Thumbs up
      index: { mcp: 1.5, pip: 1.55, dip: 1.2 },
      middle: { mcp: 1.55, pip: 1.6, dip: 1.25 },
      ring: { mcp: 1.5, pip: 1.55, dip: 1.2 },
      pinky: { mcp: 1.45, pip: 1.5, dip: 1.15 },
    };

    if (t < 0.25) {
      phase = 'START';
      motionHint = 'Start: Left palm flat base, right supportive fist on top';
    } else if (t < 0.75) {
      phase = 'MOVE';
      motionHint = 'Movement: Both hands lift upward together';
      const liftProgress = (t - 0.25) / 0.5;
      // Smooth upward lift arc
      const liftAmount = Math.sin(liftProgress * Math.PI) * 0.65;
      leftPose.wrist.posY! += liftAmount;
      rightPose.wrist.posY! += liftAmount;
    } else {
      phase = 'END';
      motionHint = 'End: Hold assisted upward position';
      const endHold = 0.25;
      leftPose.wrist.posY! += endHold;
      rightPose.wrist.posY! += endHold;
    }

    return {
      rightHand: rightPose,
      leftHand: leftPose,
      phase,
      motionHint,
    };
  },
};

// =========================================================================
// 3. ISL NEED (BENT INDEX HOOK DOWNWARD TAPPING MOTION)
// =========================================================================
export const NEED_ANIMATION: GestureAnimationDefinition = {
  id: 'Need',
  name: 'NEED',
  hindiName: 'ज़रूरत / चाहिए',
  description: 'Right hand with bent index hook, tapping downward firmly twice.',
  durationMs: 1800,
  available3D: true,
  evaluatePose: (t: number) => {
    let phase: GesturePhase = 'START';
    let motionHint = 'Start: Index bent into hook, palm tilted downward';

    const pose: HandPose = {
      wrist: {
        rotX: 0.45, // Palm tilted down
        rotY: -0.25,
        rotZ: 0.15,
        posX: 0,
        posY: 0,
        posZ: 0,
      },
      // Bent index hook
      index: { mcp: 0.95, pip: 1.45, dip: 0.85, splay: 0 },
      // Other fingers folded into supportive fist
      thumb: { cmc: 0.5, mcp: 0.6, dip: 0.4, splay: -0.1 },
      middle: { mcp: 1.4, pip: 1.5, dip: 1.2 },
      ring: { mcp: 1.45, pip: 1.5, dip: 1.2 },
      pinky: { mcp: 1.4, pip: 1.45, dip: 1.1 },
    };

    if (t < 0.2) {
      phase = 'START';
      motionHint = 'Start: Form bent index hook at chest level';
    } else if (t < 0.8) {
      phase = 'MOVE';
      motionHint = 'Movement: Firm downward tapping pulse (twice)';
      const tapProgress = (t - 0.2) / 0.6;
      // 2 downward tapping impulses
      const tapWave = Math.sin(tapProgress * Math.PI * 4);
      const downwardOffset = Math.max(0, tapWave) * -0.55;
      pose.wrist.posY = downwardOffset;
      pose.wrist.rotX = 0.45 + Math.max(0, tapWave) * 0.35;
      pose.index.pip = 1.45 + Math.max(0, tapWave) * 0.2;
    } else {
      phase = 'END';
      motionHint = 'End: Hold final downward hook';
      pose.wrist.rotX = 0.65;
      pose.wrist.posY = -0.2;
    }

    return {
      rightHand: pose,
      phase,
      motionHint,
    };
  },
};

// =========================================================================
// 4. ISL THANK YOU (CHIN TO FORWARD SWEEP)
// =========================================================================
export const THANK_YOU_ANIMATION: GestureAnimationDefinition = {
  id: 'Thank you',
  name: 'THANK YOU',
  hindiName: 'धन्यवाद',
  description: 'Flat open hand starting at chin and sweeping gracefully forward toward the partner.',
  durationMs: 1900,
  available3D: true,
  evaluatePose: (t: number) => {
    let phase: GesturePhase = 'START';
    let motionHint = 'Start: Flat hand touching near chin level';

    const pose = createOpenHandPose();

    if (t < 0.22) {
      phase = 'START';
      motionHint = 'Start: Flat hand resting with fingertips near chin';
      pose.wrist.rotX = 0.38;
      pose.wrist.rotY = -0.15;
      pose.wrist.posY = 0.55;
      pose.wrist.posZ = 0.45;
    } else if (t < 0.78) {
      phase = 'MOVE';
      motionHint = 'Movement: Sweep forward and outward toward partner';
      const sweepProgress = (t - 0.22) / 0.56;
      // Arc forward and downward
      pose.wrist.posY = lerp(0.55, -0.15, sweepProgress);
      pose.wrist.posZ = lerp(0.45, -0.65, sweepProgress);
      pose.wrist.rotX = lerp(0.38, -0.15, sweepProgress);
      // Soft gentle open palm expansion
      pose.index.splay = lerp(-0.06, -0.1, sweepProgress);
      pose.pinky.splay = lerp(0.12, 0.18, sweepProgress);
    } else {
      phase = 'END';
      motionHint = 'End: Open palm extended in gratitude';
      pose.wrist.posY = -0.15;
      pose.wrist.posZ = -0.65;
      pose.wrist.rotX = -0.15;
    }

    return {
      rightHand: pose,
      phase,
      motionHint,
    };
  },
};

// Master registry of signs with available 3D animations
export const GESTURE_3D_REGISTRY: Record<string, GestureAnimationDefinition> = {
  Hello: HELLO_ANIMATION,
  Help: HELP_ANIMATION,
  Need: NEED_ANIMATION,
  'Thank you': THANK_YOU_ANIMATION,
};

export function getGesture3D(signId: string): GestureAnimationDefinition | null {
  const normalizedKey = Object.keys(GESTURE_3D_REGISTRY).find(
    (k) => k.toLowerCase() === signId.toLowerCase()
  );
  return normalizedKey ? GESTURE_3D_REGISTRY[normalizedKey] : null;
}

export function has3D(signId: string): boolean {
  return getGesture3D(signId) !== null;
}
