import json, os
ground = [1] * 300
path = [0] * 142 + [2] * 16 + [0] * 142
m = {"compressionlevel": -1, "height": 15, "infinite": False, "layers": [
    {"data": ground, "height": 15, "id": 1, "name": "ground", "opacity": 1, "type": "tilelayer", "visible": True, "width": 20, "x": 0, "y": 0},
    {"data": path, "height": 15, "id": 2, "name": "path", "opacity": 1, "type": "tilelayer", "visible": True, "width": 20, "x": 0, "y": 0},
    {"draworder": "topdown", "id": 3, "name": "waypoints", "objects": [
        {"id": 1, "x": 280, "y": 360, "width": 0, "height": 0},
        {"id": 2, "x": 568, "y": 360, "width": 0, "height": 0},
        {"id": 3, "x": 856, "y": 360, "width": 0, "height": 0},
        {"id": 4, "x": 1000, "y": 360, "width": 0, "height": 0}
    ], "opacity": 1, "type": "objectgroup", "visible": True, "x": 0, "y": 0}
], "nextlayerid": 4, "nextobjectid": 5, "orientation": "orthogonal", "renderorder": "right-down", "tiledversion": "1.10", "tileheight": 48, "tilesets": [{"firstgid": 1, "columns": 2, "image": "tiles_forest.png", "imageheight": 48, "imagewidth": 96, "margin": 0, "name": "tiles_forest", "spacing": 0, "tilecount": 2, "tileheight": 48, "tilewidth": 48}], "tilewidth": 48, "type": "map", "version": "1.10",     "width": 20}
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "level_tiled.json")
with open(out, "w") as f:
    json.dump(m, f, separators=(",", ":"))
