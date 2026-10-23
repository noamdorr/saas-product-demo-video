// Root - registers the master composition and one debug composition per scene.

import { loadFont as loadUi } from "@remotion/google-fonts/Inter";
import { loadFont as loadDisplay } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadEditorial } from "@remotion/google-fonts/RobotoSlab";
import { Composition } from "remotion";
import { Master } from "./Master";
import { ExampleScene } from "./scenes/ExampleScene";
import { canvas } from "./theme";
import { FPS, SCENES, TOTAL_FRAMES } from "./timing";

// Placeholder fonts: load the brand's families here and name them in theme.ts.
// Naming the weights and the "latin" subset keeps this to a few requests; left
// out, every weight of every subset is fetched and the render can time out.
loadDisplay("normal", { weights: ["600", "700", "800"], subsets: ["latin"] });
loadUi("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
// Roboto Slab ships no italic. Load "normal" and set fontStyle: "italic" where it is used.
loadEditorial("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Master"
      component={Master}
      defaultProps={{ sfx: true }}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={canvas.width}
      height={canvas.height}
    />
    {/* The same film with the music only: render both and the sound effects
        can be judged by ear (references/sound-effects.md). */}
    <Composition
      id="Master-NoSfx"
      component={Master}
      defaultProps={{ sfx: false }}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={canvas.width}
      height={canvas.height}
    />

    {/* One debug composition per scene, so a scene renders alone in seconds.
        IDs take letters, digits and hyphens only: an underscore is rejected at render time. */}
    <Composition
      id="Scene-Example"
      component={ExampleScene}
      durationInFrames={SCENES.example.duration}
      fps={FPS}
      width={canvas.width}
      height={canvas.height}
    />
  </>
);
