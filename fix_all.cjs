const fs = require('fs');

// 1. App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace("const [isBooting, setIsBooting] = useState(true);", "const [isBooting, setIsBooting] = useState(true);\n  useEffect(() => {\n    const timer = setTimeout(() => setIsBooting(false), 1200);\n    return () => clearTimeout(timer);\n  }, []);");
app = app.replace("setAppState('selecting');", "setAppState('selecting'); setAuthResolved(true);");
app = app.replace("setUserId(null);\n        setUsername(null);\n        setUserPhoto(null);\n        setIsGuest(false);\n        setAppState('auth');", "setUserId(null);\n        setUsername(null);\n        setUserPhoto(null);\n        setIsGuest(false);\n        setAppState('auth');\n        setAuthResolved(true);");
fs.writeFileSync('src/App.tsx', app);

// 2. Skeleton.tsx
let skel = fs.readFileSync('src/components/Skeleton.tsx', 'utf8');
skel = skel.replace(/NodeJS\.Timeout/g, "ReturnType<typeof setTimeout>");
fs.writeFileSync('src/components/Skeleton.tsx', skel);

// 3. Heatmap3D.tsx
let heatmap = fs.readFileSync('src/components/Heatmap3D.tsx', 'utf8');
heatmap = heatmap.replace("import { Skeleton } from './Skeleton';", "import { SkeletonBlock } from './Skeleton';");
heatmap = heatmap.replace("<Skeleton className", "<SkeletonBlock className");
fs.writeFileSync('src/components/Heatmap3D.tsx', heatmap);

// 4. UserProfile.tsx
let uprof = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');
uprof = uprof.replace("import { Skeleton } from './Skeleton';", "import { SkeletonBlock } from './Skeleton';");
uprof = uprof.replace(/<Skeleton /g, "<SkeletonBlock ");
fs.writeFileSync('src/components/UserProfile.tsx', uprof);

// 5. SplashScreen.tsx
let splash = fs.readFileSync('src/components/SplashScreen.tsx', 'utf8');
splash = splash.replace("import React from 'react';\n", "");
fs.writeFileSync('src/components/SplashScreen.tsx', splash);

// 6. ExerciseSelector.tsx
let exsel = fs.readFileSync('src/components/ExerciseSelector.tsx', 'utf8');
exsel = exsel.replace(", SkeletonText, SkeletonCircle } from './Skeleton';", "} from './Skeleton';");
fs.writeFileSync('src/components/ExerciseSelector.tsx', exsel);

console.log('Fixed all TS errors');
