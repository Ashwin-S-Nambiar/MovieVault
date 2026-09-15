import { BrowserRouter, Route, Routes } from 'react-router';
import Layout from './Layout';
import HomePage from './pages/HomePage';
import MoviePage from './pages/MoviePage';
import NotFoundPage from './pages/NotFoundPage';
import WatchlistPage from './pages/WatchlistPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/movie/:id" element={<MoviePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
