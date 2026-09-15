import { Link } from 'react-router';
import OpenCase from '../components/OpenCase';

export default function NotFound() {
  return (
    <main className="nf route">
      <OpenCase open hero={false} style={{ '--pw': '72px' }} />
      <h1 className="nf-code">404</h1>
      <p>
        This case is empty. The page you're after was moved or never existed.
      </p>
      <div className="detail-actions">
        <Link to="/" className="btn btn-solid">
          Back to the reel
        </Link>
        <Link to="/search" className="btn">
          Search
        </Link>
      </div>
    </main>
  );
}
