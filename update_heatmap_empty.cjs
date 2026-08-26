const fs = require('fs');
let content = fs.readFileSync('src/components/ExerciseSelector.tsx', 'utf8');

const emptyHeatmap = \
                <div className="rounded-2xl overflow-hidden border border-white/5 bg-slate-950/50 relative">
                  <div className="\">
                    <MuscleHeatmap history={recentWorkouts} />
                  </div>
                  {recentWorkouts.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-950/40">
                      <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mb-4">
                        <Target className="w-8 h-8 text-slate-600" />
                      </div>
                      <h4 className="text-white font-bold mb-1">Awaiting Data</h4>
                      <p className="text-xs text-slate-400 max-w-[180px]">Your muscle activation will be visualized here after your first session.</p>
                    </div>
                  )}
                </div>
\;

content = content.replace(
  '<div className="rounded-2xl overflow-hidden border border-white/5 bg-slate-950/50">\n                  <MuscleHeatmap history={recentWorkouts} />\n                </div>',
  emptyHeatmap
);

// Also remove the small header text since we now have a large overlay
content = content.replace(
  '{recentWorkouts.length === 0 && (\n                  <span className="text-xs text-slate-500 font-bold">Complete a workout to activate</span>\n                )}',
  ''
);

fs.writeFileSync('src/components/ExerciseSelector.tsx', content);
console.log('Heatmap empty state updated');
