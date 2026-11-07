# Gzowo StarNet

Every Gzowo Labs project hangs in one net. A visitor taps the projects they already know and like, optionally says how old they are, who they play with, what they are in the mood for, how much time and which gear they have, and every project that does not fit drops out of the net live. What is left is ranked, with a reason on every card.

Live: https://starnet.gzowo.fun (once deployed)

## How it works

- **Projects come straight from gzowo.fun.** The page fetches `https://gzowo.fun/data/projects.json` on every visit, so a project added, renamed, hidden or re-linked there shows up here with no extra step. `data/projects.snapshot.json` is only a fallback.
- **Tags.** `data/tags.json` holds hand-made tags for every project: how hard it is to understand, polish, age range, scariness, violence, players, online / couch / solo, device, phone support, required and optional gear, session length, eight moods and features, plus a Polish blurb. A project without hand-made tags gets tags from Claude Haiku within an hour (worker cron, calibrated on hand-made examples), and a keyword heuristic until then.
- **Scoring** (`engine.js`): content similarity between projects (moods weighted by rarity, features by IDF, social format, category), the closest liked project, a taste vector, turned-down projects, hard age cut-offs for scary or violent things, a target difficulty from age and from the likes (lots of simple likes means simple picks), polish, device and gear fit, session length and the learned signals below. Each new answer shrinks the net by about a third, and every card explains why it stayed or why it dropped out.
- **Learning.** Likes, turn-downs and Play clicks are stored anonymously (random session id, daily salted IP hash for rate limits, no names). Every hour the worker turns them into play counts, "people who like X play Y" co-occurrence and context counts by age band, mood, company and device. The engine blends them in slowly: their weight grows with the number of sessions and only reaches full strength at 400.
- **Thumbnails.** `thumbs/` holds 192 px crops of the gzowo.fun screenshots, with source sizes in `data/thumbs.json`. The worker checks the live image sizes, so when a screenshot changes or a new project appears, the browser makes the thumbnail itself from the full image.

## Files

- `index.html`, `app.js`: the page, the net physics and the panel.
- `engine.js`: model, scoring and reasons, shared by the page and the tests.
- `worker/`: Cloudflare Worker `gzowo-starnet` with D1 (`/data`, `/event`, `/admin/run`, hourly cron).

## Local

```bash
python3 -m http.server 8642 --directory .
cd worker && npx wrangler@4.156.2 dev --port 8788
```

On localhost the page talks to the local worker on port 8788.

## Deploy

1. `cd worker && npx wrangler d1 create gzowo-starnet`, put the id in `wrangler.toml`, then `npx wrangler d1 execute gzowo-starnet --remote --file schema.sql`.
2. Secrets: `ANTHROPIC_API_KEY` and `ADMIN_KEY` with `npx wrangler secret put`, then `npx wrangler deploy`.
3. GitHub Pages from `main` with the `CNAME` for `starnet.gzowo.fun`.
