# MovieVault

<div align="center">

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![React Router](https://img.shields.io/badge/React_Router_8-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TMDB](https://img.shields.io/badge/TMDB-01B4E4?style=for-the-badge&logo=themoviedatabase&logoColor=white)

Find where any film, series or anime is streaming, follow whole universes in release order, and keep a vault of what to watch next.

[Features](#features) • [Design](#design) • [Tech stack](#tech-stack) • [Installation](#installation) • [Screenshots](#screenshots)

</div>

## Features

- **The reel.** Trending films and series sit on a 3D ring of DVD cases that turns on its own and pauses while you hover. Drag, flick, scroll sideways or use the arrow keys; tap the centre case and it flies into the detail page and opens to reveal the disc, then closes and flies back when you return.
- **Where to watch.** Every title lists the services it streams, rents or sells on in your region, with the services you pay for first. Availability comes from JustWatch through TMDB.
- **Your services.** Pick your streaming services and region once. Home shows what's popular on them, and search can filter to only what you can watch tonight.
- **Films, series and anime.** One search across all three with type filters, sorting, infinite scroll and recent searches. Anime is recognised through TMDB's anime keyword, so it gets its own shelf and filter.
- **Universes.** Franchises like the MCU, Star Wars, Middle-earth and Dune laid out as a timeline: every film in release order, what's upcoming, the span, the average rating and one tap to save them all.
- **Connected titles.** Every detail page shows what came before and after it in release order, for films, series and anime alike, with a strip of the whole franchise and a link to its universe.
- **Series detail.** Seasons with episode lists, the next episode's air date, networks and creators.
- **Rich detail pages.** Local age ratings, runtime, tagline, genres, cast, crew, budget and box office, the official trailer and recommendations.
- **The vault.** Save anything with a bookmark, filter it by type, sort it, and undo any removal.
- **Honest API status.** The app watches the requests it really makes. Failed requests retry with backoff, and a small pill only appears when TMDB is unreachable, you're offline or the key is wrong, with a retry button.
- **Light and dark.** Follows the system, or pick one in the services sheet.

## Design

- **Motion with a purpose.** The reel is positioned every frame with plain maths and settles on a critically damped spring, so drags hand their momentum straight into the glide. Pages move with the View Transitions API, so the case you tap is the case that opens, and it only flies back to where you actually came from.
- **Calm loading.** Skeletons match the real layout and share one synchronised sweep, images fade in, and results stay on screen while new ones load, so nothing jumps or flashes.
- **Restraint.** Warm off-white ground, near-black ink, one red for saving, and pastel chips for browsing.
- **Typography.** One family: Geist for everything, Geist Mono for small numbers like years.
- **Built for phones first.** A bottom search dock that rides above the keyboard, drag-to-dismiss sheets, 44px touch targets and safe-area padding, scaling up to a two-column detail page and a wider ring on desktop.
- **Accessible.** Keyboard navigation throughout, focus management in dialogs, and `prefers-reduced-motion` respected everywhere.

## Tech stack

- **[React 19](https://react.dev/)** with a data router from **[React Router 8](https://reactrouter.com/)** for view transitions and scroll restoration
- **[Tailwind CSS 4](https://tailwindcss.com/)** for the reset, with a hand-written token-based stylesheet
- **[Vite 8](https://vite.dev/)** for development and builds
- **[Tabler Icons](https://tabler.io/icons)**
- **[TMDB API](https://developer.themoviedb.org/docs/getting-started)** for titles, providers, collections, credits, seasons and videos
- **[Biome](https://biomejs.dev/)** for linting and formatting

No animation or data-fetching libraries: the carousel, sheets, toasts, request cache and stores are small modules in `src/lib` and `src/components`.

## Installation

### Prerequisites

- Node.js 22.22+ and npm
- A free TMDB API key

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/Ashwin-S-Nambiar/MovieVault.git
   cd MovieVault
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Add your API key**

   Get a key from [TMDB API settings](https://www.themoviedb.org/settings/api) and create a `.env` file in the root:

   ```env
   VITE_TMDB_API_KEY=your_api_key_here
   ```

4. **Start the dev server**

   ```bash
   npm run dev
   ```

5. **Lint and format**

   ```bash
   npm run check      # Lint, format and import-order checks
   npm run check:fix  # Apply safe fixes and formatting
   ```

   A pre-commit hook runs Biome on staged files, and GitHub Actions runs `biome ci` and the build on every push and pull request.

6. **Build for production**

   ```bash
   npm run build
   npm run preview
   ```

### Project layout

```
src/
  components/  reel, cases, sheets, toasts, status pill, shelves, cards
  lib/         TMDB client and catalogue, stores, hooks, universes
  pages/       home, search, title, vault, universes, universe, not found
  index.css    design tokens, themes and every component style
```

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push the branch: `git push origin feature/amazing-feature`
5. Open a pull request

## Screenshots

<div align="center">

### Home
![The reel of trending titles on a ring of DVD cases](./docs/screenshots/MovieVault.webp)

### Search
![The shelf of trending spines above the browse cards and trending grid](./docs/screenshots/MovieVault-6.webp)

![Search results for Batman across films and series](./docs/screenshots/MovieVault-1.webp)

### Title
![Jurassic Park with its case open, streaming services and its universe](./docs/screenshots/MovieVault-2.webp)

### Connected titles
![Resident Evil with the previous and next film and the whole franchise in release order](./docs/screenshots/MovieVault-5.webp)

### Universes
![Every universe as a grid of backdrops](./docs/screenshots/MovieVault-8.webp)

![The Star Wars universe as a release-order timeline](./docs/screenshots/MovieVault-3.webp)

### Vault
![Saved titles with where each one streams](./docs/screenshots/MovieVault-7.webp)

### Dark mode
![The reel in dark mode](./docs/screenshots/MovieVault-9.webp)

### On a phone
![Home, an anime detail page and anime search on a phone](./docs/screenshots/MovieVault-4.webp)

</div>

## Live demo

<div align="center">

[![Visit Site](https://img.shields.io/badge/Visit_Site-000?style=for-the-badge&logo=vercel&logoColor=white)](https://movievault.ashwin.co.in)

</div>

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability is provided by JustWatch.

---

<div align="center">

Made by Ashwin S Nambiar

</div>
