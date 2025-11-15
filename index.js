const axios = require('axios');
const fs = require('fs');
const config = require('./config.json');

const cacheFile = './cache.json';
let cache = [];
if (fs.existsSync(cacheFile)) {
  cache = JSON.parse(fs.readFileSync(cacheFile));
}

function saveCache() {
  fs.writeFileSync(cacheFile, JSON.stringify(cache.slice(-100)));
}

function matchesAnyKeyword(text) {
  return config.keywords.some(keyword => {
    const regex = new RegExp(`${keyword}\\b`, 'i');
    return regex.test(text || '');
  });
}

let currentKeyIndex = 0;

async function fetchLiveStreams() {
  for (let i = 0; i < config.youtubeApiKeys.length; i++) {
    const apiKey = config.youtubeApiKeys[currentKeyIndex];
    const params = {
      part: 'snippet',
      type: 'video',
      eventType: 'live',
      q: config.keywords[0],
      maxResults: 10,
      key: apiKey
    };

    try {
      const res = await axios.get('https://www.googleapis.com/youtube/v3/search', { params });
      console.log(`Using API key ${currentKeyIndex}, fetched ${res.data.items.length} livestreams`);
      return res.data.items || [];
    } catch (err) {
      const reason = err.response?.data?.error?.errors?.[0]?.reason;
      if (reason === 'quotaExceeded') {
        console.warn(`Quota exceeded for key ${currentKeyIndex}, rotating...`);
        currentKeyIndex = (currentKeyIndex + 1) % config.youtubeApiKeys.length;
      } else {
        console.error(`API error: ${reason || err.message}`);
        break;
      }
    }
  }

  console.error('All API keys exhausted or failed.');
  return [];
}

async function postToDiscord(stream) {
  const { channelTitle } = stream.snippet;
  const videoId = stream.id.videoId;
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  const message = `@everyone ${channelTitle} is live! Watch here: ${url}`;  // This is the message that gets sent through webhook edit it as u want
  console.log(`Posting to Discord: ${message}`);
  await axios.post(config.webhookUrl, { content: message });
}

async function run() {
  const liveStreams = await fetchLiveStreams();

  const filtered = liveStreams.filter(item => {
    const { title, description } = item.snippet;
    return matchesAnyKeyword(title) || matchesAnyKeyword(description);
  });

  console.log(`Filtered ${filtered.length} streams with keywords: ${config.keywords.join(', ')}`);

  for (const item of filtered) {
    const videoId = item.id.videoId;
    if (!videoId || cache.includes(videoId)) {
      console.log(`Skipping duplicate or invalid video ID: ${videoId}`);
      continue;
    }

    await postToDiscord(item);
    cache.push(videoId);
  }

  saveCache();
}

setInterval(run, 300_000); // Checks for new live streams every 5 minutes.
