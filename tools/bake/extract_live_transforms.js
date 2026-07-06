const puppeteer = require('puppeteer-core');
const fs = require('fs');

const MODEL_NAMES = [
  'OfficeDeskModel',
  'ModernErgonomicChairModel',
  'RitaFloorLampModel',
  'PottedPlantModel',
  'HomePodMiniModel',
  'MouseModel',
  'KeyboardModel',
  'MacStudioModel',
  'StudioDisplayModel',
  'WoodMonitorRaiserModel',
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--window-size=1600,900', '--hide-scrollbars', '--use-angle=metal'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 9000));
  await page.mouse.click(800, 500); // enter door
  await new Promise((r) => setTimeout(r, 12000)); // room load + intro

  const data = await page.evaluate((names) => {
    const sp = window.__spatialPortfolio;
    if (!sp || !sp.scene) return { error: 'no __spatialPortfolio.scene' };
    const out = {};
    sp.scene.updateMatrixWorld(true);
    const found = [];
    sp.scene.traverse((o) => {
      if (names.includes(o.name)) found.push(o);
    });
    for (const obj of found) {
      // world TRS
      const m = obj.matrixWorld.elements;
      // decompose manually to avoid needing THREE in page scope? THREE objects have decompose helpers on themselves:
      const pos = obj.getWorldPosition(new obj.position.constructor());
      const quat = obj.getWorldQuaternion(new obj.quaternion.constructor());
      const scl = obj.getWorldScale(new obj.position.constructor());
      // world bbox via expandByObject-like traversal
      let min = [Infinity, Infinity, Infinity];
      let max = [-Infinity, -Infinity, -Infinity];
      obj.traverse((child) => {
        if (!child.isMesh || !child.geometry) return;
        const geo = child.geometry;
        if (!geo.boundingBox) geo.computeBoundingBox();
        const bb = geo.boundingBox;
        for (let xi = 0; xi < 2; xi++)
          for (let yi = 0; yi < 2; yi++)
            for (let zi = 0; zi < 2; zi++) {
              const v = new pos.constructor(
                xi ? bb.max.x : bb.min.x,
                yi ? bb.max.y : bb.min.y,
                zi ? bb.max.z : bb.min.z
              ).applyMatrix4(child.matrixWorld);
              min = [Math.min(min[0], v.x), Math.min(min[1], v.y), Math.min(min[2], v.z)];
              max = [Math.max(max[0], v.x), Math.max(max[1], v.y), Math.max(max[2], v.z)];
            }
      });
      out[obj.name] = {
        position: [pos.x, pos.y, pos.z],
        quaternion: [quat.x, quat.y, quat.z, quat.w],
        scale: [scl.x, scl.y, scl.z],
        bboxMin: min,
        bboxMax: max,
      };
    }
    return out;
  }, MODEL_NAMES);

  fs.writeFileSync(process.argv[2] || 'live_transforms.json', JSON.stringify(data, null, 2));
  console.log(Object.keys(data).join(', '));
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
