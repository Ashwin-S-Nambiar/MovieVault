# MovieVault 🎬

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

A user-friendly web application to discover movies, curate a personalized watchlist and read movie descriptions using the OMDb API.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Contributing](#-contributing) • [Screenshots](#-screenshots) • [Live](#-live) • [Author](#-author)

</div>

## ✨ Features

- 🔍 **Search Functionality** - Quickly find movies by title.
- 📽️ **Detailed Movie Information** - Access plot summaries, release year, genre, and more.
- 📝 **Personalized Watchlist** - Add or remove movies to keep track of what to watch.
- 📱 **Responsive Design** - Fully adaptive across all devices.
- 🎨 **Smooth Animations** - Fluid transitions powered by Framer Motion.

## 🛠 Tech Stack

### Frontend
- **[React](https://reactjs.org/)** - UI component development
- **[React Router](https://reactrouter.com/)** - Declarative routing
- **[TailwindCSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion](https://www.framer.com/motion/)** - Animations and gestures
- **[Vite](https://vitejs.dev/)** - Fast build tool and development server

### API
- **[OMDb API](https://www.omdbapi.com/)** - RESTful web service to obtain movie information

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Ashwin-S-Nambiar/MovieVault.git
   cd MovieVault
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Obtain OMDb API Key**  
   - Visit [OMDb API](https://www.omdbapi.com/) to request a free API key.
   - Create a `.env` file in the root directory and add your API key:

     ```
     VITE_API_KEY=your_api_key_here
     ```

4. **Start the development server**

   ```bash
   npm run dev
   ```
   **The application will be accessible at `http://localhost:5173`.**

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes and commit them:

   ```bash
   git commit -m 'Add some feature'
   ```   

4. Push to the branch:

   ```bash   
   git push origin feature/your-feature-name
   ```

5. Open a Pull Request to the main branch.

## 📸 Screenshots

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

## 🌍 Live

<div align="center">
   
   [![Visit](https://img.shields.io/badge/Visit_Site-000?style=for-the-badge&logo=vercel&logoColor=white)](https://movie-watchlist-fawn-three.vercel.app/)

</div>

## 👤 Author

### Ashwin S Nambiar
- Portfolio: [ashwin-s-nambiar.is-a.dev](https://ashwin-s-nambiar.is-a.dev/)
- GitHub: [@Ashwin-S-Nambiar](https://github.com/Ashwin-S-Nambiar)

---

<div align="center">
Made with ❤️ by Ashwin S Nambiar
</div>
