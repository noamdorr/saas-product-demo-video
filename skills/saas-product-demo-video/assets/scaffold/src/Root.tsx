// Root - registers the master composition and one debug composition per scene.

import { loadFont as loadUi } from "@remotion/google-fonts/Inter";
import { loadFont as loadDisplay } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadEditorial } from "@remotion/google-fonts/RobotoSlab";
import { Composition } from "remotion";
import { Master } from "./Master";
import { ExampleScene } from "./scenes/ExampleScene";
import { SubClock } from "./SubClock";
import { canvas } from "./theme";
import { FPS, SCENES, TOTAL_FRAMES } from "./timing";

// Placeholder fonts: load the brand's families here and name them in theme.ts.
// Naming the weights and the "latin" subset keeps this to a few requests; left
// out, every weight of every subset is fetched and the render can time out.
loadDisplay("normal", { weights: ["600", "700", "800"], subsets: ["latin"] });
loadUi("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
// Roboto Slab ships no italic. Load "normal" and set fontStyle: "italic" where it is used.
loadEditorial("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });

/** The film with no sound, on the shutter's clock. tools/mb renders this for real motion blur. */
const MasterSub: React.FC<{ times: number[] | null }> = ({ times }) => (
  <SubClock times={times}>
    <Master sfx={false} music={false} />
  </SubClock>
);

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
    {/* Real motion blur: frame i is the film at times[i], which may fall between
        frames. tools/mb renders it; references/render-export.md has the commands.
        Remotion clamps the clock to a composition's length, so with `times` it has to
        reach past the film's last frame however few samples a chunk holds (gotchas.md 82). */}
    <Composition
      id="Master-Sub"
      component={MasterSub}
      defaultProps={{ times: null as number[] | null }}
      calculateMetadata={({ props }) => ({
        durationInFrames: props.times ? Math.max(TOTAL_FRAMES + 1, props.times.length) : TOTAL_FRAMES,
      })}
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
