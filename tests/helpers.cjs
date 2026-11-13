const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

async function launchBrowser() {
  const candidates = [process.env.BROWSER_EXECUTABLE];
  if (process.platform === 'win32') {
    for (const base of [process.env['ProgramFiles(x86)'], process.env.ProgramFiles, process.env.LOCALAPPDATA]) {
      if (base) candidates.push(path.join(base, 'Microsoft/Edge/Application/msedge.exe'), path.join(base, 'Google/Chrome/Application/chrome.exe'));
    }
  }
  const executablePath = candidates.find(file => file && fs.existsSync(file));
  return chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
}
function reportPath(file) {
  const folder = path.resolve(__dirname, '../reports');
  fs.mkdirSync(folder, { recursive: true });
  return path.join(folder, file);
}
module.exports = { launchBrowser, reportPath };
