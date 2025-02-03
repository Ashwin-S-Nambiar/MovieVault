import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import HomePage from './pages/HomePage';
import WatchlistPage from './pages/WatchlistPage';
import MoviePage from './pages/MoviePage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/movie/:id" element={<MoviePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;