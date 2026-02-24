import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ground = Array(300).fill(1);
const pathData = Array(300).fill(0);
for (let i = 142; i <= 157; i++) pathData[i] = 2;
const map = {
  compressionlevel: -1,
  height: 15,
  infinite: false,
  layers: [
    { data: ground, height: 15, id: 1, name: 'ground', opacity: 1, type: 'tilelayer', visible: true, width: 20, x: 0, y: 0 },
    { data: pathData, height: 15, id: 2, name: 'path', opacity: 1, type: 'tilelayer', visible: true, width: 20, x: 0, y: 0 },
    { draworder: 'topdown', id: 3, name: 'waypoints', objects: [
      { id: 1, x: 280, y: 360, width: 0, height: 0 },
      { id: 2, x: 568, y: 360, width: 0, height: 0 },
      { id: 3, x: 856, y: 360, width: 0, height: 0 },
      { id: 4, x: 1000, y: 360, width: 0, height: 0 }
    ], opacity: 1, type: 'objectgroup', visible: true, x: 0, y: 0 }
  ],
  nextlayerid: 4,
  nextobjectid: 5,
  orientation: 'orthogonal',
  renderorder: 'right-down',
  tiledversion: '1.10',
  tileheight: 48,
  tilesets: [{ firstgid: 1, columns: 2, image: 'tiles_forest.png', imageheight: 48, imagewidth: 96, margin: 0, name: 'tiles_forest', spacing: 0, tilecount: 2, tileheight: 48, tilewidth: 48 }],
  tilewidth: 48,
  type: 'map',
  version: '1.10',
  width: 20
};
const out = path.join(__dirname, 'level_tiled.json');
fs.writeFileSync(out, JSON.stringify(map));
console.log('OK');
