// Sfx - one short sound, placed so its loudest point lands on a visual event.
//
// Every sound file has a lead-in before its loudest point. Starting the file
// on the event's frame makes the sound land late, so this starts it early by
// that lead. See references/sound-effects.md for when a sound earns its place.

import React from "react";
import { Audio } from "@remotion/media";
import { Sequence, useVideoConfig } from "remotion";

// Interface sounds from Remotion's library (remotion.dev/docs/sfx), with the
// time from the start of each file to its loudest point, in seconds.
// Leads measured on the published files on 2026-10-03. All five are listed
// there as Creative Commons 0. The library's "ding" is left out on purpose:
// its page says it is not explicitly released under a free license.
export const SOUNDS = {
  whip: { src: "https://remotion.media/whip.wav", lead: 0.03 },
  whoosh: { src: "https://remotion.media/whoosh.wav", lead: 0.07 },
  uiSwitch: { src: "https://remotion.media/switch.wav", lead: 0.13 },
  pageTurn: { src: "https://remotion.media/page-turn.wav", lead: 0.16 },
  mouseClick: { src: "https://remotion.media/mouse-click.wav", lead: 0.22 },
} as const;

export interface SfxProps {
  /** Frame of the visual event: the same value the visual uses, from timing.ts. */
  at: number;
  /** One of the built-in sounds. */
  sound?: keyof typeof SOUNDS;
  /** Your own file instead: staticFile("sfx/my-sound.wav") or a URL. Pass `lead` with it. */
  src?: string;
  /** Seconds from the start of the file to its loudest point. Defaults to the built-in sound's. */
  lead?: number;
  volume?: number;
}

export const Sfx: React.FC<SfxProps> = ({ at, sound, src, lead, volume = 0.4 }) => {
  const { fps } = useVideoConfig();
  const builtIn = sound ? SOUNDS[sound] : undefined;
  const file = src ?? builtIn?.src;
  if (!file) {
    throw new Error("[Sfx] pass either `sound` or `src`.");
  }
  const leadFrames = Math.round((lead ?? builtIn?.lead ?? 0) * fps);
  // If the event comes sooner than the lead-in is long, start at frame 0 and
  // skip the part of the file that does not fit, so the peak still lands on time.
  const from = Math.max(0, at - leadFrames);
  const skipped = leadFrames - (at - from);

  return (
    <Sequence from={from} layout="none">
      <Audio src={file} volume={volume} trimBefore={skipped} />
    </Sequence>
  );
};
