const fs = require('fs');

// ExerciseSelector
let exSel = fs.readFileSync('src/components/ExerciseSelector.tsx', 'utf8');
if (!exSel.includes('import { ExerciseVideo }')) {
    exSel = exSel.replace("import { Trophy", "import { ExerciseVideo } from './ExerciseVideo';\nimport { Trophy");
    fs.writeFileSync('src/components/ExerciseSelector.tsx', exSel);
}

// WorkoutHUD
let hud = fs.readFileSync('src/components/WorkoutHUD.tsx', 'utf8');
if (hud.includes('AudioVisualizer')) {
    hud = hud.replace('<div className="absolute top-6 left-6 z-10 flex gap-2">', '<AudioVisualizer />\n        <div className="absolute top-6 left-6 z-10 flex gap-2">');
    fs.writeFileSync('src/components/WorkoutHUD.tsx', hud);
}

// App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
if (!app.includes('<CustomCursor />')) {
    app = app.replace('<Suspense fallback={<FullScreenLoader />}>', '<CustomCursor />\n        <Suspense fallback={<FullScreenLoader />}>');
    fs.writeFileSync('src/App.tsx', app);
}

console.log('Fixed imports and components');
