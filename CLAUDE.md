# Focus Feed — Claude Code Context

## What this is
A distraction-free YouTube viewer. Shows recent videos from an approved channel 
allowlist only. Deliberately removes YouTube's recommendation engine, autoplay, 
and attention-grabbing UI. Built for intentional watching, not passive scrolling.

## Owner context
Non-developer background (Technical Business Analyst). Comfortable with SQL and 
logic (Oracle at work), minimal Python. Explain code changes clearly and flag 
anything that requires manual steps (terminal commands, Netlify dashboard actions, 
Supabase dashboard actions, etc).

## Stack
- **Frontend**: Vanilla HTML/CSS/JS, single file at `public/index.html`
- **Backend**: Netlify serverless functions at `netlify/functions/`
- **Auth + Database**: Supabase (Postgres) — see data model below
- **Hosting**: Netlify, auto-deploy from GitHub (push → live in ~30s)
- **API**: YouTube Data API v3 (Google Cloud)
- **Fonts**: DM Sans + DM Mono (Google Fonts)

## Repo structure

focus-feed/
├── netlify/functions/
│   └── youtube.js          ← YouTube API proxy
├── public/index.html       ← entire frontend
└── netlify.toml            ← build config

## Data model (Supabase / Postgres)

### `users`
| column | type | notes |
|---|---|---|
| id | uuid | primary key, auto-generated |
| email | text | unique |
| created_at | timestamp | |

### `channels` *(master approved list — admin-managed via Supabase dashboard)*
| column | type | notes |
|---|---|---|
| id | text | YouTube channel ID |
| name | text | display name |
| color | text | hex color |
| category | text | e.g. 'science', 'sport', 'film' |
| title_filters | text[] | nullable — e.g. ['highlights', 'premier league'] |
| max_results | integer | nullable — falls back to app default (6) if null |
| active | boolean | soft-disable without deleting |

### `user_channels` *(which channels each user follows)*
| column | type | notes |
|---|---|---|
| user_id | uuid | foreign key → users |
| channel_id | text | foreign key → channels |
| followed_at | timestamp | |

### `watched_videos`
| column | type | notes |
|---|---|---|
| user_id | uuid | foreign key → users |
| video_id | text | YouTube video ID |
| watched_at | timestamp | |

### `saved_videos`
| column | type | notes |
|---|---|---|
| user_id | uuid | foreign key → users |
| video_id | text | YouTube video ID |
| saved_at | timestamp | |

### `channel_requests`
| column | type | notes |
|---|---|---|
| id | uuid | primary key |
| user_id | uuid | foreign key → users |
| channel_url | text | what the user submitted |
| note | text | optional — why they want it |
| status | text | 'pending', 'approved', 'rejected' |
| created_at | timestamp | |

## Key architecture decisions
- YouTube API key lives in Netlify environment variables (`YOUTUBE_API_KEY`), never in code
- Supabase credentials live in Netlify environment variables, never in code
- All YouTube API calls proxied through `youtube.js` — frontend never calls YouTube directly
- Channel names stored directly on each video object at fetch time (fixes a previous Promise.allSettled scoping bug)
- Shorts filtered server-side in `youtube.js` by duration < 150 seconds
- 60-minute localStorage cache with manual refresh
- Watched state will move to Supabase (currently localStorage — device-local)
- Master channels list managed via Supabase dashboard (no admin UI planned yet)
- Admin UI deferred — add only if manual dashboard management becomes painful

## YouTube API — quota rules (IMPORTANT)
Default quota is 10,000 units/day, resets every 24 hours.

| Endpoint       | Cost       | Usage                        |
|----------------|------------|------------------------------|
| channels       | 1 unit     | Get upload playlist ID + name |
| playlistItems  | 1 unit     | Get recent video IDs         |
| videos         | 1 unit     | Get duration + details       |
| search         | 100 units  | Focused Search (user-triggered only) |

Always prefer the uploads playlist approach over search for background fetching.
Never use the search endpoint for anything automatic or cached — only on explicit user action.

## Current features
- Feed of recent videos from approved channels (currently hardcoded CHANNELS array — to be migrated to Supabase)
- Filter by channel, watched/unwatched
- Mark as watched (auto after 10s delay, or manual)
- Inline modal player (no YouTube redirect)
- Focused Search: searches only within approved channels, returns 3 results max
- YouTube Shorts filtered out automatically
- Title keyword filtering per channel (e.g. 'highlights' for sport channels)

## Roadmap
### Phase 1 — Supabase setup + auth
- Create Supabase project, set up tables per data model above
- Add email/password auth (via Supabase Auth)
- Login/logout flow in the frontend

### Phase 2 — Move watched state to Supabase
- Biggest immediate win: cross-device sync
- Replace localStorage watched state with Supabase reads/writes

### Phase 3 — Per-user channel selection
- Migrate hardcoded CHANNELS array to Supabase `channels` table
- Onboarding flow: new user picks channels from master list by category
- User can follow/unfollow channels from their feed

### Phase 4 — Channel requests
- Simple form for users to submit a channel URL + optional note
- Requests land in `channel_requests` table
- Admin reviews via Supabase dashboard and updates status

## Design system
Dark theme. CSS variables defined in `:root`. Key vars:
`--bg`, `--surface`, `--surface2`, `--border`, `--border2`,
`--text`, `--text2`, `--text3`, `--red`, `--radius`, `--radius-sm`

Keep all new UI consistent with existing card/pill/modal patterns.

## Things to avoid
- Don't use the search endpoint for anything automatic or periodic
- Don't add YouTube recommendations, related videos, or anything algorithmic
- Don't open YouTube in a new tab — everything plays in the modal
- Don't break the uploads playlist approach (it's quota-efficient by design)
- Don't store sensitive credentials in code — always use environment variables