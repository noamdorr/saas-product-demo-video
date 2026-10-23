# Music sourcing - choosing a track the grid can hold

When the user has no track, an agent can find one in a quarter of an hour and measure it, so the pick rests on numbers and the license line is on file. Nobody has listened to it at that point; say so in the brief and give the user the runner-up.

## The terms to brief

A track for a beat-cut film has to meet all of these, and the agent should test each one:

- **Tempo in a band.** 120 to 128 BPM for an upbeat product film (14.06 to 15 frames per beat at 30 fps; a backbeat every 0.94 to 1.0 s, which is the shortest comfortable shot). 90 to 110 for a calm one. State the band and accept 2 BPM either side.
- **A steady 4/4 with a clear kick and snare**, so `detect-beats.py` rates the grid `good` and the backbeat split above 0.5. A `check` grid with the snare half unconfirmed is a reason to rank a track lower however good its drop is.
- **Energy from the first bars.** A 20-second near-silent build (cinematic tracks love them) leaves the hook with nothing under it; one 128 BPM candidate was disqualified for a 23 s intro 30 dB under its body. Ask for the level at 0 to 2 s against the 60 s median.
- **A lift or drop inside the window where the film's main reveal falls** (in one 55 s film, 8 to 25 s), and the swells after it, so the reveal and the proof lines have moments to land on.
- **Longer than the film**, so the outro hold can extend into it.
- **A license line** that permits commercial use without attribution, written out with its URL.

## Where

Mixkit's free music works: `https://mixkit.co/free-stock-music/<genre>/` and `/free-stock-music/tag/<tag>/` are server-rendered listing pages with titles, ids and tags; the MP3 is `https://assets.mixkit.co/music/<id>/<id>.mp3`; the license is `https://mixkit.co/license/#musicFree`. The `/discover/<slug>-<id>/` pages and some tag pages are JavaScript-only and come back empty to a fetch, so read the listing pages. Download 8 to 13 candidates: in one run the first ten produced only two `good` grids, and the pick came from the extra three.

## Measure

Two detectors, because they answer different questions:

- `scripts/detect-beats.py <mp3> --fps 30 --out <slug>.beats.json`: the grid, its reliability, the backbeat confidence, the first audible beat, the biggest lift. This is the file the film is cut to.
- A loudness curve per second (ffmpeg `astats` or librosa RMS) and the strongest onsets: where the first drop is, where the swells are inside the film's length, whether the track is loud from bar one, whether it fades inside the film.

The README the agent writes has one row per candidate (file, title, artist, page URL, MP3 URL, license line, duration, BPM, reliability, backbeat confidence, first audible second, drop, swells, loudness shape, mood) and a ranked recommendation with the reasons in the brief's terms, the drop and the swell times of the top pick, and the runner-up.

## Give the hits jobs

Once the track is chosen, list its strongest hits and swells with their beat numbers and give each one a job in the brief before building: the lift carries the main reveal; the hit before it is the cut into the scene that leads to the reveal; two close hits carry a two-step move (the scanline ends on one, the headline lands on the next); the swell carries the number that counts up; the hit at 30 s is the cut into the second act. A cut on `beatFrame(n)` rather than a backbeat is right when the lift sits on a downbeat; say so in a comment.

A grid rated `good` can still say "the tempo is not steady enough for an even grid" (`grid: "as tracked"`). That is fine for cutting as long as every frame comes from the measured arrays; it only means events on consecutive beats are not evenly spaced, by a frame.
