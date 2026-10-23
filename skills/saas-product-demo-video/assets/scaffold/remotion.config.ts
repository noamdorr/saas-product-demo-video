// Every option here can also be passed as a CLI flag: https://remotion.dev/docs/config

import { Config } from "@remotion/cli/config";

Config.setEntryPoint("./src/index.ts");
// PNG intermediates are lossless; JPEG ones band on flat pastel backgrounds.
Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
// Concurrency is left at Remotion's default on purpose: a fixed number fails on a
// machine with fewer cores. Pass --concurrency on the command line when you tune a render.
