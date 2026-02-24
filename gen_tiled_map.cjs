const fs = require("fs");
const path = require("path");
const groundData = Array(300).fill(1);
const pathData = [...Array(142).fill(0), ...Array(16).fill(2), ...Array(142).fill(0)];
const map = {
  compressionlevel: -1,
  editorsettings: {},
  height: 15,
  infinite: false,
  layers: [
    { data: groundData, height: 15, id: 1, name: "ground", opacity: 1, type: "tilelayer", visible: true, width: 20, x: 0, y: 0 },
    { data: pathData, height: 15, id: 2, name: "path", opacity: 1, type: "tilelayer", visible: true, width: 20, x: 0, y: 0 },
    { draworder: "topdown", id: 3, name: "waypoints", objects: [{ id: 1, x: 280, y: 360, width: 0, height: 0, name: "" }, { id: 2, x: 568, y: 360, width: 0, height: 0, name: "" }, { id: 3, x: 856, y: 360, width: 0, height: 0, name: "" }, { id: 4, x: 1000, y: 360, width: 0, height: 0, name: "" }], opacity: 1, type: "objectgroup", visible: true, x: 0, y: 0 }
  ],
  nextlayerid: 4,
  nextobjectid: 5,
  orientation: "orthogonal",
  renderorder: "right-down",
  tiledversion: "1.10.2",
  tileheight: 48,
  tilesets: [{ firstgid: 1, columns: 2, image: "tiles_forest.png", imageheight: 48, imagewidth: 96, margin: 0, name: "forest", spacing: 0, tilecount: 2, tileheight: 48, tilewidth: 48 }],
  tilewidth: 48,
  type: "map",
  version: "1.10",
  width: 20
};
const out = process.argv[2] || path.join(__dirname, "tiled_map.json");
fs.writeFileSync(out, JSON.stringify(map), "utf8");
console.log(out);
