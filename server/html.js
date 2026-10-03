import { ORIGIN } from './share.js';

export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char],
  );

export function pageHtml(template, meta) {
  const url = `${ORIGIN}${meta.path}`;
  const values = {
    description: meta.description,
    'og:title': meta.title,
    'og:description': meta.description,
    'og:url': url,
    'og:type': meta.type,
    'og:image': meta.image,
    'og:image:type': meta.imageType,
    'og:image:alt': meta.title,
    'twitter:title': meta.title,
    'twitter:description': meta.description,
    'twitter:image': meta.image,
  };
  let html = template.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(meta.title)}</title>`,
  );
  html = html.replace(/<meta\b[^>]*>/g, (tag) => {
    const key = tag.match(/\b(?:name|property)="([^"]+)"/)?.[1];
    return Object.hasOwn(values, key)
      ? tag.replace(/\bcontent="[^"]*"/, `content="${escapeHtml(values[key])}"`)
      : tag;
  });
  html = html.replace(
    /<link\b[^>]*rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
  );
  if (meta.status === 404)
    html = html.replace(
      '</head>',
      '<meta name="robots" content="noindex" /></head>',
    );
  return html;
}
