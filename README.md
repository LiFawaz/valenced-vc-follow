# VC Follow

A small Valenced plugin that keeps up with someone in Discord voice chat.

## Install

Add this repo in Valenced:

```
https://raw.githubusercontent.com/LiFawaz/valenced-vc-follow/main/index.json
```

Then find **VC Follow**, install it, and turn it on. The link is the plugin repo index, not a download page.

## Set it up

Open the plugin settings and paste the person's Discord user ID, then press **Save and Follow**. The ID is saved, so you don't have to paste it every time.

You can also use these commands:

- `/vcf user_id:USER_ID` starts following that user.
- `/unvcf` stops following.

It works across servers as long as Discord lets your account join the channel.

## What the status means

The status tells you what the plugin is currently trying to do: checking the target's channel, asking Discord to join, waiting for a free spot, or waiting because you don't have Connect permission. A join request isn't treated as successful until Discord reports that you're in the target channel.

If you disconnect yourself, following pauses. Join any voice channel to resume it.

## A couple of limits

The plugin can't bypass channel permissions, server restrictions, or full-channel limits. If access or capacity changes, it checks again and tries when it can.
