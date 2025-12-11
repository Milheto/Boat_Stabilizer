import * as THREE from 'three';

/**
 * Boat geometry configuration
 * Based on parametric boat from: https://discourse.threejs.org/t/parametric-boat-with-dynamic-water-masking/88150
 */
export const BOAT_CONFIG = {
  length: 2.4,
  width: 1.0,
  depth: 0.15,
  bowSharpness: 2.8,
  bowTaper: 0.98,
  bowStart: 0.2,
  sternSharpness: 4.0,
  sternTaper: 0.45,
  hullCurve: 8,
  segmentsX: 100,
  segmentsY: 50,
  hullThickness: 0.025
};

/**
 * Creates a parametric boat hull geometry with curved bottom, tapered bow and stern
 */
export function createBoatHullGeometry(config: typeof BOAT_CONFIG): THREE.BufferGeometry {
  const {
    length, width, depth, bowSharpness, bowTaper, bowStart,
    sternSharpness, sternTaper, hullCurve, segmentsX, segmentsY, hullThickness
  } = config;

  // First create the outer surface
  const outerGeometry = new THREE.PlaneGeometry(length, width, segmentsX, segmentsY);
  const outerPos = outerGeometry.getAttribute('position') as THREE.BufferAttribute;

  // Store outer vertices with normals
  const outerVertices: THREE.Vector3[] = [];
  const outerNormals: THREE.Vector3[] = [];

  for (let i = 0; i < outerPos.count; i++) {
    let x = outerPos.getX(i);
    let y = outerPos.getY(i);
    const normX = x / (length / 2);
    const longTaper = Math.cos(normX * Math.PI / 2);
    let z = -depth * Math.exp(-hullCurve * y * y) * longTaper;
    
    const dX = 15 * Math.min(Math.abs(x - length / 2), Math.abs(x + length / 2));
    const clampedDX = Math.min(dX, Math.PI);
    const dY = 15 * Math.min(Math.abs(y - width / 2), Math.abs(y + width / 2));
    const clampedDY = Math.min(dY, Math.PI);
    z += 0.06 * Math.max((Math.cos(clampedDX) + 1), (Math.cos(clampedDY) + 1));

    if (normX > bowStart) {
      const adjustedNormX = (normX - bowStart) / (1 - bowStart);
      const bowTaperVal = 1 - Math.pow(adjustedNormX, bowSharpness) * bowTaper;
      y = y * bowTaperVal;
    }

    if (normX < 0) {
      const sternFactor = Math.abs(normX);
      const sternTaperVal = 1 - Math.pow(sternFactor, sternSharpness) * sternTaper;
      y = y * sternTaperVal;
    }

    outerPos.setX(i, x);
    outerPos.setY(i, y);
    outerPos.setZ(i, z);
    outerVertices.push(new THREE.Vector3(x, y, z));
  }

  outerGeometry.computeVertexNormals();
  const normalAttr = outerGeometry.getAttribute('normal') as THREE.BufferAttribute;

  for (let i = 0; i < normalAttr.count; i++) {
    outerNormals.push(new THREE.Vector3(
      normalAttr.getX(i),
      normalAttr.getY(i),
      normalAttr.getZ(i)
    ));
  }

  // Create inner surface by offsetting along normals
  const innerVertices: THREE.Vector3[] = [];
  for (let i = 0; i < outerVertices.length; i++) {
    const offsetVertex = outerVertices[i].clone().addScaledVector(outerNormals[i], hullThickness);
    innerVertices.push(offsetVertex);
  }

  // Build the complete geometry with outer, inner, and edge faces
  const vertices: number[] = [];
  const indices: number[] = [];

  // Add outer surface
  for (let i = 0; i < outerVertices.length; i++) {
    vertices.push(outerVertices[i].x, outerVertices[i].y, outerVertices[i].z);
  }

  // Add inner surface
  for (let i = 0; i < innerVertices.length; i++) {
    vertices.push(innerVertices[i].x, innerVertices[i].y, innerVertices[i].z);
  }

  const cols = segmentsX + 1;
  const rows = segmentsY + 1;

  // Outer surface indices
  for (let row = 0; row < segmentsY; row++) {
    for (let col = 0; col < segmentsX; col++) {
      const a = row * cols + col;
      const b = row * cols + col + 1;
      const c = (row + 1) * cols + col + 1;
      const d = (row + 1) * cols + col;
      indices.push(a, b, c);
      indices.push(a, c, d);
    }
  }

  const innerOffset = outerVertices.length;

  // Inner surface indices (reversed winding)
  for (let row = 0; row < segmentsY; row++) {
    for (let col = 0; col < segmentsX; col++) {
      const a = innerOffset + row * cols + col;
      const b = innerOffset + row * cols + col + 1;
      const c = innerOffset + (row + 1) * cols + col + 1;
      const d = innerOffset + (row + 1) * cols + col;
      indices.push(a, c, b);
      indices.push(a, d, c);
    }
  }

  // Edge strips connecting outer and inner surfaces
  // Top edge
  for (let col = 0; col < segmentsX; col++) {
    const a = col;
    const b = col + 1;
    const c = innerOffset + col + 1;
    const d = innerOffset + col;
    indices.push(a, b, c);
    indices.push(a, c, d);
  }

  // Bottom edge
  for (let col = 0; col < segmentsX; col++) {
    const a = segmentsY * cols + col;
    const b = segmentsY * cols + col + 1;
    const c = innerOffset + segmentsY * cols + col + 1;
    const d = innerOffset + segmentsY * cols + col;
    indices.push(a, c, b);
    indices.push(a, d, c);
  }

  // Left edge
  for (let row = 0; row < segmentsY; row++) {
    const a = row * cols;
    const b = (row + 1) * cols;
    const c = innerOffset + (row + 1) * cols;
    const d = innerOffset + row * cols;
    indices.push(a, c, b);
    indices.push(a, d, c);
  }

  // Right edge
  for (let row = 0; row < segmentsY; row++) {
    const a = row * cols + segmentsX;
    const b = (row + 1) * cols + segmentsX;
    const c = innerOffset + (row + 1) * cols + segmentsX;
    const d = innerOffset + row * cols + segmentsX;
    indices.push(a, b, c);
    indices.push(a, c, d);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates a trapezoid bench geometry
 */
export function createTrapezoidBench(frontWidth: number, backWidth: number, depth: number, thickness: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  const halfFront = frontWidth / 2;
  const halfBack = backWidth / 2;
  const halfDepth = depth / 2;
  const halfThick = thickness / 2;

  // 8 vertices for trapezoid box
  const vertices = new Float32Array([
    // Top face
    -halfDepth, -halfFront, halfThick,   // front edge
    -halfDepth, halfFront, halfThick,
    halfDepth, -halfBack, halfThick,     // back edge
    halfDepth, halfBack, halfThick,
    // Bottom face
    -halfDepth, -halfFront, -halfThick,
    -halfDepth, halfFront, -halfThick,
    halfDepth, -halfBack, -halfThick,
    halfDepth, halfBack, -halfThick,
  ]);

  const indices = [
    0, 2, 1, 1, 2, 3, // top
    4, 5, 6, 5, 7, 6, // bottom
    0, 1, 5, 0, 5, 4, // front end
    2, 6, 7, 2, 7, 3, // back end
    0, 4, 6, 0, 6, 2, // left edge
    1, 3, 7, 1, 7, 5  // right edge
  ];

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

