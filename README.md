# Rep Coach 🏋️‍♂️🤖

Rep Coach is an AI-powered, real-time exercise form coach that runs entirely in your browser. Built for the Vibe Coding Hackathon, it uses computer vision to track your skeletal joints, count your reps, and grade your form in real-time. 

Live Demo: [repcoach-hackathon-live.surge.sh](https://repcoach-hackathon-live.surge.sh)

## 🚀 Features

- **Real-time Skeletal Tracking**: Uses Google MediaPipe to track 33 3D body landmarks instantly via your webcam.
- **Three Supported Exercises**:
  - **Bodyweight Squats**: Tracks hip and knee depth to ensure 90-degree angles.
  - **Tactical Push-ups**: Tracks back alignment and elbow angles.
  - **Jumping Jacks**: Tracks full-body extension, wrist height, and leg spread.
- **Form Grading**: Get graded from 0 to 100% based on how well you adhere to the correct biomechanics.
- **Gamification & Streaks**: String together perfect reps to build your combo multiplier. 
- **Dynamic Synthesizer Audio**: A custom Web Audio API engine generates retro sci-fi synth tones on the fly for successful reps, combos, and form errors—no external audio files needed.
- **Career Tracking**: Login with an Operative ID to track your total lifetime reps and level up your rank locally.
- **AI Coach Debrief**: A simulated AI evaluates your performance at the end of a session, providing sassy feedback or praise based on your form score.
- **Interactive Exercise Databank**: Learn the perfect form with AI-generated anatomical muscle overlays and step-by-step instructions.

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom CSS (Cyberpunk HUD aesthetics, scanlines, glassmorphism)
- **Computer Vision**: `@mediapipe/tasks-vision` (PoseLandmarker)
- **Audio Engine**: Native `window.AudioContext`
- **Hosting**: Surge / Vercel

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

3. Start the development server:
```bash
npm run dev
```

4. Open `http://localhost:5173` in your browser and allow camera permissions.

## 🏆 Hackathon Submission Details
This project was built focusing on **Vibe Coding**—creating an immaculate user experience, robust core mechanics without relying on bloated server-side tech, and instantly delivering value (and fun!) through gamification.

Enjoy the workout!
