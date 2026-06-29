import { angleBetween, angleToVertical, getPoint } from './angles';

export type ExerciseType = 'squat' | 'pushup' | 'jumping_jack' | 'plank';

export type RepState = 'standing' | 'descending' | 'bottom' | 'ascending' | 'out' | 'in' | 'planking' | 'resting';
export type PushupState = 'up' | 'descending' | 'bottom' | 'ascending';

export interface RepResult {
  repNumber: number;
  exercise: ExerciseType;
  goodForm: boolean;
  errors: string[];
  bottomAngle?: number;
  streak: number;
}

// Landmark indices from MediaPipe Pose
export const LANDMARKS = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

export type Landmark = { x: number; y: number; visibility?: number };

// Minimum visibility confidence to trust a landmark
const MIN_VISIBILITY = 0.5;

// EMA smoothing factor (higher = more reactive, lower = smoother)
const EMA_ALPHA = 0.35;

class ExerciseLogic {
  private repCount = 0;
  private currentState: RepState = 'standing';
  private currentPushupState: PushupState = 'up';
  private currentErrors: string[] = [];
  private bottomAngleReached = 0;
  private lastBottomAngle = 0;
  private currentStreak = 0;
  private repResults: RepResult[] = [];

  // Plank specifics
  private plankAccumulatedMs = 0;
  private lastPlankTime = 0;

  // EMA state for angle smoothing
  private smoothedSquatAngle: number | null = null;
  private smoothedLeftElbowAngle: number | null = null;
  private smoothedRightElbowAngle: number | null = null;
  private smoothedHipAngle: number | null = null;

  reset() {
    this.repCount = 0;
    this.currentState = 'standing';
    this.currentPushupState = 'up';
    this.currentErrors = [];
    this.bottomAngleReached = 0;
    this.lastBottomAngle = 0;
    this.repResults = [];
    this.currentStreak = 0;
    this.plankAccumulatedMs = 0;
    this.lastPlankTime = 0;
    this.smoothedSquatAngle = null;
    this.smoothedLeftElbowAngle = null;
    this.smoothedRightElbowAngle = null;
    this.smoothedHipAngle = null;
  }

  getResults(): RepResult[] {
    return [...this.repResults];
  }

  private smooth(prev: number | null, next: number): number {
    if (prev === null) return next;
    return prev * (1 - EMA_ALPHA) + next * EMA_ALPHA;
  }

  private addRepResult(exercise: ExerciseType, goodForm: boolean, errors: string[], bottomAngle?: number) {
    this.repCount++;
    if (goodForm) {
      this.currentStreak++;
    } else {
      this.currentStreak = 0;
    }
    const result: RepResult = {
      repNumber: this.repCount,
      exercise,
      goodForm,
      errors,
      bottomAngle,
      streak: this.currentStreak,
    };
    this.repResults.push(result);
    return result;
  }

