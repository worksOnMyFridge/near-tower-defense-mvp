/**
 * Парсинг карты Tiled: из Tilemap получаем buildable и waypoints для GameScene.
 */
import type Phaser from 'phaser';

/** Индекс тайла «путь» в тайлсете (gid 2 = firstgid 1 + index 1). */
const PATH_TILE_INDEX = 1;

export function getBuildableFromTilemap(map: Phaser.Tilemaps.Tilemap): boolean[][] {
  const width = map.width;
  const height = map.height;
  const buildable: boolean[][] = [];
  for (let gy = 0; gy < height; gy++) {
    buildable[gy] = [];
    for (let gx = 0; gx < width; gx++) {
      const tile = map.getTileAt(gx, gy, false, 'path');
      const onPath = tile !== null && tile.index === PATH_TILE_INDEX;
      buildable[gy][gx] = !onPath;
    }
  }
  return buildable;
}

export function getWaypointsFromTilemap(map: Phaser.Tilemaps.Tilemap): { x: number; y: number }[] {
  const objLayer = map.getObjectLayer('waypoints');
  if (!objLayer || !objLayer.objects) return [];
  return objLayer.objects
    .map((obj) => ({ x: (obj as Phaser.Types.Tilemaps.TiledObject).x ?? 0, y: (obj as Phaser.Types.Tilemaps.TiledObject).y ?? 0 }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
    .sort((a, b) => a.x - b.x);
}
