import re

with open('src/components/ExerciseSelector.tsx', 'r') as f:
    content = f.read()

empty_heatmap = '''
                <div className="rounded-2xl overflow-hidden border border-white/5 bg-slate-950/50 relative">
                  <div className={recentWorkouts.length === 0 ? 'opacity-30 blur-sm pointer-events-none' : ''}>
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
'''

content = content.replace(
    '<div className="rounded-2xl overflow-hidden border border-white/5 bg-slate-950/50">\n                  <MuscleHeatmap history={recentWorkouts} />\n                </div>',
    empty_heatmap
)

content = content.replace(
    '{recentWorkouts.length === 0 && (\n                  <span className="text-xs text-slate-500 font-bold">Complete a workout to activate</span>\n                )}',
    ''
)

with open('src/components/ExerciseSelector.tsx', 'w') as f:
    f.write(content)
print("Done")
