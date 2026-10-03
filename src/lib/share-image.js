export const SHARE_ORIGIN = 'https://movievault.ashwin.co.in';
export const routeImage = (path) =>
  /^\/(movie|tv|universe)\/[^/]+\/?$/.test(path)
    ? `${SHARE_ORIGIN}/api/og?route=${encodeURIComponent(path.replace(/\/$/, ''))}&v=1`
    : null;
