export const UNIVERSES = [
  {
    slug: 'mcu',
    name: 'Marvel Cinematic Universe',
    keyword: 180547,
    backdrop: '/2UNUv4NJdC36E5myDHACBJ99EwL.jpg',
    tint: 'peach',
  },
  {
    slug: 'dcu',
    name: 'DC Universe',
    keyword: 312528,
    backdrop: '/yRBc6WY3r1Fz5Cjd6DhSvzqunED.jpg',
    tint: 'sky',
  },
  {
    slug: 'dceu',
    name: 'DC Extended Universe',
    keyword: 229266,
    backdrop: '/13Nz8EchKRdCgJcKdEoJAnpiVn2.jpg',
    tint: 'lilac',
  },
  {
    slug: 'star-wars',
    name: 'Star Wars',
    collection: 10,
    backdrop: '/iY2ujEY2m68OTTlPFTiHub9joHS.jpg',
    tint: 'butter',
  },
  {
    slug: 'wizarding-world',
    name: 'Harry Potter',
    collection: 1241,
    backdrop: '/4gV0rKUjB1nLUdZB4zIltLvNZZr.jpg',
    tint: 'lilac',
  },
  {
    slug: 'middle-earth',
    name: 'The Lord of the Rings',
    collection: 119,
    backdrop: '/bccR2CGTWVVSZAG0yqmy3DIvhTX.jpg',
    tint: 'mint',
  },
  {
    slug: 'jurassic',
    name: 'Jurassic Park',
    collection: 328,
    backdrop: '/njFixYzIxX8jsn6KMSEtAzi4avi.jpg',
    tint: 'mint',
  },
  {
    slug: 'dune',
    name: 'Dune',
    collection: 726871,
    backdrop: '/fahk0Fu7VUUfK6IkTt1R3waOD9F.jpg',
    tint: 'butter',
  },
  {
    slug: 'spider-verse',
    name: 'Spider-Verse',
    collection: 573436,
    backdrop: '/xLg6LRJ6VqwJX3ZiB6mRhLYAg3I.jpg',
    tint: 'sky',
  },
  {
    slug: 'john-wick',
    name: 'John Wick',
    collection: 404609,
    backdrop: '/fSwYa5q2xRkBoOOjueLpkLf3N1m.jpg',
    tint: 'sky',
  },
  {
    slug: 'mission-impossible',
    name: 'Mission: Impossible',
    collection: 87359,
    backdrop: '/mroWh717g0Ah2c0rrPGW6f3EWMM.jpg',
    tint: 'peach',
  },
  {
    slug: 'the-dark-knight',
    name: 'The Dark Knight',
    collection: 263,
    backdrop: '/xyhrCEdB4XRkelfVsqXeUZ6rLHi.jpg',
    tint: 'lilac',
  },
  {
    slug: 'the-matrix',
    name: 'The Matrix',
    collection: 2344,
    backdrop: '/bRm2DEgUiYciDw3myHuYFInD7la.jpg',
    tint: 'mint',
  },
  {
    slug: 'mad-max',
    name: 'Mad Max',
    collection: 8945,
    backdrop: '/zI0q2ENcQOLECbe0gAEGlncVh2j.jpg',
    tint: 'butter',
  },
  {
    slug: 'toy-story',
    name: 'Toy Story',
    collection: 10194,
    backdrop: '/hApclyB9NEZEQujAVajzi5iWE4a.jpg',
    tint: 'sky',
  },
  {
    slug: 'fast-and-furious',
    name: 'Fast & Furious',
    collection: 9485,
    backdrop: '/z5A5W3WYJc3UVEWljSGwdjDgQ0j.jpg',
    tint: 'peach',
  },
  {
    slug: 'alien',
    name: 'Alien',
    collection: 8091,
    backdrop: '/6X42JnSMdo3dPAswOHUuvebdTq7.jpg',
    tint: 'lilac',
  },
  {
    slug: 'planet-of-the-apes',
    name: 'Planet of the Apes',
    collection: 173710,
    backdrop: '/iMhm0g555HgQNIXAMvnlgOiW5Rz.jpg',
    tint: 'butter',
  },
];

export const findUniverse = (slug) => UNIVERSES.find((u) => u.slug === slug);

export const universeHref = (collectionId) => {
  const known = UNIVERSES.find((u) => u.collection === collectionId);
  return `/universe/${known ? known.slug : collectionId}`;
};
