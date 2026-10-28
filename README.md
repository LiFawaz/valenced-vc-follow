# VC Follow

A simple plugin for Valenced that follows someone between Discord voice channels, so you don't have to keep chasing them manually.

## Install

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
- If you leave voice yourself, you may need to join a voice channel again for following to resume.

## Repository

Source code and updates are available here:

https://github.com/LiFawaz/valenced-vc-follow
