// @ts-nocheck
import { angleBetween, getPoint } from './angles';

export type ExerciseType = 'squat' | 'pushup' | 'jumping_jack';

export type RepState = 'standing' | 'descending' | 'bottom' | 'ascending' | 'out' | 'in';
export type PushupState = 'up' | 'descending' | 'bottom' | 'ascending';

export interface FormError {
  type: string;
  message: string;
  severity: 'warning' | 'error';
}

export interface RepResult {
  repNumber: number;
  exercise: ExerciseType;
  goodForm: boolean;
  errors: string[];
  bottomAngle?: number;
  streak: number;
}

// Squat thresholds
const SQUAT_DEPTH_ANGLE = 120; // Relaxed from 100 for easier mobile detection
const SQUAT_STANDING_ANGLE = 150; // Relaxed from 160
const SQUAT_MIN_DEPTH = 130; 
const KNEE_VALGUS_THRESHOLD = 0.08; 

// Push-up thresholds
const PUSHUP_EXTENDED_ANGLE = 145; // Relaxed from 160
const PUSHUP_BENT_ANGLE = 110; // Relaxed from 90
const PUSHUP_MIN_BEND = 125; 
const HIP_SAG_MAX_DEVIATION = 35; // Relaxed from 25

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

class ExerciseLogic {
  private repCount = 0;
  private currentState: RepState = 'standing';
  private currentPushupState: PushupState = 'up';
  private currentErrors: string[] = [];
  private bottomAngleReached = Infinity;
  private hasStartedFromStanding = false;
  private lastBottomAngle = 0;

  // For squat valgus detection at bottom
  private bottomAnkleSpread = 0;
  private bottomKneeSpread = 0;

  private repResults: RepResult[] = [];
  private currentStreak = 0;

  reset() {
    this.repCount = 0;
    this.currentState = 'standing';
    this.currentPushupState = 'up';
    this.currentErrors = [];
    this.bottomAngleReached = Infinity;
    this.hasStartedFromStanding = false;
    this.lastBottomAngle = 0;
    this.bottomAnkleSpread = 0;
    this.bottomKneeSpread = 0;
    this.repResults = [];
    this.currentStreak = 0;
  }

