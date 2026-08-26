import re

with open('src/components/ExerciseSelector.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'\{isLoadingStats \? \([\s\S]*?<div className="flex items-end justify-between h-48 gap-2"[\s\S]*?<\/div>\n\s*\) : \(',
    '<LoadingBoundary isLoading={isLoadingStats} fallback={<div className="flex items-end justify-between h-48 gap-2">{[1, 2, 3, 4, 5, 6, 7].map(i => (<SkeletonBlock key={i} className="w-full rounded-t-sm" style={{ height: ${Math.random() * 60 + 20}% }} />))}</div>}>\n',
    content
)

content = re.sub(
    r'<\/LineChart>\n\s*<\/ResponsiveContainer>\n\s*<\/div>\n\s*<\/div>\n\s*<\/motion.div>',
    '</LineChart>\n                </ResponsiveContainer>\n              </div>\n            </div>\n            </LoadingBoundary>\n          </motion.div>',
    content
)

content = re.sub(
    r'\{isLoadingStats \? \(\n\s*<Skeleton className="w-full h-\[380px\]" \/>\n\s*\) : \(\n\s*<div className="rounded-2xl overflow-hidden border border-white\/5 bg-slate-950\/50">\n\s*<MuscleHeatmap history=\{recentWorkouts\} \/>\n\s*<\/div>\n\s*\)\}',
    '<LoadingBoundary isLoading={isLoadingStats} fallback={<SkeletonBlock className="w-full h-[380px] rounded-2xl" />}>\n                <div className="rounded-2xl overflow-hidden border border-white/5 bg-slate-950/50">\n                  <MuscleHeatmap history={recentWorkouts} />\n                </div>\n              </LoadingBoundary>',
    content
)

content = re.sub(
    r'\{isLoadingStats \? \(\n\s*<>\n\s*<Skeleton className="w-full h-24" \/>\n\s*<Skeleton className="w-full h-24 opacity-70" \/>\n\s*<Skeleton className="w-full h-24 opacity-40" \/>\n\s*<Skeleton className="w-full h-24 opacity-20" \/>\n\s*<\/>\n\s*\) : recentWorkouts\.length === 0 \? \(',
    '<LoadingBoundary isLoading={isLoadingStats} fallback={<div className="flex flex-col gap-4">{[1,2,3,4].map(i => <SkeletonBlock key={i} className="w-full h-24 rounded-2xl" style={{ opacity: 1 - ((i-1)*0.2) }} />)}</div>}>\n              {recentWorkouts.length === 0 ? (',
    content
)

content = re.sub(
    r'<\/motion\.div>\n\s*\);\n\s*\}\)\n\s*\)\}',
    '</motion.div>\n            );\n          })\n        )}\n        </LoadingBoundary>',
    content
)

content = content.replace("import { Skeleton }", "import { SkeletonBlock, LoadingBoundary }")

with open('src/components/ExerciseSelector.tsx', 'w') as f:
    f.write(content)
print("Done")
