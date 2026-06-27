# Rep Coach: AI-Powered Fitness Tracking 🏋️‍♂️🤖

Rep Coach is a sophisticated, browser-based, AI-powered fitness application designed to provide real-time workout tracking and form analysis using computer vision. Built for the Vibe Coding Hackathon, it delivers a premium, gamified fitness experience directly through your webcam—without the need for external hardware or sensors.

**Live Demo:** [repcoach-hackathon-live.surge.sh](https://repcoach-hackathon-live.surge.sh)

## 🚀 Features

- **Real-time Skeletal Tracking**: Uses Google MediaPipe to track 33 3D body landmarks instantly via your webcam at 25+ fps.
- **Three Supported Exercises**:
  - **Squats**: Tracks hip and knee depth to ensure 90-degree angles and monitors knee valgus.
  - **Push-ups**: Tracks back alignment and elbow extension angles.
  - **Jumping Jacks**: Tracks full-body extension, wrist height, and leg spread.
- **Intelligent Form Analysis**: Dynamically calculates joint angles to assign a "Form Score" for every single repetition. Get detailed, context-aware AI feedback at the end of your session (e.g., detecting if you missed depth or lacked full extension).
- **Gamification & Achievement System**: Unlock custom badges (e.g., "First Steps", "Century Club", "Flawless Execution") in your Trophy Room. Track your active daily streaks and watch the confetti drop when you hit personal records!
- **Immersive Cybernetic UI/UX**: Enjoy a stunning, modern dark-mode HUD aesthetic featuring glassmorphism (backdrop filters), smooth glows, particle animations, haptics, and satisfying audio-visual feedback.
- **Theme Engine**: Features an instant Light/Dark mode toggle.
- **Data Analytics Dashboard**: A comprehensive profile featuring a 7-Day Activity Chart, Personal Records, and detailed workout history logs.
- **Cloud Synchronization**: Securely sync your stats across devices using Firebase Firestore, or play instantly in local-storage Guest Mode.
- **Interactive 3D Databank**: Learn perfect form with interactive, rotating 3D human models (Anterior and Posterior) that highlight the exact muscle groups targeted by each exercise, paired with realistic 4K form demonstrations.

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom CSS (Glassmorphism, animations)
- **Computer Vision**: `@mediapipe/tasks-vision` (PoseLandmarker)
- **State & Persistence**: Firebase Firestore + Local Storage
- **Audio/Visuals**: Native Web Audio API, Canvas, `react-body-highlighter`
- **Hosting**: Surge

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
