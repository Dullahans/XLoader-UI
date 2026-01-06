/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`[sync_static_json] skip (not found): ${src}`);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`[sync_static_json] copied: ${src} -> ${dest}`);
}

const clientDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(clientDir, '..');
const dataDir = path.join(repoRoot, 'data');
const publicDir = path.join(clientDir, 'public');

copyIfExists(path.join(dataDir, 'register_definitions.json'), path.join(publicDir, 'register_definitions.json'));
copyIfExists(path.join(dataDir, 'model_dictionary.json'), path.join(publicDir, 'model_dictionary.json'));


