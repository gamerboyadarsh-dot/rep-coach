export interface Point {
  x: number;
  y: number;
  z?: number;
}

/**
 * Calculate the angle at point B formed by points A-B-C (in 2D)
 * Returns angle in degrees (0-180)
 */
export function angleBetween(a: Point, b: Point, c: Point): number {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };

  const dot = ba.x * bc.x + ba.y * bc.y;
  const magA = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
  const magB = Math.sqrt(bc.x * bc.x + bc.y * bc.y);

  if (magA === 0 || magB === 0) return 0;

  const cosAngle = Math.max(-1, Math.min(1, dot / (magA * magB)));
  const angleRad = Math.acos(cosAngle);
  return (angleRad * 180) / Math.PI;
}

/**
 * Get landmark as Point (normalized 0-1 coordinates)
 */
export function getPoint(landmark: { x: number; y: number; z?: number }): Point {
  return { x: landmark.x, y: landmark.y, z: landmark.z };
}

/**
 * Calculate horizontal distance between two points
 */
export function horizontalDistance(a: Point, b: Point): number {
  return Math.abs(b.x - a.x);
}
