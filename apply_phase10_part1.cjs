const fs = require('fs');

const updateFile = (path, replacements) => {
    let content = fs.readFileSync(path, 'utf8');
    for (const { rx, repl } of replacements) {
        content = content.replace(rx, repl);
    }
    fs.writeFileSync(path, content);
};

// ExerciseSelector
updateFile('src/components/ExerciseSelector.tsx', [
    { rx: /bg-blue-600 hover:bg-blue-500 text-white/g, repl: 'bg-lime-500 hover:bg-lime-400 text-slate-900' },
    { rx: /shadow-\[0_4px_20px_rgba\(37,99,235,0\.4\)\]/g, repl: 'shadow-[0_4px_20px_rgba(132,204,22,0.4)]' },
    { rx: /text-blue-400/g, repl: 'text-lime-400' },
    { rx: /text-blue-500/g, repl: 'text-lime-500' },
    { rx: /bg-blue-500/g, repl: 'bg-lime-500' },
    // Oversized typography for stat cards
    { rx: /<CountUpNumber value=\{totalReps\} className="text-3xl/g, repl: '<CountUpNumber value={totalReps} isKinetic className="text-5xl md:text-7xl font-outfit' },
    { rx: /<CountUpNumber value=\{currentStreak\} className="text-3xl/g, repl: '<CountUpNumber value={currentStreak} isKinetic className="text-5xl md:text-7xl font-outfit' },
    { rx: /<CountUpNumber value=\{calories\} className="text-3xl/g, repl: '<CountUpNumber value={calories} isKinetic className="text-5xl md:text-7xl font-outfit' },
    // Fix segmented control gradient
    { rx: /from-blue-600 to-purple-600/g, repl: 'from-lime-500 to-lime-400' },
    { rx: /shadow-\[0_0_15px_rgba\(59,130,246,0\.5\)\]/g, repl: 'shadow-[0_0_15px_rgba(132,204,22,0.5)]' },
]);

// UserProfile
updateFile('src/components/UserProfile.tsx', [
    { rx: /text-blue-400/g, repl: 'text-lime-400' },
    { rx: /text-blue-500/g, repl: 'text-lime-500' },
    { rx: /bg-blue-400/g, repl: 'bg-lime-400' },
    { rx: /bg-blue-500/g, repl: 'bg-lime-500' },
    { rx: /rgba\(59,130,246,1\)/g, repl: 'rgba(163,230,53,1)' },
    { rx: /<CountUpNumber value=\{stats\.totalReps\} className="text-3xl/g, repl: '<CountUpNumber value={stats.totalReps} isKinetic className="text-5xl md:text-7xl font-outfit' },
    { rx: /<CountUpNumber value=\{stats\.totalWorkouts\} className="text-3xl/g, repl: '<CountUpNumber value={stats.totalWorkouts} isKinetic className="text-5xl md:text-7xl font-outfit' },
    { rx: /<CountUpNumber value=\{stats\.currentDailyStreak\} className="text-3xl/g, repl: '<CountUpNumber value={stats.currentDailyStreak} isKinetic className="text-5xl md:text-7xl font-outfit' }
]);

// SessionSummary
updateFile('src/components/SessionSummary.tsx', [
    { rx: /bg-blue-600 hover:bg-blue-500 text-white/g, repl: 'bg-lime-500 hover:bg-lime-400 text-slate-900' },
    { rx: /bg-blue-600\/20 hover:bg-blue-600 border-blue-500\/50 hover:border-blue-500 text-blue-400/g, repl: 'bg-lime-500/20 hover:bg-lime-500 border-lime-500/50 hover:border-lime-500 text-lime-400' },
    { rx: /text-blue-400/g, repl: 'text-lime-400' },
    { rx: /text-blue-300/g, repl: 'text-lime-300' },
    { rx: /text-blue-500/g, repl: 'text-lime-500' },
    { rx: /bg-blue-500/g, repl: 'bg-lime-500' },
    { rx: /border border-blue-500/g, repl: 'border border-lime-500' },
    { rx: /shadow-\[0_0_30px_rgba\(59,130,246,/g, repl: 'shadow-[0_0_30px_rgba(132,204,22,' },
    { rx: /shadow-\[0_0_20px_rgba\(37,99,235,/g, repl: 'shadow-[0_0_20px_rgba(132,204,22,' },
    { rx: /<span className="text-5xl font-black/g, repl: '<span className="text-7xl md:text-9xl font-black font-outfit' },
    { rx: /<span className="text-4xl font-black/g, repl: '<span className="text-6xl md:text-8xl font-black font-outfit' },
]);

// WorkoutHUD
updateFile('src/components/WorkoutHUD.tsx', [
    { rx: /text-blue-400/g, repl: 'text-lime-400' },
    { rx: /text-blue-500/g, repl: 'text-lime-500' },
    { rx: /bg-blue-500/g, repl: 'bg-lime-500' },
    { rx: /border-blue-500/g, repl: 'border-lime-500' },
    { rx: /from-blue-600 to-blue-400/g, repl: 'from-lime-500 to-lime-400' },
    { rx: /shadow-\[0_0_15px_rgba\(59,130,246,0\.6\)\]/g, repl: 'shadow-[0_0_15px_rgba(132,204,22,0.6)]' },
    { rx: /<span className="text-8xl md:text-\[12rem\] font-black/g, repl: '<span className="text-8xl md:text-[12rem] font-black font-outfit' }
]);

console.log('Colors and typography updated.');
