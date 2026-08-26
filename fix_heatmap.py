import re

with open('src/components/MuscleHeatmap.tsx', 'r') as f:
    content = f.read()

content = content.replace("border-t-blue-500", "border-t-lime-500")
content = content.replace(
    '<div className="w-8 h-8 border-2 border-lime-500/30 border-t-lime-500 rounded-full animate-spin" />',
    '<div className="w-8 h-8 border-2 border-lime-500/30 border-t-lime-500 rounded-full animate-[spin_1s_linear_infinite]" />'
)

# Actually let's just make it use SkeletonBlock
content = content.replace(
    "import { lazy, Suspense } from 'react';",
    "import { lazy, Suspense } from 'react';\nimport { SkeletonBlock } from './Skeleton';"
)

content = re.sub(
    r'<Suspense fallback=\{[\s\S]*?\}>',
    '<Suspense fallback={<SkeletonBlock className="w-full h-[380px] rounded-xl" />}>',
    content
)

with open('src/components/MuscleHeatmap.tsx', 'w') as f:
    f.write(content)
