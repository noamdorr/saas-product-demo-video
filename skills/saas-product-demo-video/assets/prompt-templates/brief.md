# Brief template

Save as `docs/video/brief.md` in the user's project. Keep everything except the assumptions list to about a page; the assumptions can run as long as they need to, grouped under a few headings. It records what the film is built from so that you, a later session, or a sub-agent can build any scene from this file plus the timing file. The user approves the rendered first scene, not this document.

---

# `<name>` - brief

## Inputs

- **Format:** 16:9 (1920x1080) [and 9:16 (1080x1920)], about Ns
- **Logo:** `public/logo.svg` [native size if raster]
- **Colors:** accent `#xxxxxx`, dark `#xxxxxx`, backgrounds `#xxxxxx` `#xxxxxx` `#xxxxxx`
- **Fonts:** display `<family weight>`, body `<family weights>`, UI `<family weights>`
- **Soundtrack:** `public/soundtrack.mp3`, N BPM, Ns, grid reliability `<good, check or poor, from detect-beats>`
- **Beat sync:** yes, cuts on the backbeat. [Or: no, cuts placed by time, and why. Say this plainly, because the user will otherwise assume the cuts follow the music.]
- **References:** `references/<slug>.md`, `references/<slug>.md`

## Look

One paragraph, written the way a director would brief another: pace, color behavior, how type moves.

- **Transitions in use:** push-through (scene 1 to 2), match-cut zoom (3 to 4), hard cut elsewhere
- **Signature moves (two or three at most, because each extra one dilutes the others):** `<move>` in scene N
- **Pacing:** average shot about Ns; `<fast, medium, fast, slow>`

## Script and scenes

Scenes are placed by beat number; the timing file turns beats into frames. Write "backbeat n" for a cut, as `backbeatFrame(n)` counts it, and "beat n" for an event inside a scene, as `beatFrame(n)` counts it. The two count differently, so keep the word next to the number. In a film that is not beat-synced, use times in seconds.

| # | Ends on | On screen (exact words) | What moves | Transition out |
|---|---|---|---|---|
| 1 | backbeat 4 (about 4.0s) | "..." | headline rises on beat 2 (the film's text move); the field behind it is there on the cut | push-through |
| 2 | backbeat 6 (about 6.0s) | "..." | card lands on beat 9, cursor clicks "View" on beat 11 | hard cut |

## Product UI shown

One line per card or screen: the one idea it has to get across, the few words it carries (15 to 30 is plenty), real screenshot or rebuilt in code, and any names or numbers that must be fictional.

## Assumptions

Every choice you made without the user, one line each, so it is easy to veto at the checkpoint.

- Picked `<track>` because none was supplied.
- Trimmed the tagline to fit one line at this type size.
- Sounds: `<event>`: `<file>` (`<source, license>`), level `<dB against the music>`; or "none". Rendered `Master` and `Master-NoSfx` for the user to compare.

## Open questions

Only what the user must decide. Leave this out if there is nothing.
