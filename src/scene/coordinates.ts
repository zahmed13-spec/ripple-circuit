import { Vector3, Vector2, Raycaster, Plane, type Camera } from "three";
export const gameToWorld = (x: number, y: number, height = 0) =>
  new Vector3((x - 360) / 60, height, (y - 360) / 60);
export const worldToGame = (p: { x: number; z: number }) => ({
  x: p.x * 60 + 360,
  y: p.z * 60 + 360,
});
export function screenToWorld(
  x: number,
  y: number,
  r: DOMRect,
  camera: Camera,
  height = 0,
) {
  const ray = new Raycaster();
  ray.setFromCamera(
    new Vector2(
      ((x - r.left) / r.width) * 2 - 1,
      1 - ((y - r.top) / r.height) * 2,
    ),
    camera,
  );
  return ray.ray.intersectPlane(
    new Plane(new Vector3(0, 1, 0), -height),
    new Vector3(),
  );
}
export function worldToScreen(
  p: Vector3,
  camera: Camera,
  width: number,
  height: number,
) {
  const v = p.clone().project(camera);
  return { x: ((v.x + 1) * width) / 2, y: ((1 - v.y) * height) / 2 };
}
