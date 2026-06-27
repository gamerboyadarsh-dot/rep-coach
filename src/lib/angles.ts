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
 * Calculate the angle of the line segment A-B relative to the vertical axis (0, 1).
 * Returns angle in degrees (0-90).
 * 0 = vertical (A and B have same X).
 * 90 = horizontal (A and B have same Y).
 */
export function angleToVertical(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) return 0;
  
  // Dot product with vertical vector (0, 1)
  const dot = Math.abs(dy); // Use absolute to handle both up and down directions
  const cosAngle = Math.max(-1, Math.min(1, dot / mag));
  const angleRad = Math.acos(cosAngle);
  return (angleRad * 180) / Math.PI;
}

/**
 * Get landmark as Point (normalized 0-1 coordinates scaled to actual pixels to fix aspect ratio distortion)
 */
export function getPoint(landmark: { x: number; y: number; z?: number }, width: number = 1, height: number = 1): Point {
  return { 
    x: landmark.x * width, 
    y: landmark.y * height, 
    z: landmark.z 
  };
}
