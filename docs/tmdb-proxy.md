# TMDB proxy audit

The API remains server-side at `api/tmdb.js`, reached through the existing
`/tmdb/:path*` rewrite. Set `TMDB_API_KEY` in Vercel's environment; never use a
`VITE_` prefix for this secret. Image traffic uses the separate `/tmdb-img/`
rewrite and its existing immutable cache.

## Endpoint inventory

Derived from every request builder in `src/lib/catalog.js`,
`src/lib/episodes.js`, and `src/lib/tmdb.js`, and their route/component callers.
Paths below are relative to `/tmdb`.

| Paths | Consumers |
| --- | --- |
| `/trending/all/week` | Home reel and Search spines/landing |
| `/discover/movie`, `/discover/tv` | Home shelves, Search filters, studio/network/keyword browsing, keyword universes |
| `/movie/now_playing` | Home cinemas shelf |
| `/search/multi` | Search and connected TV title matching |
| `/find/{tt or nm IMDb ID}` | Pasted IMDb links/IDs in Search |
| `/genre/{movie or tv}/list` | Search genre filters |
| `/watch/providers/{movie or tv}` | Streaming service picker and selected-service toolbar logos |
| `/watch/providers/regions` | Region picker |
| `/{movie or tv}/{id}` | Title detail/prefetch; basic details for saved TV episode dates and connected-title verification |
| `/{movie or tv}/{id}/watch/providers` | Visible title cards and active reel caption |
| `/movie/{id}/release_dates` | Release badges for recent movies without streaming availability |
| `/{movie or tv}/{id}/images` | Disc/title logos |
| `/tv/{id}/season/{number}` | Expanded seasons; season 0 (specials) is supported |
| `/tv/{id}/season/{number}/episode/{number}` | Episode sheet |
| `/tv/episode_group/{group ID}` | Anime/long-season episode guides and ratings |
| `/collection/{id}` | Connected movies and collection universes |
| `/person/{id}` | Person pages |
| `/{company or network or keyword}/{id}` | Entity browse page metadata |
| `/configuration` | Explicit connection recovery only |

`trending()` always requests `/trending/all/week`, matching the proxy allowlist.
No current caller requests `day` or `similar`, so those endpoints are rejected.

Existing appended resources are preserved, with endpoint-specific validation:

- Movie: `credits,release_dates,watch/providers,videos,recommendations,images,keywords,external_ids`.
- TV: `aggregate_credits,content_ratings,watch/providers,videos,recommendations,images,keywords,external_ids,episode_groups`.
- TV ratings: batches of at most 20 `season/{number}` resources.
- Person: `combined_credits,external_ids`.
- Episode: `credits,videos,images`.

