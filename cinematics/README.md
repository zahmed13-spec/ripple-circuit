# The Animated Story production

The editable Blender 4.5 LTS animatic is **Ripple-Circuit-Cast-and-Animatic.blend**. Open it at the saved frame or use the named timeline markers to navigate all eight takes. It has original cast meshes, a mouth with A/E/O/Rest shape keys, keyframed fins, a faceted Ripple core, a seven-shard NULL seal, shot camera, lighting, and editable actor blocking. The scene uses a proxy set for shot editing. The finished browser set is assembled in `src/story/film/sets.ts`.

The canonical shot board is `src/story/film/boards.ts`. Every shot specifies a scene and label, duration, camera focus/offset/field of view, Luma and optional Ripple pose keys, effect, power curve, subtitle timings, speaking shapes, and optional musical cue. Successive shots cut at authored boundaries with short dips. Character poses sample at 15 fps while the camera, shader water and effects update near 30 fps. The browser GLTF asset contains the original Blender meshes, mouth shape keys, and 11 animation clips; the runtime adds expression, gaze and shot-specific blocking on top.

Regenerate after editing the shot data:

```sh
pnpm exec tsx cinematics/export-board.mts /tmp/ripple-story-boards.json
blender --background --factory-startup --python-exit-code 1 \
  --python cinematics/author_cast.py -- /tmp/ripple-story-boards.json \
  src/story/film/assets/cast.glb cinematics/Ripple-Circuit-Cast-and-Animatic.blend
```

For a still proof, add a PNG output path after the .blend argument. This uses EEVEE. Remove Blender's local .blend1 backup from the working directory before committing a regenerate. The .blend is editable production source and is outside the served bundle. Vite packages the GLB and the existing service worker caches it for offline play.

All eight films use timed subtitles and original synthesized audio. The mouth keys approximate speaking beats, without recorded voices or measured phoneme synchronization. The web release renders the films in real time. The EEVEE still is a look-development proof.
