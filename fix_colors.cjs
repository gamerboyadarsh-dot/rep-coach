const fs = require('fs');
const glob = require('glob');

// We need to use glob.sync but wait, let's just do it manually for src/components/*.tsx
const dir = 'src/components/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const replacements = [
  [/bg-blue-500/g, 'bg-lime-500'],
  [/bg-blue-600/g, 'bg-lime-600'],
  [/bg-blue-400/g, 'bg-lime-400'],
  [/text-blue-500/g, 'text-lime-500'],
  [/text-blue-400/g, 'text-lime-400'],
  [/border-blue-500/g, 'border-lime-500'],
  [/ring-blue-500/g, 'ring-lime-500'],
  [/from-blue-600/g, 'from-lime-600'],
  [/to-blue-400/g, 'to-lime-400'],
  [/from-blue-500/g, 'from-lime-500'],
  [/to-indigo-500/g, 'to-lime-400'],
  [/to-indigo-600/g, 'to-lime-500'],
  [/text-indigo-400/g, 'text-lime-400']
];

for (const f of files) {
  let content = fs.readFileSync(dir + f, 'utf8');
  let changed = false;
  
  for (const [regex, replacement] of replacements) {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(dir + f, content);
    console.log('Fixed colors in ' + f);
  }
}
