const fs = require('fs');

let exSel = fs.readFileSync('src/components/ExerciseSelector.tsx', 'utf8');
if (!exSel.includes('import { ExerciseVideo }')) {
    exSel = "import { ExerciseVideo } from './ExerciseVideo';\n" + exSel;
    fs.writeFileSync('src/components/ExerciseSelector.tsx', exSel);
}

let hud = fs.readFileSync('src/components/WorkoutHUD.tsx', 'utf8');
hud = hud.replace(/import \{ AudioVisualizer \} from '\.\/AudioVisualizer';\n/g, '');
hud = "import { AudioVisualizer } from './AudioVisualizer';\n" + hud;

if (!hud.includes('<AudioVisualizer />')) {
    hud = hud.replace('<div className="absolute top-6 left-6 z-10 flex gap-2">', '<AudioVisualizer />\n        <div className="absolute top-6 left-6 z-10 flex gap-2">');
}
fs.writeFileSync('src/components/WorkoutHUD.tsx', hud);

console.log('Fixed');
