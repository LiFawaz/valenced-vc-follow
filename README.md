# VC Follow

A simple plugin for Valenced that follows someone between Discord voice channels, so you don't have to keep chasing them manually.

## Install

Current version: **1.0.19**.

1. Open Valenced and add this plugin repository:

   `https://raw.githubusercontent.com/LiFawaz/valenced-vc-follow/main/index.json`

2. Find **VC Follow**, install it, and enable it.
3. Open the plugin settings and enter the Discord user ID you want to follow.
4. Hit **Save and Follow**.

That's it. Your target ID is saved, so you shouldn't need to enter it again every time.

## How to use it

You can manage following from the plugin settings, or use the commands:

- `/vcf user_id:USER_ID` — start following a user.
- `/unvcf` — stop following.

Use the person's Discord **user ID**, not their display name or username.

## Commands

- `/vcf user_id:USER_ID` — start following a user.
- `/unvcf` — stop following.

The Configure screen uses Valenced's actual React and React Native module exports, with plugin-API fallbacks.

## What it does

- Tries to join the voice channel the person is currently in.
- Keeps checking if they're in a full channel and retries when a spot may be available.
- Notices when they move to another voice channel and follows their new channel.
- Shows a status message so you can tell what it's doing.

## About the status

The status should reflect what VC Follow is doing right now. For example, it may say it's joining, waiting for a spot, waiting for the person to join voice, or connected.

A join attempt doesn't mean you've successfully joined. VC Follow treats it as connected only after Discord reports that you're in the same voice channel.

If the status looks stuck or doesn't match what's happening in Discord, try disabling and re-enabling the plugin. If it keeps happening, report the status message along with what the followed user was doing.

## A few things to know

- VC Follow can only join channels your account is allowed to access.
- It can't bypass **Connect** permissions, server restrictions, or channel user limits.
- If you manually disconnect, following pauses without pulling you back. Once you manually join another voice channel, following resumes and moves you to the target's current channel.
- If someone else disconnects or kicks you from voice, VC Follow keeps following and attempts to rejoin the target's current voice channel.

## Repository

Source code and updates are available here:

https://github.com/LiFawaz/valenced-vc-follow

## Follow and disconnect behavior (1.0.19)

- Saving a user or running `/vcf user_id:USER_ID` immediately attempts to join their current voice channel and retries briefly while Discord's voice state updates.
- Manually disconnecting pauses following; the plugin watches `selectVoiceChannel(null)` actions across matching action modules so a normal self-disconnect is not treated as a kick. Following stays enabled, and once you manually join another voice channel, it resumes and moves you to the target's current channel.
- Status text reports the paused state and whether a join is being attempted or has completed.
