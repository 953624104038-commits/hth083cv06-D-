import * as THREE from 'three';
import type { HandPose, FingerJoints, ThumbJoints } from './types';

export interface FingerRig {
  mcpGroup: THREE.Group;
  pipGroup: THREE.Group;
  dipGroup: THREE.Group;
}

export interface ThumbRig {
  cmcGroup: THREE.Group;
  mcpGroup: THREE.Group;
  dipGroup: THREE.Group;
}

export interface HandRig {
  rootGroup: THREE.Group;
  wristGroup: THREE.Group;
  thumb: ThumbRig;
  index: FingerRig;
  middle: FingerRig;
  ring: FingerRig;
  pinky: FingerRig;
  isLeft: boolean;
}

// Create an anatomical phalanx bone segment with rounded capsule/cylinder
function createPhalanx(
  length: number,
  radiusTop: number,
  radiusBottom: number,
  material: THREE.Material,
  nailMaterial?: THREE.Material
): { group: THREE.Group; tipOffset: number } {
  const group = new THREE.Group();

  // Joint sphere at base
  const jointGeo = new THREE.SphereGeometry(radiusBottom * 1.08, 16, 12);
  const jointMesh = new THREE.Mesh(jointGeo, material);
  jointMesh.castShadow = true;
  group.add(jointMesh);

  // Bone segment
  const cylGeo = new THREE.CylinderGeometry(radiusTop, radiusBottom, length, 16);
  // Center cylinder along positive Y
  cylGeo.translate(0, length / 2, 0);
  const cylMesh = new THREE.Mesh(cylGeo, material);
  cylMesh.castShadow = true;
  cylMesh.receiveShadow = true;
  group.add(cylMesh);

  // Optional fingertip nail plate
  if (nailMaterial) {
    const nailGeo = new THREE.BoxGeometry(radiusTop * 1.1, length * 0.38, radiusTop * 0.35);
    nailGeo.translate(0, length * 0.72, radiusTop * 0.85);
    const nailMesh = new THREE.Mesh(nailGeo, nailMaterial);
    group.add(nailMesh);
  }

  return { group, tipOffset: length };
}

// Build 3-segment finger (MCP -> PIP -> DIP)
function buildFinger(
  lengths: [number, number, number],
  radii: [number, number, number, number],
  skinMat: THREE.Material,
  nailMat: THREE.Material
): FingerRig {
  const mcpGroup = new THREE.Group();
  const pipGroup = new THREE.Group();
  const dipGroup = new THREE.Group();

  // Proximal phalanx
  const p1 = createPhalanx(lengths[0], radii[1], radii[0], skinMat);
  mcpGroup.add(p1.group);

  // Middle phalanx positioned at tip of proximal
  pipGroup.position.y = lengths[0];
  const p2 = createPhalanx(lengths[1], radii[2], radii[1], skinMat);
  pipGroup.add(p2.group);
  mcpGroup.add(pipGroup);

  // Distal phalanx positioned at tip of middle (has nail)
  dipGroup.position.y = lengths[1];
  const p3 = createPhalanx(lengths[2], radii[3], radii[2], skinMat, nailMat);
  dipGroup.add(p3.group);
  pipGroup.add(dipGroup);

  return { mcpGroup, pipGroup, dipGroup };
}

// Build 3-segment thumb (CMC -> MCP -> DIP)
function buildThumb(
  lengths: [number, number, number],
  radii: [number, number, number, number],
  skinMat: THREE.Material,
  nailMat: THREE.Material
): ThumbRig {
  const cmcGroup = new THREE.Group();
  const mcpGroup = new THREE.Group();
  const dipGroup = new THREE.Group();

  // Metacarpal segment
  const p1 = createPhalanx(lengths[0], radii[1], radii[0], skinMat);
  cmcGroup.add(p1.group);

  // Proximal
  mcpGroup.position.y = lengths[0];
  const p2 = createPhalanx(lengths[1], radii[2], radii[1], skinMat);
  mcpGroup.add(p2.group);
  cmcGroup.add(mcpGroup);

  // Distal with nail
  dipGroup.position.y = lengths[1];
  const p3 = createPhalanx(lengths[2], radii[3], radii[2], skinMat, nailMat);
  dipGroup.add(p3.group);
  mcpGroup.add(dipGroup);

  return { cmcGroup, mcpGroup, dipGroup };
}