  // ==================== SQUAT LOGIC ====================
  // Uses femur vertical angle: 0° = standing, 90° = deep squat (femur horizontal)
  processSquatFrame(landmarks: Landmark[]): { state: RepState; errors: string[]; currentRep?: RepResult } {
    const leftHip = landmarks[LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[LANDMARKS.RIGHT_HIP];
    const leftKnee = landmarks[LANDMARKS.LEFT_KNEE];
    const rightKnee = landmarks[LANDMARKS.RIGHT_KNEE];
    const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];

    // Check core landmark visibility — skip frame if hips/knees not confidently tracked
    const leftConfident = (leftHip?.visibility ?? 1) > MIN_VISIBILITY && (leftKnee?.visibility ?? 1) > MIN_VISIBILITY;
    const rightConfident = (rightHip?.visibility ?? 1) > MIN_VISIBILITY && (rightKnee?.visibility ?? 1) > MIN_VISIBILITY;
    if (!leftConfident && !rightConfident) {
      return { state: this.currentState, errors: [] };
    }

    // Use whichever side has better visibility, or average both
    let rawAngle: number;
    if (leftConfident && rightConfident) {
      const leftAngle = angleToVertical(getPoint(leftHip), getPoint(leftKnee));
      const rightAngle = angleToVertical(getPoint(rightHip), getPoint(rightKnee));
      rawAngle = (leftAngle + rightAngle) / 2;
    } else if (leftConfident) {
      rawAngle = angleToVertical(getPoint(leftHip), getPoint(leftKnee));
    } else {
      rawAngle = angleToVertical(getPoint(rightHip), getPoint(rightKnee));
    }

    // Apply EMA smoothing
    this.smoothedSquatAngle = this.smooth(this.smoothedSquatAngle, rawAngle);
    const angle = this.smoothedSquatAngle;

    // Thresholds (degrees from vertical)
    const STANDING_THRESHOLD = 30;
    const DEPTH_THRESHOLD = 60;  // femur ≥60° from vertical = deep enough
    const MIN_DEPTH_THRESHOLD = 50; // minimum to not be "shallow"

    const errors: string[] = [];

    switch (this.currentState) {
      case 'standing':
        if (angle > STANDING_THRESHOLD + 8) {
          this.currentState = 'descending';
          this.bottomAngleReached = 0;
        }
        break;

      case 'descending':
        if (angle > this.bottomAngleReached) {
          this.bottomAngleReached = angle;
          this.lastBottomAngle = angle;
        }
        if (angle > DEPTH_THRESHOLD) {
          this.currentState = 'bottom';

          // Check knee valgus if ankles are visible
          const leftAnkleVis = (leftAnkle?.visibility ?? 0) > MIN_VISIBILITY;
          const rightAnkleVis = (rightAnkle?.visibility ?? 0) > MIN_VISIBILITY;
          if (leftAnkleVis && rightAnkleVis) {
            const ankleSpread = Math.abs(rightAnkle.x - leftAnkle.x);
            const kneeSpread = Math.abs((rightKnee?.x ?? 0) - (leftKnee?.x ?? 0));
            if (ankleSpread > 0.05 && kneeSpread < ankleSpread * 0.8) {
              errors.push('knees_caving_in');
            }
          }
        }
        break;

      case 'bottom':
        if (angle > this.bottomAngleReached) {
          this.bottomAngleReached = angle;
          this.lastBottomAngle = angle;
        }
        if (angle < DEPTH_THRESHOLD - 12) {
          this.currentState = 'ascending';
        }
        break;

      case 'ascending':
        if (angle < STANDING_THRESHOLD) {
          if (this.bottomAngleReached < MIN_DEPTH_THRESHOLD) {
            errors.push('shallow_squat');
          }
          const goodForm = errors.length === 0;
          const repResult = this.addRepResult('squat', goodForm, errors, this.lastBottomAngle);
          this.currentErrors = errors;
          this.currentState = 'standing';
          return { state: 'standing', errors, currentRep: repResult };
        }
        break;
    }

    return { state: this.currentState, errors: [...errors] };
  }

  // ==================== PUSH-UP LOGIC ====================
  // Bilateral: auto-picks the side with better visibility, or averages both
  processPushupFrame(landmarks: Landmark[]): { state: PushupState; errors: string[]; currentRep?: RepResult } {
    const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
    const leftElbow = landmarks[LANDMARKS.LEFT_ELBOW];
    const rightElbow = landmarks[LANDMARKS.RIGHT_ELBOW];
    const leftWrist = landmarks[LANDMARKS.LEFT_WRIST];
    const rightWrist = landmarks[LANDMARKS.RIGHT_WRIST];

    const leftChainVis =
      Math.min(leftShoulder?.visibility ?? 0, leftElbow?.visibility ?? 0, leftWrist?.visibility ?? 0);
    const rightChainVis =
      Math.min(rightShoulder?.visibility ?? 0, rightElbow?.visibility ?? 0, rightWrist?.visibility ?? 0);

    const useLeft = leftChainVis > MIN_VISIBILITY;
    const useRight = rightChainVis > MIN_VISIBILITY;

    if (!useLeft && !useRight) {
      return { state: this.currentPushupState, errors: [] };
    }

    let rawElbowAngle: number;
    if (useLeft && useRight) {
      const leftAngle = angleBetween(getPoint(leftShoulder), getPoint(leftElbow), getPoint(leftWrist));
      const rightAngle = angleBetween(getPoint(rightShoulder), getPoint(rightElbow), getPoint(rightWrist));
      // Weight by visibility
      const totalVis = leftChainVis + rightChainVis;
      rawElbowAngle = (leftAngle * leftChainVis + rightAngle * rightChainVis) / totalVis;
    } else if (useLeft) {
      rawElbowAngle = angleBetween(getPoint(leftShoulder), getPoint(leftElbow), getPoint(leftWrist));
    } else {
      rawElbowAngle = angleBetween(getPoint(rightShoulder), getPoint(rightElbow), getPoint(rightWrist));
    }

    // Apply EMA smoothing
    if (useLeft) {
      this.smoothedLeftElbowAngle = this.smooth(this.smoothedLeftElbowAngle, rawElbowAngle);
    }
    if (useRight) {
      this.smoothedRightElbowAngle = this.smooth(this.smoothedRightElbowAngle, rawElbowAngle);
    }
    const elbowAngle = useLeft && useRight
      ? (this.smoothedLeftElbowAngle! + this.smoothedRightElbowAngle!) / 2
      : (useLeft ? this.smoothedLeftElbowAngle! : this.smoothedRightElbowAngle!);

    // Thresholds
    const EXTENDED_ANGLE = 150; // arms extended = top of pushup
    const BENT_ANGLE = 100;     // arms bent = bottom of pushup

    const errors: string[] = [];

    switch (this.currentPushupState) {
      case 'up':
        if (elbowAngle < EXTENDED_ANGLE - 8) {
          this.currentPushupState = 'descending';
          this.bottomAngleReached = 999;
        }
        break;

      case 'descending':
        if (elbowAngle < this.bottomAngleReached) {
          this.bottomAngleReached = elbowAngle;
          this.lastBottomAngle = elbowAngle;
        }
        if (elbowAngle < BENT_ANGLE) {
          this.currentPushupState = 'bottom';
        }
        break;

      case 'bottom':
        if (elbowAngle < this.bottomAngleReached) {
          this.bottomAngleReached = elbowAngle;
          this.lastBottomAngle = elbowAngle;
        }
        if (elbowAngle > BENT_ANGLE + 12) {
          this.currentPushupState = 'ascending';
        }
        break;

      case 'ascending':
        if (elbowAngle > EXTENDED_ANGLE) {
          if (this.bottomAngleReached > BENT_ANGLE + 20) {
            errors.push('partial_rep');
          }
          const goodForm = errors.length === 0;
          const repResult = this.addRepResult('pushup', goodForm, errors, this.lastBottomAngle);
          this.currentErrors = errors;
          this.currentPushupState = 'up';
          return { state: 'up', errors, currentRep: repResult };
        }
        break;
    }

    return { state: this.currentPushupState, errors: [...errors] };
  }

