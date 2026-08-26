const fs = require('fs');
let exSel = fs.readFileSync('src/components/ExerciseSelector.tsx', 'utf8');

// The incorrect SpotlightCard line
const oldLine = '<SpotlightCard className="h-full relative overflow-hidden group flex flex-col items-center surface-raised p-6 text-center border border-white/5 hover:border-lime-500/50 shadow-lg hover:shadow-[0_0_30px_rgba(163,230,53,0.15)] transition-all">';

const newLine = '<SpotlightCard className="h-full relative overflow-hidden group surface-raised border border-white/5 hover:border-lime-500/50 shadow-lg hover:shadow-[0_0_30px_rgba(163,230,53,0.15)] transition-all">\n                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">';

// Replace opening tags
exSel = exSel.split(oldLine).join(newLine);

// Replace closing tags
// Wait, we need to close the inner div just before </SpotlightCard>
exSel = exSel.replace(/<\/SpotlightCard>/g, '  </div>\n                </SpotlightCard>');

fs.writeFileSync('src/components/ExerciseSelector.tsx', exSel);
console.log('Fixed Grid');
