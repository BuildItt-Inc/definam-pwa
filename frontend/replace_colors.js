const fs = require('fs');
const path = require('path');

const DIRS = ['app', 'components'];

const REPLACEMENTS = [
  { regex: /\bbg-white\b(?!\/)/g, replace: 'bg-card' },
  { regex: /\bbg-gray-50\b(?!\/)/g, replace: 'bg-bg-0' },
  { regex: /\bbg-gray-100\b(?!\/)/g, replace: 'bg-bg-2' },
  { regex: /\bbg-gray-200\b(?!\/)/g, replace: 'bg-bg-3' },
  { regex: /\bborder-gray-100\b(?!\/)/g, replace: 'border-border' },
  { regex: /\bborder-gray-200\b(?!\/)/g, replace: 'border-border-2' },
  { regex: /\btext-gray-400\b(?!\/)/g, replace: 'text-muted' },
  { regex: /\btext-gray-500\b(?!\/)/g, replace: 'text-muted' },
  { regex: /\btext-gray-600\b(?!\/)/g, replace: 'text-ink-2' },
  { regex: /\btext-gray-700\b(?!\/)/g, replace: 'text-ink-2' }
];

function processDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      let newContent = content;
      for (const { regex, replace } of REPLACEMENTS) {
        newContent = newContent.replace(regex, replace);
      }
      
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

DIRS.forEach(dir => processDir(path.join(__dirname, dir)));
console.log('Done replacing colors.');
