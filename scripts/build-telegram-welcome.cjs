/* Local vector asset pipeline; no network, credentials or Telegram API. */
const fs = require('node:fs'), path = require('node:path'), sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const logo = fs.readFileSync(path.join(root, 'public/logos/menora-logo.svg')).toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
<rect width="1600" height="900" fill="#020022"/><circle cx="1500" cy="80" r="380" fill="#ffb800" opacity=".08"/><circle cx="1460" cy="100" r="260" fill="none" stroke="#ffb800" stroke-opacity=".3" stroke-width="2"/>
<path d="M0 796H1600" stroke="#ffb800" stroke-opacity=".25"/>
<rect x="96" y="240" width="320" height="360" rx="56" fill="#fffaf0"/><image href="data:image/svg+xml;base64,${logo}" x="116" y="280" width="280" height="280"/>
<g font-family="Arial, sans-serif"><text x="480" y="360" fill="#ffb800" font-size="25" letter-spacing="5">RISHON LEZION</text>
<text x="476" y="466" fill="white" font-size="82" font-weight="bold">Menorah Center</text>
<text x="480" y="536" fill="#dedee8" font-size="32">Your Jewish community. Your place.</text>
<text x="100" y="740" fill="#f1e4bd" font-size="25" letter-spacing="2">EVENTS  ·  TRADITION  ·  CONNECTION</text></g>
</svg>`;
(async () => { const dir = path.join(root, 'public/telegram'); fs.mkdirSync(dir, { recursive: true }); await sharp(Buffer.from(svg)).png().toFile(path.join(dir, 'welcome.png')); console.log('Built public/telegram/welcome.png (1600×900).'); })().catch(error => { console.error(error.message); process.exitCode = 1; });
