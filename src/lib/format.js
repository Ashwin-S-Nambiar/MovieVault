export const ANIMATION_GENRE = 16;

export const TYPE_LABEL = {
  movie: 'Movie',
  tv: 'Series',
  anime: 'Anime',
};

export const yearOf = (date) => (date ? date.slice(0, 4) : '');

export function slugify(text = '') {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export const titleHref = (item) =>
  `/${item.type}/${item.id}${item.title ? `-${slugify(item.title)}` : ''}`;

export const personHref = (person) =>
  `/person/${person.id}${person.name ? `-${slugify(person.name)}` : ''}`;

export const parseId = (param) => {
  const match = /^([1-9]\d*)(?:-.*)?$/.exec(param ?? '');
  return match ? Number(match[1]) : null;
};

export function isAnime(raw) {
  const genres = raw.genre_ids ?? raw.genres?.map((g) => g.id) ?? [];
  return (
    genres.includes(ANIMATION_GENRE) &&
    (raw.original_language === 'ja' ||
      raw.origin_country?.includes('JP') ||
      false)
  );
}

export function toItem(raw, fallbackType) {
  if (!raw) return null;
  const type = raw.media_type ?? fallbackType;
  if (type !== 'movie' && type !== 'tv') return null;
  const date = type === 'movie' ? raw.release_date : raw.first_air_date;
  return {
    key: `${type}-${raw.id}`,
    id: raw.id,
    type,
    kind: isAnime(raw) ? 'anime' : type,
    title: (type === 'movie' ? raw.title : raw.name) ?? raw.original_title,
    year: yearOf(date),
    date: date ?? '',
    poster: raw.poster_path ?? null,
    backdrop: raw.backdrop_path ?? null,
    overview: raw.overview ?? '',
    rating: raw.vote_average ? Math.round(raw.vote_average * 10) / 10 : null,
    votes: raw.vote_count ?? 0,
    popularity: raw.popularity ?? 0,
  };
}

export const toItems = (list = [], fallbackType) =>
  list.map((raw) => toItem(raw, fallbackType)).filter(Boolean);

export function runtime(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m ? `${m}m` : ''}`.trim() : `${m}m`;
}

export function longDate(date) {
  if (!date) return '';
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function compactMoney(value) {
  if (!value) return '';
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const DAY = 86_400_000;

export function watchStatus(item, rows, release = rows?.release) {
  if (!item || !rows) return null;
  if (rows.list.length) return null;
  const today = new Date().toISOString().slice(0, 10);
  const digital = release?.digital;
  const digitalSoon = digital && digital > today;
  const opened = release?.theatrical ?? item.date;
  if (!opened || opened > today) {
    return {
      tone: 'soon',
      label: item.date
        ? `Coming ${new Date(`${item.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`
        : 'Coming soon',
      digital: digitalSoon ? digital : null,
    };
  }
  if (item.type === 'movie' && digitalSoon) {
    return { tone: 'cinema', label: 'In cinemas', digital };
  }
  const age = (Date.now() - Date.parse(opened)) / DAY;
  if (item.type === 'movie' && !digital && age <= 120) {
    return { tone: 'cinema', label: 'In cinemas' };
  }
  if (rows.buyable) return { tone: 'rent', label: 'Rent or buy' };
  return { tone: 'none', label: 'Not streaming' };
}
