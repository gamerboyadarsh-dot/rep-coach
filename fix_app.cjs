const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('import { SplashScreen }')) {
  content = content.replace("import { auth } from './lib/firebase';", "import { auth } from './lib/firebase';\nimport { SplashScreen } from './components/SplashScreen';");
}

if (!content.includes('const [isBooting, setIsBooting] = useState(true);')) {
  content = content.replace("const [appState, setAppState] = useState<AppState>('auth');", "const [appState, setAppState] = useState<AppState>('auth');\n  const [isBooting, setIsBooting] = useState(true);\n  const [authResolved, setAuthResolved] = useState(false);");
  
  content = content.replace("useEffect(() => {\n    if (!auth) {", "useEffect(() => {\n    // Splash screen timer\n    const bootTimer = setTimeout(() => setIsBooting(false), 1200);\n    return () => clearTimeout(bootTimer);\n  }, []);\n\n  useEffect(() => {\n    if (!auth) {");

  content = content.replace("setAppState('selecting');\n      } else {", "setAppState('selecting');\n        setAuthResolved(true);\n      } else {\n        setAuthResolved(true);");
}

// Replace the render to include SplashScreen
if (!content.includes('<SplashScreen isVisible={isBooting || !authResolved} />')) {
  content = content.replace('<AnimatedBackground paused={appState === \'workout\'} />', '<AnimatedBackground paused={appState === \'workout\'} />\n            <SplashScreen isVisible={isBooting || !authResolved} />');
}

fs.writeFileSync('src/App.tsx', content);
console.log('App patched');
