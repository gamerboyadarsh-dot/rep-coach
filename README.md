# Rep Coach 🏋️‍♂️🤖

**Your AI personal trainer, running entirely in your browser.**

Rep Coach is a real-time exercise form coach powered by computer vision. Point your webcam at yourself, pick an exercise, and get live rep counting, biomechanical form grading, and instant feedback — no wearables, no app install, no server doing the heavy lifting.

Built in 24 hours for the Vibe Coding Hackathon.

**Live Demo:** [repcoach-hackathon-live.surge.sh](https://repcoach-hackathon-live.surge.sh)

---

## 🚀 Features

**Real-Time Pose Tracking**
- Google MediaPipe (`PoseLandmarker`) tracks 33 3D body landmarks live via webcam, running entirely client-side on the GPU.
- Every landmark's confidence score is used, not discarded — low-visibility joints (occluded, off-screen, poorly lit) are filtered out before they can throw off a rep count, and exercises that can be tracked from either side automatically use whichever side the camera sees more clearly.

**Four Coached Exercises**
- **Squats** — hip/knee depth angle, standing-to-bottom state machine, knee valgus (caving-in) detection.
- **Push-ups** — elbow extension angle, hip-sag detection to catch a collapsing plank.
- **Jumping Jacks** — arm height and leg-spread tracking, normalized for distance from the camera.
- **Plank Hold** — time-based isometric tracking that monitors back-sag and alignment to ensure a perfectly straight line.

Each rep is graded 0-100% based on whether it cleared the relevant form checks, with specific errors (shallow depth, knees caving in, hips sagging, partial range of motion) surfaced live.

**Live Workout HUD & Voice Coaching**
While you train, you see: current rep / target rep (or time for planks), live pose-tracking confidence (%), current exercise stage (e.g. descending, bottom, ascending), and a clear good-form / bad-form indicator — all updating in real time.
**Spoken Voice Feedback**: The browser's native SpeechSynthesis API gives you live audio cues and rep counts while you work out. You can even choose between a **Supportive Coach 🧘‍♀️** and an intense **Drill Sergeant 🪖** personality in the settings!

**Real Camera Control**
Front/rear camera switching uses actual device enumeration (`enumerateDevices`) and switches by `deviceId`, not just a CSS mirror flip — it falls back gracefully on single-camera devices and remembers your last-used camera between sessions.

**Authentication & Sync**
- Sign in with Google or GitHub (Firebase Auth), or skip straight in with Guest Mode — no account required to try it.
- Signed-in users get their stats synced to Firestore; guests get a fully local-storage experience with the same features.

**Dashboard & Progress Tracking**
7-day activity chart, workout streak, calorie estimate, recent session history, and personal records per exercise.

**Gamification & Social Sharing**
- **XP & Leveling System:** Earn XP based on your form score and rep volume to rank up from Rookie all the way to Elite Athlete.
- **Wordle-style Sharing:** One-click copy your emoji-filled workout results to share on social media and challenge your friends.
- **Instant Highlight Replay:** Records a rolling 20-frame buffer while you train and captures a 2.5-second animated replay of your best, highest-power rep to share online.
- Unlockable achievement badges, daily streak tracking, confetti celebrations on milestones, and haptic feedback (`navigator.vibrate`) on supported devices.

**Viral Multi-Player & Immersion**
- **Ghost Challenge Mode:** Async multiplayer racing! Your rep timestamps are saved to the cloud when you share a challenge link. When a friend opens it, a purple Ghost progress bar races them in real-time based on your exact pace.
- **True 3D AR Avatar:** Mixed reality visualization uses `three.js` to map your live MediaPipe landmarks to a glowing 3D holographic avatar that mirrors your exact movements.
- **Velocity & Power Physics Engine:** Measures the concentric phase of every rep in milliseconds to calculate explosive power output (Watts). Shows a fiery "EXPLOSIVE" multiplier combo when you generate high power with good form!
- **Hands-Free Voice Control:** Uses the native Web Speech API to let you start exercises (e.g. "Start Squats") and end sessions ("Finish") completely hands-free, with an on/off toggle for the mic.

**Exercise Databank**
Each exercise has a realistic reference photo, step-by-step form instructions, and an interactive front/back muscle-engagement diagram that highlights which muscles you've been working, color-coded by how often you've trained them.

**Light/Dark Theme**
Instant theme toggle.

**Installable PWA**
Configured as an installable Progressive Web App with offline-capable caching.

---

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 + custom CSS (glassmorphism, glow effects, animations)
- **Computer Vision:** `@mediapipe/tasks-vision` (`PoseLandmarker`, GPU delegate)
- **3D Rendering & AR:** `three`, `@react-three/fiber`, `@react-three/drei`
- **Auth & Data:** Firebase Authentication (Google + GitHub providers) and Cloud Firestore, with a no-signup Guest Mode backed by `localStorage`
- **Muscle Visualization:** `react-body-highlighter`
- **Animation:** `framer-motion`, `canvas-confetti`
- **Icons:** `lucide-react`
- **Audio:** Native Web Audio API (synthesized sound effects) and Web Speech API (voice coaching)
- **PWA:** `vite-plugin-pwa`
- **Hosting:** Surge

---

## 💻 How to Run Locally

1. Clone the repository:
```bash
git clone https://github.com/gamerboyadarsh-dot/rep-coach.git
cd rep-coach
```

2. Install dependencies:
```bash
npm install
```

3. *(Optional)* To enable Google/GitHub sign-in and Firestore sync, create a `.env` file in the project root with your own Firebase project's config:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Without a `.env` file, the app still runs fully via **Guest Mode** — no Firebase setup required to try it out. 

4. Start the dev server:
```bash
npm run dev
```

5. Open `http://localhost:5173` and allow camera permissions.

---

## 🗺️ What's Next

Built in 24 hours, so a few things are deliberately scoped for a future pass rather than rushed in:

- Email/password sign-in as a third auth option alongside Google and GitHub
- Expanded databank entries (equipment, calorie estimate, breathing cues, and common-mistakes per exercise)
- Additional complex movements beyond the current four core exercises

---

## 🏆 Hackathon Submission Details

Built with a focus on **Vibe Coding** — shipping a genuinely working, immersive experience in a single 24-hour sprint, with real computer vision doing real biomechanical analysis client-side, no bloated backend required.

Enjoy the workout!