export function createHandModel(isLeft: boolean = false): HandRig {
  const rootGroup = new THREE.Group();
  const wristGroup = new THREE.Group();
  rootGroup.add(wristGroup);

  // Realistic warm human skin tones
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xd9a066,
    roughness: 0.65,
    metalness: 0.04,
  });

  const palmMat = new THREE.MeshStandardMaterial({
    color: 0xdeb07c,
    roughness: 0.70,
    metalness: 0.02,
  });

  const nailMat = new THREE.MeshStandardMaterial({
    color: 0xf0d5c0,
    roughness: 0.35,
    metalness: 0.08,
  });

  // 1. Forearm & Wrist base
  const armGeo = new THREE.CylinderGeometry(0.58, 0.66, 1.4, 20);
  armGeo.translate(0, -0.7, 0);
  const armMesh = new THREE.Mesh(armGeo, skinMat);
  armMesh.castShadow = true;
  wristGroup.add(armMesh);

  // Wrist Joint Sphere
  const wristJointGeo = new THREE.SphereGeometry(0.62, 18, 14);
  const wristJointMesh = new THREE.Mesh(wristJointGeo, skinMat);
  wristGroup.add(wristJointMesh);

  // 2. Palm body (metacarpus)
  const palmGeo = new THREE.BoxGeometry(1.65, 1.75, 0.52);
  palmGeo.translate(0, 0.88, 0);
  const palmMesh = new THREE.Mesh(palmGeo, palmMat);
  palmMesh.castShadow = true;
  palmMesh.receiveShadow = true;
  wristGroup.add(palmMesh);

  // Thenar eminence (thumb palm muscle curve)
  const thenarGeo = new THREE.SphereGeometry(0.48, 16, 14);
  thenarGeo.scale(1.1, 1.4, 0.75);
  const thenarMesh = new THREE.Mesh(thenarGeo, skinMat);
  thenarMesh.position.set(isLeft ? 0.62 : -0.62, 0.52, 0.12);
  wristGroup.add(thenarMesh);

  // Knuckle ridge
  const knuckleGeo = new THREE.CylinderGeometry(0.24, 0.24, 1.6, 16);
  knuckleGeo.rotateZ(Math.PI / 2);
  knuckleGeo.translate(0, 1.76, 0.02);
  const knuckleMesh = new THREE.Mesh(knuckleGeo, skinMat);
  wristGroup.add(knuckleMesh);

  // 3. Fingers (positioned along radial arch at top of palm)
  // [proximal, middle, distal lengths]
  const palmTopY = 1.78;
  const sideSign = isLeft ? -1 : 1;

  // Index
  const index = buildFinger([0.88, 0.58, 0.44], [0.20, 0.18, 0.16, 0.14], skinMat, nailMat);
  index.mcpGroup.position.set(-0.52 * sideSign, palmTopY - 0.02, 0);
  wristGroup.add(index.mcpGroup);

  // Middle (tallest)
  const middle = buildFinger([0.98, 0.66, 0.48], [0.21, 0.19, 0.17, 0.15], skinMat, nailMat);
  middle.mcpGroup.position.set(-0.16 * sideSign, palmTopY + 0.06, 0);
  wristGroup.add(middle.mcpGroup);

  // Ring
  const ring = buildFinger([0.90, 0.60, 0.44], [0.20, 0.18, 0.16, 0.14], skinMat, nailMat);
  ring.mcpGroup.position.set(0.20 * sideSign, palmTopY, 0);
  wristGroup.add(ring.mcpGroup);

  // Pinky
  const pinky = buildFinger([0.72, 0.46, 0.38], [0.18, 0.16, 0.14, 0.12], skinMat, nailMat);
  pinky.mcpGroup.position.set(0.54 * sideSign, palmTopY - 0.10, 0);
  wristGroup.add(pinky.mcpGroup);

  // 4. Thumb (originates from lower-lateral palm)
  const thumb = buildThumb([0.68, 0.64, 0.50], [0.24, 0.22, 0.20, 0.17], skinMat, nailMat);
  thumb.cmcGroup.position.set(isLeft ? 0.72 : -0.72, 0.58, 0.15);
  // Natural rest orientation: thumb angled out laterally and tilted forward
  thumb.cmcGroup.rotation.z = isLeft ? -0.58 : 0.58;
  thumb.cmcGroup.rotation.y = isLeft ? 0.42 : -0.42;
  thumb.cmcGroup.rotation.x = 0.28;
  wristGroup.add(thumb.cmcGroup);

  // Mirror Left Hand correctly if requested
  if (isLeft) {
    rootGroup.scale.set(-1, 1, 1);
  }

  return {
    rootGroup,
    wristGroup,
    thumb,
    index,
    middle,
    ring,
    pinky,
    isLeft,
  };
}

export function applyFingerJoints(rig: FingerRig, joints: FingerJoints) {
  rig.mcpGroup.rotation.x = joints.mcp;
  rig.mcpGroup.rotation.z = joints.splay || 0;
  rig.pipGroup.rotation.x = joints.pip;
  rig.dipGroup.rotation.x = joints.dip;
}

export function applyThumbJoints(rig: ThumbRig, joints: ThumbJoints) {
  rig.cmcGroup.rotation.x = 0.25 + (joints.cmc || 0);
  rig.cmcGroup.rotation.z = (rig.cmcGroup.parent?.parent?.scale.x === -1 ? -0.58 : 0.58) + (joints.splay || 0);
  rig.mcpGroup.rotation.x = joints.mcp;
  rig.dipGroup.rotation.x = joints.dip;
}

export function applyHandPose(rig: HandRig, pose: HandPose) {
  // Wrist rotation & position
  rig.wristGroup.rotation.x = pose.wrist.rotX;
  rig.wristGroup.rotation.y = pose.wrist.rotY;
  rig.wristGroup.rotation.z = pose.wrist.rotZ;

  rig.wristGroup.position.x = pose.wrist.posX || 0;
  rig.wristGroup.position.y = (pose.wrist.posY || 0) - 0.5;
  rig.wristGroup.position.z = pose.wrist.posZ || 0;

  // Fingers
  applyFingerJoints(rig.index, pose.index);
  applyFingerJoints(rig.middle, pose.middle);
  applyFingerJoints(rig.ring, pose.ring);
  applyFingerJoints(rig.pinky, pose.pinky);
  applyThumbJoints(rig.thumb, pose.thumb);
}

export function disposeHandModel(rig: HandRig) {
  rig.rootGroup.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else if (obj.material) {
        obj.material.dispose();
      }
    }
  });
}