  // ==================== JUMPING JACK LOGIC ====================
  processJumpingJackFrame(landmarks: Landmark[]): { state: RepState; errors: string[]; currentRep?: RepResult } {
    const leftWrist = landmarks[LANDMARKS.LEFT_WRIST];
    const rightWrist = landmarks[LANDMARKS.RIGHT_WRIST];
    const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
    const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];
    const leftHip = landmarks[LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[LANDMARKS.RIGHT_HIP];

    // Check visibility
    const shoulderVis = Math.min(leftShoulder?.visibility ?? 1, rightShoulder?.visibility ?? 1) > MIN_VISIBILITY;
    const wristVis = Math.min(leftWrist?.visibility ?? 0, rightWrist?.visibility ?? 0) > MIN_VISIBILITY;
    const ankleVis = Math.min(leftAnkle?.visibility ?? 0, rightAnkle?.visibility ?? 0) > MIN_VISIBILITY;

    if (!shoulderVis) {
      return { state: this.currentState, errors: [] };
    }

    // Arms up: wrists above shoulders (with tolerance)
    const armsUp = wristVis
      ? leftWrist.y < leftShoulder.y + 0.05 && rightWrist.y < rightShoulder.y + 0.05
      : false;

    // Legs out: ankle spread relative to hip width
    let legsOut = false;
    if (ankleVis) {
      const ankleSpread = Math.abs(rightAnkle.x - leftAnkle.x);
      const hipSpread = Math.abs((rightHip?.x ?? 0.5) - (leftHip?.x ?? 0.5));
      legsOut = hipSpread > 0.01 ? ankleSpread / hipSpread > 1.3 : ankleSpread > 0.25;
    }

    const errors: string[] = [];

    switch (this.currentState) {
      case 'standing':
      case 'in':
        if (armsUp && legsOut) {
          this.currentState = 'out';
        }
        break;

      case 'out':
        if (!armsUp && !legsOut) {
          const goodForm = errors.length === 0;
          const repResult = this.addRepResult('jumping_jack', goodForm, errors);
          this.currentState = 'in';
          return { state: 'in', errors, currentRep: repResult };
        }
        break;
    }

    return { state: this.currentState, errors: [...errors] };
  }

