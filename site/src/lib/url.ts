// Prefix site-internal links with the deploy base path (e.g. '/andreas-poettler.github.io' on GitHub Pages, '' in production).
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const url = (path: string) => base + path;
export const stripBase = (pathname: string) => (base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname) || '/';
