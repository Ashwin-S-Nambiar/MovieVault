import { useEffect } from 'react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import OpenCase from '../components/OpenCase';
import Topbar from '../components/Topbar';
import { usePageMeta } from '../lib/meta';

export default function NotFound({
  title = 'Page not found',
  message = "This case is empty. The page you're after was moved or never existed.",
}) {
  usePageMeta({ title });

  useEffect(() => {
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex';
    document.head.append(robots);
    return () => robots.remove();
  }, []);

  return (
    <main className="nf route">
      <Topbar />
      <OpenCase open hero={false} style={{ '--pw': '72px' }} />
      <h1 className="nf-code">404</h1>
      <p>{message}</p>
      <div className="detail-actions">
        <Link to="/" className="btn btn-solid" viewTransition>
          Back to home
        </Link>
        <Link to="/search" className="btn" viewTransition>
          Search
        </Link>
      </div>
    </main>
  );
}

export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  usePageMeta({ title: notFound ? 'Page not found' : 'Something went wrong' });

  if (notFound) return <NotFound />;

  return (
    <main className="nf route">
      <Topbar />
      <p className="nf-code">:(</p>
      <p>Something broke while loading this page.</p>
      <div className="detail-actions">
        <button
          type="button"
          className="btn btn-solid"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
        <Link to="/" className="btn">
          Back to home
        </Link>
      </div>
    </main>
  );
}
