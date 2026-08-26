const fs = require('fs');

let hud = fs.readFileSync('src/components/WorkoutHUD.tsx', 'utf8');
hud = hud.replace('import { AudioVisualizer } from \'./AudioVisualizer\';\nimport { AudioVisualizer } from \'./AudioVisualizer\';', 'import { AudioVisualizer } from \'./AudioVisualizer\';');
hud = hud.replace('<div className="absolute top-6 left-6 z-10 flex gap-2">', '<AudioVisualizer />\n        <div className="absolute top-6 left-6 z-10 flex gap-2">');
fs.writeFileSync('src/components/WorkoutHUD.tsx', hud);
