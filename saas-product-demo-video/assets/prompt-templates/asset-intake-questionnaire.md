# Asset intake questionnaire

The structured onboarding message. Ask these in order, in this format. Do not skip questions. Do not reorder. Aspect ratio must be answered first.

---

Before we start building, I need a few things from you. Answer whatever you can in one go - we can iterate on the rest during production. Aspect ratio and duration are non-negotiable upfront.

**1. Aspect ratio** - which one?

- `16:9` horizontal (1920×1080) - LinkedIn posts, YouTube, homepage hero
- `9:16` vertical (1080×1920) - Reels, TikTok, Shorts, paid ads
- `both` - we'll build horizontal as the source of truth and port vertical in parallel

**2. Duration** - how long should this film be?

Recommended: 20-45 seconds. Sweet spot: 28-38 seconds. Shorter loses the arc; longer loses the viewer. What do you want?

**3. Logo** - do you have it as SVG?

SVG preferred for crisp 4K renders. PNG/JPG works but trades some sharpness. If your logo has color detail that matters (a colored icon, a gradient wordmark), flag it so we can render it inline rather than invert for dark backgrounds.

If PNG only, please share the **native dimensions** (right-click in Finder → Get Info, or `file your-logo.png`). I need to make sure scenes don't display it larger than native or it'll pixelate.

If you also have a square brand icon (e.g. for a Chrome extension or favicon at 256x256+), share that separately - it's useful for in-scene UI mockups.

**4. Brand colors** - paste hex codes:

- Primary accent (your "hero" color):
- Dark color (for CTA / finale backgrounds):
- 3-6 supporting pastels (cream, blush, peach, lavender, mint):

If you have a style guide URL or JSON dump, share it and I'll extract. If you have no colors yet, I'll pick temporary ones and we'll refine.

**5. Fonts** - which ones? All must be available via Google Fonts.

Typical sweet spot:
- Display (big headlines): Plus Jakarta Sans / Inter / Outfit / similar at weight 800
- Editorial (serif accents): Roboto Slab / Merriweather / other serif
- UI (small text, buttons): Inter at 400/500/600/700

If your brand uses a non-Google font, that adds complexity (manual loading in `Root.tsx`). Share the font name + source if so.

**6. Copy / script** - what's the film saying?

Share your draft. Or the homepage hero line you want to lean on. Or let me draft one from your product's narrative arc (hook → pivot → proof → close). Whichever's faster.

**7. Voiceover** - yes or no?

If yes: share the audio file. Note that VO drives pacing and overrides beat-sync - scenes follow the narration instead of the music grid. The soundtrack becomes atmospheric rather than structural.

If no: default is silent + soundtrack. This is the sweet spot for social platforms where most viewers scroll sound-off for the first 3 seconds.

**8. Soundtrack** - required for beat-sync.

Share the file, or let me pick from royalty-free stock. Requirements:

- Clear consistent BPM (120 BPM is default; 90/100/140/150 all work).
- Distinguishable kick and snare.
- Length ≥ target video duration + 2 seconds (for the fade-out tail).

**9. Reference videos** - the vibe layer.

Share 2-3 YouTube links of videos whose vibe you want. I'll produce a Gemini-style director's breakdown of each, then synthesize the motion vocabulary, pacing, and signature moves into your film's spec doc.

If you don't have any in mind, I can offer a starter set:

- Anthropic Claude Design launch (spatial 16:9, continuous camera, hero crops)
- OpenAI GPT-5 sizzle (bold kinetic typography, ink portals, mesh gradients)
- Linear marketing reels (B2B calm confidence, pastel, clean type)

Pick one or two you resonate with.

---

Once you answer 1, 2, and 8 plus give me at least one reference video, I can start Phase 3 (beat-sync). We'll iterate on the rest during production.
