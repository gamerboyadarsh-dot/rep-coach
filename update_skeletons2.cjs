const fs = require('fs');
let content = fs.readFileSync('src/components/ExerciseSelector.tsx', 'utf8');

// 7-Day Activity Chart
content = content.replace(
  "{isLoadingStats ? (\n                <div className=\"flex items-end justify-between h-48 gap-2\">\n                  {[1, 2, 3, 4, 5, 6, 7].map(i => (\n                    <div key={i} className=\"w-full bg-white/5 rounded-t-sm animate-pulse\" style={{ height: \\%\ }} />\n                  ))}\n                </div>\n              ) : (",
  "<LoadingBoundary isLoading={isLoadingStats} fallback={<div className=\"flex items-end justify-between h-48 gap-2\">{[1, 2, 3, 4, 5, 6, 7].map(i => (<SkeletonBlock key={i} className=\"w-full rounded-t-sm\" style={{ height: \\%\ }} />))}</div>}>\n"
);
content = content.replace(
  "</LineChart>\n                </ResponsiveContainer>\n              </div>\n            </div>\n          </motion.div>",
  "</LineChart>\n                </ResponsiveContainer>\n              </div>\n            </div>\n            </LoadingBoundary>\n          </motion.div>"
);

// 3D Muscle Heatmap
content = content.replace(
  "{isLoadingStats ? (\n              <Skeleton className=\"w-full h-[380px]\" />\n            ) : (\n              <div className=\"rounded-2xl overflow-hidden border border-white/5 bg-slate-950/50\">\n                <MuscleHeatmap history={recentWorkouts} />\n              </div>\n            )}",
  "<LoadingBoundary isLoading={isLoadingStats} fallback={<SkeletonBlock className=\"w-full h-[380px] rounded-2xl\" />}>\n                <div className=\"rounded-2xl overflow-hidden border border-white/5 bg-slate-950/50\">\n                  <MuscleHeatmap history={recentWorkouts} />\n                </div>\n              </LoadingBoundary>"
);

// Recent Sessions
content = content.replace(
  "{isLoadingStats ? (\n              <>\n                <Skeleton className=\"w-full h-24\" />\n                <Skeleton className=\"w-full h-24 opacity-70\" />\n                <Skeleton className=\"w-full h-24 opacity-40\" />\n                <Skeleton className=\"w-full h-24 opacity-20\" />\n              </>\n            ) : recentWorkouts.length === 0 ? (",
  "<LoadingBoundary isLoading={isLoadingStats} fallback={<div className=\"flex flex-col gap-4\">{[1,2,3,4].map(i => <SkeletonBlock key={i} className=\"w-full h-24 rounded-2xl\" style={{ opacity: 1 - ((i-1)*0.2) }} />)}</div>}>\n              {recentWorkouts.length === 0 ? ("
);

// We need to find the end of recentWorkouts to close the LoadingBoundary
// Wait, my previous script already did:
// content = content.replace(
//  "              </motion.div>\n            );\n          })\n        )}",
//  "              </motion.div>\n            );\n          })\n        )}\n        </LoadingBoundary>"
// );
// Wait, since my previous script didn't match the Recent Sessions start, did it match the end?
// Let's check where the end of recentWorkouts is.
