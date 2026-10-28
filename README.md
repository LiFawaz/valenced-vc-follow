# VC Follow for Valenced

A Valenced plugin that adds **Follow VC** to supported Discord user profile/context menus and registers the `/vcf` and `/unvcf` commands.

## Install from this repository

1. Open Valenced's plugin repository settings.
2. Add this repository index URL:

   `https://raw.githubusercontent.com/LiFawaz/valenced-vc-follow/main/index.json`

3. Find **VC Follow** and install version `1.0.0`.

The repository index points to the plugin bundle built with the official Valenced plugin CLI in `pool/com.lifawaz.vc-follow@1.0.0.zip` and includes its SHA-256 digest for integrity verification.

## Use

- Use `/vcf user_id:<Discord user ID>` to follow a user.
- Use `/unvcf` to stop following.
- Where Valenced exposes the supported user context-menu exports, use **Follow VC** / **Stop following VC** from the user's profile/context menu.
- The plugin checks connection permission before requesting a channel join and reports when Discord rejects a join request. It does not bypass Discord permissions or server restrictions.

## Source and packaging

- `plugins/com.lifawaz.vc-follow/manifest.json` — plugin manifest
- `plugins/com.lifawaz.vc-follow/js/index.js` — JavaScript package source
- `pool/com.lifawaz.vc-follow@1.0.0.zip` — installable artifact
- `index.json` — Valenced repository index

The GitHub Actions workflow extracts the uploaded nested ZIP, checks the manifest and JavaScript syntax, creates the installable ZIP, calculates its SHA-256 digest, and regenerates `index.json`.

## Validation notes

The workflow validates package structure, required dependencies, the artifact's embedded manifest, and JavaScript syntax. A syntax/package check cannot guarantee runtime compatibility across every Valenced/Discord release; after installing, test following and stopping in a test server and review the `[vc-follow]` console messages if the host API has changed.