  getResults(): RepResult[] {
    return [...this.repResults];
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
      streak: this.currentStreak
    };
    this.repResults.push(result);
    return result;
  }

  // ==================== SQUAT LOGIC ====================
  processSquatFrame(landmarks: { x: number; y: number }[], width: number = 1, height: number = 1): { state: RepState; errors: string[]; currentRep?: RepResult } {
    const hip = getPoint(landmarks[LANDMARKS.LEFT_HIP], width, height);
    const knee = getPoint(landmarks[LANDMARKS.LEFT_KNEE], width, height);
    const rightHip = getPoint(landmarks[LANDMARKS.RIGHT_HIP], width, height);
    const rightKnee = getPoint(landmarks[LANDMARKS.RIGHT_KNEE], width, height);

    // Use average of both legs
    const avgHip = { x: (hip.x + rightHip.x) / 2, y: (hip.y + rightHip.y) / 2 };
    const avgKnee = { x: (knee.x + rightKnee.x) / 2, y: (knee.y + rightKnee.y) / 2 };

    // Calculate femur angle relative to vertical
    // 0 = standing straight, 90 = deep squat (femur horizontal)
    const angle = angleToVertical(avgHip, avgKnee);

    // Femur angle thresholds for squatting
    const SQUAT_STANDING_THRESHOLD = 30; // degrees from vertical
    const SQUAT_DEPTH_THRESHOLD = 70; // degrees from vertical (femur almost horizontal)
    const SQUAT_MIN_DEPTH_THRESHOLD = 60; // minimum required to not be a "shallow" squat

    // State machine with hysteresis
    const errors: string[] = [];

    switch (this.currentState) {
      case 'standing':
        if (angle > SQUAT_STANDING_THRESHOLD + 10) {
          this.currentState = 'descending';
          this.hasStartedFromStanding = true;
          this.bottomAngleReached = 0;
        }
        break;

      case 'descending':
        if (angle > SQUAT_DEPTH_THRESHOLD) {
          this.currentState = 'bottom';
          this.bottomAngleReached = angle;
          this.lastBottomAngle = angle;

          // Check for knee valgus at bottom (only if ankles are somewhat visible)
          const leftAnkle = getPoint(landmarks[LANDMARKS.LEFT_ANKLE], width, height);
          const rightAnkle = getPoint(landmarks[LANDMARKS.RIGHT_ANKLE], width, height);
          const leftKnee = getPoint(landmarks[LANDMARKS.LEFT_KNEE], width, height);
          const rightKnee = getPoint(landmarks[LANDMARKS.RIGHT_KNEE], width, height);

          // X-distance between ankles and knees
          const ankleSpread = Math.abs(rightAnkle.x - leftAnkle.x);
          const kneeSpread = Math.abs(rightKnee.x - leftKnee.x);

          this.bottomAnkleSpread = ankleSpread;
          this.bottomKneeSpread = kneeSpread;

          // Knee valgus: knees closer together than ankles by threshold
          // Only check if ankles are reasonably far apart to avoid false positives
          if (ankleSpread > width * 0.1 && kneeSpread < ankleSpread * 0.8) {
            errors.push('knees_caving_in');
          }
        } else if (this.currentState === 'descending' && angle < SQUAT_MIN_DEPTH_THRESHOLD && this.hasStartedFromStanding) {
          // If they start going back up before reaching min depth, it's a shallow squat
          // We wait until they actually return to standing to register it.
        }
        break;

      case 'bottom':
        // Update max depth reached
        if (angle > this.bottomAngleReached) {
          this.bottomAngleReached = angle;
          this.lastBottomAngle = angle;
        }

        if (angle < SQUAT_DEPTH_THRESHOLD - 15) {
          this.currentState = 'ascending';
        }
        break;

      case 'ascending':
        if (angle < SQUAT_STANDING_THRESHOLD) {
          // Check if they ever reached minimum depth during the rep
          if (this.bottomAngleReached < SQUAT_MIN_DEPTH_THRESHOLD) {
             errors.push('shallow_squat');
          }

          // Rep complete!
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
  processPushupFrame(landmarks: { x: number; y: number }[], shoulderY: number, isLeftSide?: boolean, width: number = 1, height: number = 1): { state: PushupState; errors: string[]; currentRep?: RepResult } {
    const elbowIdx = isLeftSide ? LANDMARKS.LEFT_ELBOW : LANDMARKS.RIGHT_ELBOW;
    const shoulderIdx = isLeftSide ? LANDMARKS.LEFT_SHOULDER : LANDMARKS.RIGHT_SHOULDER;
    const wristIdx = isLeftSide ? LANDMARKS.LEFT_WRIST : LANDMARKS.RIGHT_WRIST;
    const hipIdx = LANDMARKS.LEFT_HIP;
    const ankleIdx = LANDMARKS.LEFT_ANKLE;

    const elbow = getPoint(landmarks[elbowIdx], width, height);
    const shoulder = getPoint(landmarks[shoulderIdx], width, height);
    const wrist = getPoint(landmarks[wristIdx], width, height);
    const hip = getPoint(landmarks[hipIdx], width, height);
    const ankle = getPoint(landmarks[ankleIdx], width, height);

    // Elbow angle
    const elbowAngle = angleBetween(shoulder, elbow, wrist);

    // Hip angle (shoulder-hip-ankle) - check for sagging
    const hipAngle = angleBetween(shoulder, hip, ankle);

    const errors: string[] = [];

    // Hip sagging detection: straight line should be ~180°, but measured from above can vary
    // In push-up position, shoulder-hip-ankle should be close to straight
    // Normal range: 160-180°. Below 160° = sagging
    if (hipAngle < HIP_SAG_MAX_DEVIATION && hipAngle > 10) {
      // Convert deviation: 180 minus actual angle
      if (180 - hipAngle > HIP_SAG_MAX_DEVIATION) {
        errors.push('hips_sagging');
      }
    }

    // State machine
    switch (this.currentPushupState) {
      case 'up':
        if (elbowAngle < PUSHUP_EXTENDED_ANGLE - 5) {
          this.currentPushupState = 'descending';
          this.bottomAngleReached = Infinity;
        }
        break;

      case 'descending':
        if (elbowAngle < PUSHUP_BENT_ANGLE) {
          this.currentPushupState = 'bottom';
          this.bottomAngleReached = elbowAngle;
          this.lastBottomAngle = elbowAngle;

          // Check for full range
          if (elbowAngle > PUSHUP_MIN_BEND) {
            errors.push('partial_rep');
          }
        }
        break;

      case 'bottom':
        if (elbowAngle > PUSHUP_BENT_ANGLE + 10) {
          this.currentPushupState = 'ascending';
        }
        break;

      case 'ascending':
        if (elbowAngle > PUSHUP_EXTENDED_ANGLE) {
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
  processJumpingJackFrame(landmarks: { x: number; y: number }[]): { state: RepState; errors: string[]; currentRep?: RepResult } {
    const leftWrist = landmarks[LANDMARKS.LEFT_WRIST];
    const rightWrist = landmarks[LANDMARKS.RIGHT_WRIST];
    const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
    const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];
    const leftHip = landmarks[LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[LANDMARKS.RIGHT_HIP];

    const ankleSpread = Math.abs(rightAnkle.x - leftAnkle.x);
    const hipSpread = Math.abs(rightHip.x - leftHip.x);
    
    // Normalize ankle spread by hip width to handle distance from camera
    const relativeSpread = ankleSpread / hipSpread;

    const armsUp = leftWrist.y < leftShoulder.y + 0.1 && rightWrist.y < rightShoulder.y + 0.1;
    const legsOut = relativeSpread > 1.2; // Relaxed from 1.8 for mobile

    const errors: string[] = [];

    switch (this.currentState) {
      case 'standing':
      case 'in':
        if (armsUp && legsOut) {
          this.currentState = 'out';
        } else if (armsUp && !legsOut) {
          // Warning if they don't jump their legs out
          if (this.currentState !== 'out') errors.push('lazy_legs');
        }
        break;

      case 'out':
        if (!armsUp && !legsOut) {
          const goodForm = errors.length === 0;
          const repResult = this.addRepResult('jumping_jack', goodForm, errors);
          this.currentState = 'standing';
          return { state: 'standing', errors, currentRep: repResult };
        }
        break;
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

// Factory for creating fresh instances when needed
export function createExerciseLogic(): ExerciseLogic {
  return new ExerciseLogic();
}