These nested resources remain available through `append_to_response`. Only nested
paths independently requested by the app are exposed as standalone endpoints.
The app already uses [TMDB append-to-response](https://developer.themoviedb.org/docs/append-to-response)
where batching helps; no larger detail bundles were introduced.

## Initial-load findings and changes

Before these changes, the globally mounted, closed services sheet loaded both
provider catalogs on every route. Home's service button also called the
same hook; the lower-level client already shared simultaneous identical network
requests, but each hook refreshed on mount and its local-storage cache had no
freshness policy.

On a cold Home load, the visible page requests trending, five discover variants
(movie and TV services shelves, anime, top-rated movies, and digital releases),
plus now-playing. A saved TV collection adds up to 24 basic TV detail requests
for upcoming/recent episodes. After rendering, the reel prefetches its active
title; cards near the viewport fetch availability and sometimes release dates.
These requests support displayed content and remain in place.

The changes reduce unnecessary work:

- The closed services sheet no longer fetches. The service button fetches only
  when it needs selected-service logos. Both consume the same reactive catalog,
  with one in-flight load and a one-day memory/local-storage lifetime keyed by
  region and language. Failed loads can retry through connection recovery.
- Search genre lists load when filters open or a genre appears in the URL.
  Region lists remain deferred until the service picker opens. The low-level
  client keeps successful reference responses for one day.
- Successful appended data seeds the corresponding provider, image, release-date,
  season and basic-detail cache entries. Later standalone requests reuse these
  payloads for the existing ten-minute client lifetime. Missing/failed appended
  resources are not seeded. Simultaneously started requests with different URLs
  can still overlap; this change does not delay card data waiting for prefetches.
- Client query parameters are sorted for consistent cache keys. Identical
  in-flight requests remain shared, and cancelling one consumer leaves other
  consumers' work intact.
- Direct title visits no longer prefetch trending, which is not displayed there.
  Search still loads trending because its spine decoration is visible during
  searches as well as on its landing state.

## Proxy validation and failure behavior

Only GET reaches TMDB. Other supported HTTP method handlers return 405 with
`Allow: GET`. One routing `path` is required; a single optional leading/trailing
slash is removed. Dot segments, repeated separators, encoded leftovers,
backslashes, URLs and paths outside the inventory are rejected.

Queries use per-endpoint validators, including the actual language, region,
search, pagination, image-language and discover sort/filter fields. Pages are
bounded to TMDB's 1–500 range, ID lists to 50 entries, search text to 500
characters, and append lists to 20 unique allowed resources. Duplicate and
unknown parameters are rejected, including caller-provided `api_key`, session
IDs, tokens and callbacks. The proxy creates a new upstream query and inserts
only `process.env.TMDB_API_KEY`; browser cookies and authentication headers are
not forwarded. Redirects are not followed.

An eight-second timeout covers fetching and reading the upstream JSON. Network
or invalid JSON failures return 502; timeouts return 504; missing server
configuration returns 503. Upstream JSON and HTTP statuses (including 401, 404
and 429) are retained, as is `Retry-After`. Error details do not expose the
upstream URL or key.

## Cache policy

Successful JSON responses use `Vercel-CDN-Cache-Control` to cache on Vercel.
Browser `Cache-Control` is `public, max-age=0, must-revalidate`; downstream
`CDN-Cache-Control` is `no-store`. Vercel's targeted header takes precedence,
following [Vercel's cache-control documentation](https://vercel.com/docs/caching/cache-control-headers).

| Category | Fresh lifetime | Stale-while-revalidate | Reason |
| --- | --- | --- | --- |
| Provider catalogs, regions, genre lists | 24 hours | 7 days | Relatively stable reference metadata |
| Movie/TV/person/collection/entity details, images, seasons, episodes, episode groups, IMDb lookups | 1 hour | 6 hours | Metadata changes, but rarely minute to minute |
| Title availability and movie release dates | 30 minutes | 1 hour | Regional availability and release dates need fresher data |
| Detail bundles containing providers or release dates | 30 minutes | 1 hour | Apply the shortest policy needed by bundled resources |
| Trending, discover, now-playing | 5 minutes | 15 minutes | Frequently changing rankings and catalogs |
| Search | 1 minute | 2 minutes | High query variety and changing results |
| `/configuration` recovery probe | Not cached | None | Must check current upstream reachability/key validity |
| Validation errors and upstream failures | Not cached | None | Never retain a failed response as a successful cache entry |

Every failure explicitly sends `no-store` on all three cache-control headers.
No client-side bot mitigation, CAPTCHA, auth token or rate limiting was added.
The allowlist reduces what the proxy can do; it does not stop bots requesting
valid URLs or varying valid queries. Edge mitigation remains Vercel Firewall's
responsibility. CDN hits can avoid function invocations; misses, stale
revalidations and requests rejected inside the function still invoke it.

## Verification

- `npm test`: endpoint compatibility, path/query/append abuse, method rejection,
  server-only key handling, category cache headers, error statuses and timeout.
- `npm run lint`, `npm run check`, `npm run build`: existing repository checks.
- Local browser checks with mocked TMDB responses: deferred provider/genre
  requests, shared provider updates, reload reuse, region changes, direct title
  rendering, appended payload reuse, language isolation and query deduplication.
- Replay requests generated by the real frontend helpers against the production
  handler with a mocked upstream to check allowlist compatibility.

Vite development uses its existing server-side forwarding proxy, so it does not
exercise the production handler or Vercel CDN. After deploying, request the same
`/tmdb/watch/providers/movie?watch_region=IN` URL twice and inspect
`x-vercel-cache` for MISS followed by HIT (cache location/eviction may affect
results). Repeat with search and details, including localized/region-specific
queries. Do not use a cache-busting query, which the allowlist rejects. No
production deployment or live CDN hit-rate claim is made by these local checks.
