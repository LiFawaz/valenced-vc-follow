# VC Follow

A Valenced plugin that follows a Discord user between voice channels.

## Install

Add this repository URL in Valenced's plugin repository settings:

```
https://raw.githubusercontent.com/LiFawaz/valenced-vc-follow/main/index.json
```

Find **VC Follow**, install it, and enable it. Opening the URL in a browser only displays repository data.

## Configure

Open VC Follow's settings to enter a Discord user ID, follow or unfollow them, view the current follow status, and check recent plugin logs.

## Slash commands

- `/vcf user_id:USER_ID` — follow a user.
- `/unvcf` — stop following.

These commands remain available alongside the settings page. Your configured user ID is saved.

## Notes

- Follows by Discord user ID, including across servers.
- You still need access and permission to join the destination voice channel.
