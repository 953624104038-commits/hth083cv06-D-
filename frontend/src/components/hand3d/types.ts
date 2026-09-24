export type FingerJoints = {
  mcp: number; // Metacarpophalangeal curl (radians, 0 = straight, positive = curl inward)
  pip: number; // Proximal interphalangeal curl
  dip: number; // Distal interphalangeal curl
  splay?: number; // Lateral spread (yaw)
};

export type ThumbJoints = {
  cmc: number; // Carpometacarpal opposition/abduction
  mcp: number; // MCP curl
  dip: number; // IP/DIP curl
  splay?: number; // Lateral swing
};

export interface HandPose {
  wrist: {
    rotX: number; // Pitch (forward/back)
    rotY: number; // Yaw (turn left/right)
    rotZ: number; // Roll (tilt sideways)
    posX?: number;
    posY?: number;
    posZ?: number;
  };
  thumb: ThumbJoints;
  index: FingerJoints;
  middle: FingerJoints;
  ring: FingerJoints;
  pinky: FingerJoints;
}

export type GesturePhase = 'START' | 'MOVE' | 'END';

export interface GestureAnimationDefinition {
  id: string;
  name: string;
  hindiName: string;
  description: string;
  durationMs: number;
  isTwoHanded?: boolean;
  available3D: boolean;
  // Dynamic pose evaluator: given progress t in [0, 1], returns poses
  evaluatePose: (t: number) => {
    rightHand: HandPose;
    leftHand?: HandPose;
    phase: GesturePhase;
    motionHint: string;
  };
}
