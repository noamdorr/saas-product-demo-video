# One 3D world under the whole film

Read when a film reads as a run of separate slides and the fix is a shared place, or when a scene needs real perspective, light and shadow that CSS 3D cannot give. A film of flat product panels with good cuts does not need this; it costs a day to set up and every later scene pays for it in care.

## Why one world

A blind critique of one film's stills found the deck skeleton (`creative-direction.md`, "The clean slide deck"): every scene its own backdrop, nothing carried between them. The rebuild put every scene on one ground plane, under one camera and one light. The product panels, the invoice, the PDF and the close each became a place the camera travels to, or a DOM layer laid over a view of that ground. A move between scenes then became the camera moving through the world, not a wipe from one slide to the next, and the film's tonal arc (`creative-direction.md`, "Tone carries the plot") could become a change in that same world's light.

Keep the world small. One ground of dots (the film's established texture), two or three objects that matter to the story, one light. A world full of props is a 3D template.

## The setup in Remotion

Raw three.js, no react-three-fiber: the frame is computed from the frame number, and an extra render loop or a scene graph React owns only gets in the way. Pin `three` and `@types/three` to the same version.

```ts
import * as THREE from "three";

const W = 1920, H = 1080;
let built: { renderer: THREE.WebGLRenderer; scene: THREE.Scene /* , meshes ... */ } | null = null;

const build = () => {
  // One renderer per page. A browser allows only a handful of WebGL contexts, and
  // Remotion renders several frames per tab: a renderer per scene runs out of them.
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true, // or the screenshot can catch a cleared canvas
  });
  renderer.setPixelRatio(window.devicePixelRatio || 1); // follows --scale, so 4K renders at 4K
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.NoToneMapping;          // the palette's hexes land as written
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  Object.assign(renderer.domElement.style, { position: "absolute", left: "0", top: "0", width: `${W}px`, height: `${H}px` });
  const scene = new THREE.Scene();
  // ... the ground, the objects, one ambient light, one directional light with castShadow
  return { renderer, scene };
};

export const renderView = (view: WorldView, into: HTMLElement) => {
  if (!built) built = build();
  // The canvas moves to whichever scene is mounted. Re-parenting keeps the context.
  if (built.renderer.domElement.parentElement !== into) into.appendChild(built.renderer.domElement);
  aim(view.shot);
  // ... set every material, light and instance from the view: nothing carries over from the last call
  built.renderer.render(built.scene, camera);
};

export const WorldCanvas: React.FC<{ view: WorldView }> = ({ view }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => { if (ref.current) renderView(view, ref.current); }); // every render, no deps
  return <div ref={ref} style={{ position: "absolute", inset: 0 }} />;
};
```

Render with `--gl=angle` (`npx remotion render ... --gl=angle`, `npx remotion still ... --gl=angle`, `tools/mb/sample.mjs ... --gl angle`). Remotion's own guidance for three.js content is the ANGLE backend, and the first film built this way rendered every scene, still and shutter sample with it (gotcha 91).

**Every scene stays a pure function of the frame.** A scene builds a `WorldView` (tone, shot, what each object shows) from its frame and hands it to `renderView`, which sets everything from that view and keeps no state between calls. That is what lets `tools/mb` sample inside a frame's shutter and get a camera's real motion blur, and what lets `stills.mjs` render any frame alone. No `requestAnimationFrame`, no `clock.getDelta()`, no animation mixer.

**What to build with.**

- **Fat lines** for outlines, wires and leaders: `LineSegments2` with `LineMaterial` and `LineSegmentsGeometry` from `three/examples/jsm/lines/`. A plain `LineBasicMaterial` is one pixel wide on most GPUs. `LineMaterial`'s width is in logical pixels, so it keeps its relative width at `--scale 2`. Draw a line on by moving each segment's end point along its length per frame (`p = ease((age - from) / (to - from))`), written into the geometry's position buffer.
- **`InstancedMesh`** for anything counted in hundreds: the ground's dots, a building's windows. One draw call; set each instance's matrix and color per frame with `setMatrixAt` and `setColorAt`, then flag `instanceMatrix.needsUpdate` and `instanceColor.needsUpdate`. Set `frustumCulled = false` on instanced and fat-line objects, whose bounds three works out wrongly once you move instances.
- **One directional light with a PCF shadow map**, plus an ambient term. A 4096 map over a tight shadow camera (just the area the story uses), a small negative `bias` and a `normalBias` against acne. One hard key reads as a real place; two lights read as a render.
- **Shadows on a dot ground as dimmed dots**, not a blurred shadow texture: test each dot against the object's footprint cast along the light and mix it toward a shadow color. It keeps the ground in one language.
- **Lambert or Basic materials**, flat colors from the palette. No environment maps, no bloom, no glow, no vignette: those are the template look in 3D.

## The camera model

A shot is five numbers and a lens shift:

```ts
type Shot = { yaw: number; pitch: number; dist: number; tx: number; tz: number; sx: number; sy: number };

const camera = new THREE.PerspectiveCamera(25, W / H, 5, 12000); // a long lens: little distortion
const aim = (s: Shot) => {
  const y = (s.yaw * Math.PI) / 180, p = (s.pitch * Math.PI) / 180;
  camera.position.set(s.tx + s.dist * Math.sin(y) * Math.cos(p), s.dist * Math.sin(p), s.tz + s.dist * Math.cos(y) * Math.cos(p));
  camera.lookAt(s.tx, 0, s.tz);
  camera.setViewOffset(W, H, -s.sx, -s.sy, W, H); // the lens shift, in film px
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
};

const mixShot = (a: Shot, b: Shot, p: number): Shot => ({
  yaw: lerp(a.yaw, b.yaw, p), pitch: lerp(a.pitch, b.pitch, p),
  dist: Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), p)), // distance in log space, as any push (gotcha 63)
  tx: lerp(a.tx, b.tx, p), tz: lerp(a.tz, b.tz, p), sx: lerp(a.sx, b.sx, p), sy: lerp(a.sy, b.sy, p),
});
```

The camera orbits a target point on the ground (`tx`, `tz`) at a yaw, a pitch and a distance. `sx` and `sy` move the picture in the frame without turning the camera, as a shift lens does.

**`project()` and `fit()` make the DOM and the world agree.** Type, cards and the cursor stay in the DOM, where they are sharp and easy to lay out; they have to sit on world points.

```ts
const v = new THREE.Vector3();
/** A world point on screen, in film px, under a shot. */
export const project = (s: Shot, p: [number, number, number]) => {
  aim(s);
  v.set(...p).project(camera);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
};
/** The same shot, shifted so a world point lands on a screen point. */
export const fit = (s: Shot, p: [number, number, number], at: { x: number; y: number }): Shot => {
  const q = project(s, p);
  return { ...s, sx: s.sx + at.x - q.x, sy: s.sy + at.y - q.y };
};
```

Compose each shot by saying where its subject goes on screen: `fit({ yaw: 20, pitch: 30, dist: 520, tx, tz, sx: 0, sy: 0 }, objectBase, { x: 1540, y: 650 })`. A card that points at the object reads `project(shot, objectTop)` each frame for its leader's end.

**Aim at the subject and shift the lens.** A tall object placed near the frame's edge by aiming the camera somewhere else leans: its verticals converge toward the frame's center, and at the edge that reads as a mistake. Aim the camera at the object and move it over with `fit()`; its verticals stay parallel to the frame's edges, as an architectural photographer's shift lens keeps them. The same goes for any tall object beside a column of copy.

**Plan the camera as one timeline.** One function returns the shot at every film frame: holds that drift between two shots, moves between them on the film's camera curve, chained so each move starts where the last ended. Scenes read it; none keeps its own camera. A DOM push over the world (the product panel zooming) and the world's own distance can move at different rates for parallax: divide the world's distance by the DOM zoom raised to a power under 1.

## Tone as a property of the world

The ground color, the dot colors, the light's strength, the edges and the windows form one tone. Keep two or three named tones (a dark one, a mid one, a daylight one, say) and mix between them per frame, channel by channel. A tone change is then a change in the world's light, on a beat, not a cut to a new backdrop. What the tones mean is in `creative-direction.md`, "Tone carries the plot".

Fog the same color as the ground, its near and far set from the shot's distance, so the dot field ends softly at any height.

## Lessons from the first film built this way

- **A canvas under a CSS scale gets resampled.** A Stage's slow push scales its children, and the WebGL bitmap scaled with them went soft. Undo the Stage's scale on the canvas's container and move the world's camera instead (gotcha 92).
- **A layer under the world shows through before its time.** Calendar cells laid under a dark ground showed faintly before the light reached them. Give that layer the same clip as the reveal (gotcha 93).
- **A quarter-size draft of the whole film** (`--scale 0.25`) took 18 seconds for 60 s and is where every transition gets checked first.
- **Objects at their true places.** Put the story's objects where they really are relative to each other (two offices at their real distance, say). A scene that relates them is then a camera move across a real place, not a diagram drawn for the occasion, and the critique's "no shared world" note did not come back.
