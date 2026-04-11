# Focus Feed — Claude Code Context

## What this is
A distraction-free YouTube viewer. Shows recent videos from an approved channel 
allowlist only. Deliberately removes YouTube's recommendation engine, autoplay, 
and attention-grabbing UI. Built for intentional watching, not passive scrolling.

## Owner context
Non-developer background (Technical Business Analyst). Comfortable with SQL and 
logic, minimal Python. Explain code changes clearly and flag anything that requires 
manual steps (terminal commands, Netlify dashboard actions, etc).

## Stack
- **Frontend**: Vanilla HTML/CSS/JS, single file at `public/index.html`
- **Backend**: Netlify serverless function at `netlify/functions/youtube.js`
- **Hosting**: Netlify, auto-deploy from GitHub (push → live in ~30s)
- **API**: YouTube Data API v3
- **Fonts**: DM Sans + DM Mono (Google Fonts)

## Repo structure
focus-feed/
├── netlify/functions/youtube.js   ← API proxy
├── public/index.html              ← entire frontend
└── netlify.toml                   ← build config

## YouTube API — quota rules (IMPORTANT)
Default quota is 10,000 units/day, resets every 24 hours.

| Endpoint       | Cost       | Usage                        |
|----------------|------------|------------------------------|
| channels       | 1 unit     | Get upload playlist ID + name |
| playlistItems  | 1 unit     | Get recent video IDs         |
| videos         | 1 unit     | Get duration + details       |
| search         | 100 units  | Focused Search (user-triggered only) |

Always prefer the uploads playlist approach over search for background fetching. 
Never use the search endpoint for anything automatic or cached — only on explicit 
user action.

## Key architecture decisions
- API key lives in Netlify environment variables (`YOUTUBE_API_KEY`), never in code
- All YouTube API calls are proxied through `youtube.js` — frontend never calls 
  YouTube directly
- Channel names are stored directly on each video object at fetch time (not looked 
  up later) — this is intentional, fixes a previous Promise.allSettled scoping bug
- Shorts are filtered server-side in `youtube.js` by duration < 150 seconds
- 60-minute localStorage cache with manual refresh
- Watched state persists via localStorage (device-local for now)

## Current features
- Feed of recent videos from approved channels (CHANNELS array in index.html)
- Filter by channel, watched/unwatched
- Mark as watched (auto after 10s delay, or manual)
- Inline modal player (no YouTube redirect)
- Focused Search: searches only within approved channels, returns 3 results max
- YouTube Shorts filtered out automatically

## Design system
Dark theme. CSS variables defined in `:root`. Key vars:
`--bg`, `--surface`, `--surface2`, `--border`, `--border2`, 
`--text`, `--text2`, `--text3`, `--red`, `--radius`, `--radius-sm`

Keep all new UI consistent with existing card/pill/modal patterns.

## Roadmap (not yet built)
- Onboarding flow with curated default channels by category
- Cross-device watched state (requires server-side storage)
- Multi-user support with per-user channel lists
- Weekly "lucky dip" from a human-curated extended channel list

## Things to avoid
- Don't use the search endpoint for anything automatic or periodic
- Don't add YouTube recommendations, related videos, or anything algorithmic
- Don't open YouTube in a new tab — everything plays in the modal
- Don't break the uploads playlist approach (it's quota-efficient by design)