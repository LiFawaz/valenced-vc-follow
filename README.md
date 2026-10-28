# VC Follow

A Valenced plugin that follows a Discord user between voice channels.

## Install

Add this repository URL in Valenced's plugin repository settings:

```
https://raw.githubusercontent.com/LiFawaz/valenced-vc-follow/main/index.json
```

Then find **VC Follow**, install it, and enable it. Opening the URL in a browser only shows the repository data; it does not install the plugin.

## Use

1. Enable Developer Mode in Discord and copy the user's ID.
2. Run `/vcf user_id:USER_ID`.
3. Run `/unvcf` to stop following.

Profile-menu options may also appear in supported builds.

## Notes

- Follows the user by Discord ID, including across servers.
- You must have access to the destination server and permission to join its voice channel. This plugin does not bypass Discord restrictions.
- If it fails, check Valenced logs for `[vc-follow]`.
