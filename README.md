# MovieVault

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

A modern, minimal movie discovery app with a beautiful dark interface. Search thousands of movies, view detailed information, and build your perfect watchlist.

[Features](#-features) • [Design](#-design) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Contributing](#-contributing) • [Screenshots](#-screenshots) • [Live](#-live) • [Author](#-author)

</div>

## ✨ Features

- **Smart Search** - Quickly discover movies with real-time search and suggestions
- **Rich Details** - View comprehensive movie information including plot, cast, ratings, and more
- **Personal Watchlist** - Save movies you want to watch with easy add/remove functionality
- **Modern Design** - Clean, minimal interface with dark theme and smooth animations
- **Fully Responsive** - Seamless experience across mobile, tablet, and desktop
- **Beautiful UI** - High-quality movie posters with elegant card layouts
- **Fast & Smooth** - Powered by Vite with optimized performance
- **Accessible** - WCAG compliant with keyboard navigation support

## Design

MovieVault features a completely redesigned modern interface built with these principles:

- **Minimal & Focused** - Clean layout that prioritizes content discovery
- **Dark Navy Theme** - Comfortable viewing experience with `#1A1F2B` background
- **Typography System** - Inter for UI, Poppins for headings with proper hierarchy
- **Coral Accent** - Warm `#FF6B6B` accent color for interactive elements
- **Generous Whitespace** - Reduces cognitive load and feels premium
- **Subtle Animations** - Framer Motion for smooth, non-intrusive transitions
- **Card-Based Layouts** - Modern grid system that scales beautifully

See [DESIGN.md](./DESIGN.md) for the complete design system documentation.

## Tech Stack

### Frontend
- **[React 19](https://reactjs.org/)** - Latest React with enhanced performance
- **[React Router v7](https://reactrouter.com/)** - Client-side routing with nested routes
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS with custom design tokens
- **[Framer Motion](https://motion.dev/)** - Smooth animations and micro-interactions
- **[Vite](https://vitejs.dev/)** - Lightning-fast build tool and dev server
- **[Lucide React](https://lucide.dev/)** - Beautiful, consistent icons

### API & Data
- **[TMDB API](https://www.themoviedb.org/documentation/api)** - Comprehensive movie database
- **LocalStorage** - Persistent watchlist storage

### Development Tools
- **ESLint** - Code quality and consistency
- **use-debounce** - Optimized search performance

## Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- TMDB API Key (free)

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

3. **Configure API Key**
   
   - Sign up at [TMDB](https://www.themoviedb.org/signup)
   - Get your API key from [API Settings](https://www.themoviedb.org/settings/api)
   - Create `.env` file in the root:

     ```env
     VITE_TMDB_API_KEY=your_api_key_here
     ```

4. **Start development server**

   ```bash
   npm run dev
   ```
   
   Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Build for production**

   ```bash
   npm run build
   npm run preview  # Preview production build
   ```

## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```   
4. **Push to the branch**
   ```bash   
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

Please ensure your code follows the existing style and includes appropriate comments.

## Screenshots

<div align="center"> 
   
   ### Landing Page / HomePage
   ![Landing Page](./public/screenshots/LandingPage.png)

   ### Search Results
   ![Search Results](./public/screenshots/SearchResults.png)

   ### Selecting a Result
   ![Selecting a Result](./public/screenshots/SearchResultPress.png)

   ### Watchlist Page
   ![Watchlist Page](./public/screenshots/WatchList.png)

   ### Movie Details Page
   ![Movie Details Page](./public/screenshots/MovieDetailsPage.png)

   ### Adding to Watchlist
   ![Adding to Watchlist](./public/screenshots/AddToWatchlist.png)

   ### 404 Page
   ![Page Not Found](./public/screenshots/PageNotFound.png)

</div>

## Live Demo

<div align="center">
   
   [![Visit Site](https://img.shields.io/badge/Visit_Site-000?style=for-the-badge&logo=vercel&logoColor=white)](https://movie-watchlist-fawn-three.vercel.app/)

   Experience MovieVault live on Vercel

</div>

## Author

**Ashwin S Nambiar**

- Portfolio: [ashwin.co.in](https://ashwin.co.in)
- GitHub: [@Ashwin-S-Nambiar](https://github.com/Ashwin-S-Nambiar)
- Contact: Through portfolio website

---

<div align="center">

### ⭐ Star this repo if you find it useful!

Made with ❤️ and ☕ by Ashwin S Nambiar

</div>
