import { IconArrowUpRight } from '@tabler/icons-react';

export default function ExternalLinks({ ids = {}, homepage, person = false }) {
  const links = [
    homepage && ['Official site', homepage],
    ids.imdb_id && [
      'IMDb',
      `https://www.imdb.com/${person ? 'name' : 'title'}/${ids.imdb_id}/`,
    ],
    ids.wikidata_id && [
      'Wikipedia',
      `https://www.wikidata.org/wiki/Special:GoToLinkedPage/enwiki/${ids.wikidata_id}`,
    ],
    ids.instagram_id && [
      'Instagram',
      `https://www.instagram.com/${ids.instagram_id}/`,
    ],
    ids.twitter_id && ['X', `https://x.com/${ids.twitter_id}`],
  ].filter(Boolean);

  if (!links.length) return null;

  return (
    <div className="ext-links">
      {links.map(([label, href]) => (
        <a
          key={label}
          className="chip ext-link"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {label}
          <IconArrowUpRight stroke={2} />
        </a>
      ))}
    </div>
  );
}
