# VC Follow

VC Follow is a plugin for Valenced that keeps your Discord voice connection following a selected user. When that person moves to another voice channel, the plugin detects the change and asks Discord to move you to the same channel.

## What it does

- **Follows a user between voice channels.** Start following with `/vcf user_id:<Discord user ID>`. If the person is not in voice when you start, VC Follow waits for their next voice update.
- **Works across servers you can access.** It follows the person's voice-channel changes by their Discord user ID, not just by the server where you first selected them. If they move to a voice channel in another server, VC Follow can request to join that channel too.
- **Offers a quick stop command.** Run `/unvcf` to stop following.
- **Adds profile-menu actions where supported.** If your Valenced/Discord build exposes a compatible user context menu, you may see **Follow VC** or **Stop following VC** there.
- **Reports join problems.** If Discord refuses a join request, the plugin logs the issue and may retry while you are still following.

### What “cross-server” means

You do not need to start following the person again just because they switch to a different server's voice channel. However, cross-server following does **not** bypass Discord's access or permission rules. You must already be able to access the destination server and join its voice channel. VC Follow cannot join a server for you, bypass a private channel, override a full channel, or grant missing permissions.

## Install in Valenced

Repository URL:

```
https://raw.githubusercontent.com/LiFawaz/valenced-vc-follow/main/index.json
```

1. Open Valenced and go to its **plugin repositories** or **plugin settings**.
2. Choose the option to add a repository.
3. Copy the URL above and paste it into the repository URL field. Make sure you copy the entire address, including `https://`.
4. Save/add the repository, then refresh the repository list if needed.
5. Find **VC Follow** in the repository's plugin list.
6. Install or update to the latest listed version, then enable the plugin.
7. If Valenced asks you to restart or reload for plugins to take effect, do that before testing.

The repository index currently points to version `1.0.1`. The version shown inside Valenced is the one to use if a newer release is published later.

## If you opened the link in Chrome or another browser

That is normal: the URL above is a **repository index**, not a webpage or a Chrome extension. In Chrome, Edge, Firefox, or another browser, it may display raw JSON text. You do not install VC Follow by pressing a button on that page.

Instead:

1. Open the link in your browser if you want to check that it is reachable.
2. Copy the full URL from the address bar.
3. Open **Valenced**, then its plugin repository settings.
4. Add the copied URL there and follow the installation steps above.

VC Follow is made for Valenced. It does not install as a standalone Chrome extension and cannot be added directly to an arbitrary website. A website would need its own compatible integration; simply visiting the repository link will not add the plugin to that site.

## How to use it

### Option 1: Follow using a Discord user ID

1. In Discord, enable **Developer Mode** in **User Settings → Advanced**.
2. Open the target user's profile or context menu and choose **Copy User ID**.
3. In Valenced/Discord, run:

   ```
   /vcf user_id:123456789012345678
   ```

   Replace the example number with the actual ID. Do not include the person's display name or an invite link; the command expects their numeric Discord user ID.

4. VC Follow will start tracking that user. If they are already in a voice channel you can join, it will request to join. Otherwise, it waits for a voice-channel update.

To stop, run:

```
/unvcf
```

### Option 2: Use the profile menu

If the current Valenced/Discord build supports the plugin's context-menu integration, open the person's profile or user context menu and select **Follow VC**. Use **Stop following VC** to end following. If these menu items do not appear, use the `/vcf` and `/unvcf` commands instead.

## Troubleshooting

- **The commands do not appear:** Check that VC Follow is installed and enabled, then reload/restart Valenced if needed.
- **The target is not followed immediately:** They may not be in a voice channel yet, or Valenced may not have received their voice-state update. The plugin waits for a later update.
- **It will not join the destination channel:** Confirm you have joined the destination server and have permission to connect. The channel may be full or restricted.
- **The profile-menu option is missing:** Context-menu integration depends on the Discord/Valenced build. Try the commands instead.
- **It still does not work:** Check Valenced's developer console/logs for messages prefixed with `[vc-follow]`. Those messages can help identify whether the plugin started, detected the target, or failed to request a voice-channel change.

## Repository and release files

- `index.json` — repository index used by Valenced.
- `plugins/com.lifawaz.vc-follow/manifest.json` — plugin metadata and dependencies.
- `plugins/com.lifawaz.vc-follow/js/index.js` — plugin source.
- `pool/com.lifawaz.vc-follow@1.0.1.zip` — current install package.

VC Follow uses Valenced's plugin API and Discord's existing voice/channel permissions. It does not bypass Discord restrictions.