  // ==================== PLANK LOGIC ====================
  processPlankFrame(landmarks: Landmark[]): { state: RepState; errors: string[]; currentRep?: RepResult } {
    const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
    const leftHip = landmarks[LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[LANDMARKS.RIGHT_HIP];
    const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];

    const leftVis = Math.min(leftShoulder?.visibility ?? 0, leftHip?.visibility ?? 0, leftAnkle?.visibility ?? 0);
    const rightVis = Math.min(rightShoulder?.visibility ?? 0, rightHip?.visibility ?? 0, rightAnkle?.visibility ?? 0);

    const useLeft = leftVis > MIN_VISIBILITY;
    const useRight = rightVis > MIN_VISIBILITY;

    const now = Date.now();
    if (!this.lastPlankTime) this.lastPlankTime = now;
    const deltaMs = now - this.lastPlankTime;
    this.lastPlankTime = now;

    if (!useLeft && !useRight) {
      this.currentState = 'resting';
      return { state: 'resting', errors: [] };
    }

    let rawHipAngle: number;
    if (useLeft && useRight) {
      const leftA = angleBetween(getPoint(leftShoulder), getPoint(leftHip), getPoint(leftAnkle));
      const rightA = angleBetween(getPoint(rightShoulder), getPoint(rightHip), getPoint(rightAnkle));
      rawHipAngle = (leftA * leftVis + rightA * rightVis) / (leftVis + rightVis);
    } else if (useLeft) {
      rawHipAngle = angleBetween(getPoint(leftShoulder), getPoint(leftHip), getPoint(leftAnkle));
    } else {
      rawHipAngle = angleBetween(getPoint(rightShoulder), getPoint(rightHip), getPoint(rightAnkle));
    }

    this.smoothedHipAngle = this.smooth(this.smoothedHipAngle, rawHipAngle);
    const hipAngle = this.smoothedHipAngle;

    // A perfect plank has a hip angle of ~180 degrees.
    // > 180 means sagging hips (hips closer to ground).
    // < 180 means piked hips (hips too high).
    // Let's use 160-190 as a generous "plank" threshold, but penalize form within it.
    
    // In our coordinate system (y goes down):
    // If the person is facing the camera, or side profile, angle is calculated 0-180 usually.
    // Let's use angleBetween which returns 0-180.
    // 180 = straight line.
    // We will consider > 155 degrees as a "plank" posture.
    
    const errors: string[] = [];
    let isGoodForm = true;

    // Wait, let's determine if it's sagging or piked.
    // We can just rely on the angle: < 165 = piked hips.
    // Sagging hips might actually increase the angle closer to 180 or beyond if the math allows,
    // but since angleBetween is 0-180, both sagging and piked might reduce the angle from 180.
    // To distinguish, we need to know which way the angle breaks (y coordinate of hip).
    // Simplest: if hip.y > (shoulder.y + ankle.y) / 2 -> sagging (y is down)
    // if hip.y < (shoulder.y + ankle.y) / 2 -> piked
    
    const activeHip = useLeft ? leftHip : rightHip;
    const activeShoulder = useLeft ? leftShoulder : rightShoulder;
    const activeAnkle = useLeft ? leftAnkle : rightAnkle;
    
    const expectedHipY = (activeShoulder.y + activeAnkle.y) / 2;

    if (hipAngle > 150) {
      this.currentState = 'planking';
      this.plankAccumulatedMs += deltaMs;
      
      // Update repCount to be the number of seconds held
      const newRepCount = Math.floor(this.plankAccumulatedMs / 1000);
      
      if (hipAngle < 165) {
        isGoodForm = false;
        if (activeHip.y > expectedHipY + 0.05) {
          errors.push('sagging_hips');
        } else if (activeHip.y < expectedHipY - 0.05) {
          errors.push('piked_hips');
        } else {
          errors.push('poor_alignment');
        }
      }

      this.currentErrors = errors;

      // Every time a new second is reached, treat it as a "rep" for the HUD
      if (newRepCount > this.repCount) {
        this.repCount = newRepCount;
        const repResult = this.addRepResult('plank', isGoodForm, errors);
        return { state: 'planking', errors, currentRep: repResult };
      }

    } else {
      this.currentState = 'resting';
    }

    return { state: this.currentState, errors: [...errors] };
  }

  // ==================== HELPERS ====================
  getRepCount(): number {
    return this.repCount;
  }

  getCurrentErrors(): string[] {
    return this.currentErrors;
  }

  getFormScore(): number {
    if (this.repResults.length === 0) return 100;
    const goodReps = this.repResults.filter(r => r.goodForm).length;
    return Math.round((goodReps / this.repResults.length) * 100);
  }

  getCurrentStreak(): number {
    let streak = 0;
    for (let i = this.repResults.length - 1; i >= 0; i--) {
      if (this.repResults[i].goodForm) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }
}

// Singleton instance for the current session
export const exerciseLogic = new ExerciseLogic();
