# YouTube-to-Discord-Webhook
This Node.js bot polls YouTube for livestreams matching specific keywords and posts them to a Discord webhook.

## Features

- ✅ Supports multiple keywords
- ✅ Rotates YouTube API keys on quota exhaustion
- ✅ Caches posted streams to avoid duplicates

## Setup

1. Clone this repo
2. Run `npm install`
3. Copy `config.json.example` to `config.json` and fill in your:
   - YouTube API keys
   - Discord webhook URL
   - Keywords to match
4. Start the bot:

```bash
npm start
