# VC Follow (Valenced)

A clean Valenced-format port project for LiFawaz's original VC Follow Revenge plugin.

## Status

This repository currently contains a Valenced-format manifest and a lifecycle scaffold. The old implementation depends on Vendetta-specific internals for voice-state lookup and channel navigation; those imports cannot be copied into Valenced as-is. The actual follow/navigation adapter is not marked complete until its APIs are verified against the current Valenced release.

## Source layout

- `plugins/com.lifawaz.vc-follow/manifest.json` — Valenced plugin manifest
- `plugins/com.lifawaz.vc-follow/js/index.ts` — JS entry point

## Build

This source is laid out for the official [Valenced plugin template](https://github.com/Valenced/valenced-plugin-template). Copy the plugin folder into that template, install its dependencies, and run its plugin build task. A packaged ZIP is not committed yet.

## Compatibility

The port will use supported channel navigation and respect Discord's permission checks. It will not bypass server restrictions or rely on undocumented private APIs.
